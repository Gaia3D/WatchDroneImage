# -*- coding: utf-8 -*-
# 참고: https://github.com/gorakhargosh/watchdog/

import sys
import time
import logging
import os
import subprocess
import threading
from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler
import psycopg2
from osgeo import gdal
from geoserver.catalog import Catalog

class CompleteEventHandler(PatternMatchingEventHandler):
    _WAIT_SECOND = 10
    __watch_dict = {}

    WAIT_SECOND = 10
    #PATTERN = ["*.jpg"]
    #WORLD_EXT = "jgw"
    PATTERN = ["*.png"]
    WORLD_EXT = "pgw"
    WATCH_FOLDER = "/tools/watchDroneImages/UOS_FTP/Result"
    SERVICE_FOLDER = "/tools/watchDroneImages/uos_upload_image"

    HTTP = 'http://'
    WATCH_URL = 'lgs.mago3d.com:8080'

    GEOSERVER_URL = 'lgs.mago3d.com:8080'
    GEOSERVER_USER = 'admin'
    GEOSERVER_PASSWORD = 'geoserver'
    GEOSERVER_LAYER_NAME = 'uos_upload_image'
    
    DATABASE_URL = 'lgs.mago3d.com'
    DATABASE_USER = 'postgres'
    DATABASE_PASSWORD = 'postgres'
    DATABASE_NAME = 'uos_image'
    DATABASE_TABLE_NAME = '\"' + GEOSERVER_LAYER_NAME + '\"'
    
    # ip = 'localhost'
    # db = 'uos_image'
    # user = 'postgres'
    # pw = 'gaia3d'



    def __init__(self, patterns=None, ignore_patterns=None,
            ignore_directories=False, case_sensitive=False):
        if not patterns:
            patterns = self.PATTERN
            
        super(CompleteEventHandler, self).__init__(patterns, ignore_patterns, ignore_directories, case_sensitive)

        self.connectDB()

    def wait_complete_event(self, path):
        if self.__watch_dict.has_key(path):
            self.__watch_dict[path].cancel()
        t = threading.Timer(self._WAIT_SECOND, self.on_complete, args=[path])
        self.__watch_dict[path] = t
        t.start()

    def on_created(self, event):
        super(CompleteEventHandler, self).on_created(event)

        what = 'directory' if event.is_directory else 'file'
        logging.info("Created %s: %s", what, event.src_path)

        self.wait_complete_event(event.src_path)

    def on_modified(self, event):
        super(CompleteEventHandler, self).on_modified(event)

        what = 'directory' if event.is_directory else 'file'
        logging.info("Modified %s: %s", what, event.src_path)

        self.wait_complete_event(event.src_path)

    def on_complete(self, path):
        self.__watch_dict.pop(path, None)  # Remove key
        logging.info("COMPLETED: %s", path)
        self.run_convert(path)

    def run_convert(self, path):
        src_folder = os.path.dirname(path)
        if not self.SERVICE_FOLDER:
            dst_folder = src_folder
        else:
            dst_folder = self.SERVICE_FOLDER

        org_name, ext = os.path.splitext(os.path.basename(path))
        nb_file = os.path.join(dst_folder, "{}_nb.tif".format(org_name))
        trans_file = os.path.join(dst_folder, "{}_nb_4326.tif".format(org_name))
        tiled_file = os.path.join(dst_folder, "{}_nb_4326_tiled.tif".format(org_name))


        worldFile = ("{}." + self.WORLD_EXT).format(os.path.splitext(path)[0])

        print worldFile
        while(True):
			
			#print os.access(worldFile, os.W_OK)
			
            if os.access(worldFile, os.W_OK):
                break
            time.sleep(1)

        #subprocess.call(['nearblack', '-of', 'GTiff', '-color', '205,205,205', '-setalpha', path, '-o', nb_file])
        #subprocess.call(['gdalwarp', '-r', 'cubic', '-of', 'GTiff', '-s_srs', 'EPSG:5186', '-t_srs', 'EPSG:4326',  nb_file, trans_file])
        #subprocess.call(['gdalwarp', '-r', 'cubic', '-of', 'GTiff',  path, trans_file])
        subprocess.call(['gdal_translate', '-of', 'GTiff', '-co', 'TILED=YES', path, tiled_file])
        subprocess.call(['gdaladdo', '-r', 'average', tiled_file, '2', '4', '8', '16', '32', '64', '128', '256' , '512'])
        # os.remove(nb_file)
        #os.remove(trans_file)

        image_name = "{}_nb_4326_tiled.tif".format(org_name)
        self.insertDB(image_name,dst_folder)
        self.updateBbox()
        print "End process : " + org_name
        # subprocess.call(["gdaltindex", os.path.join(dst_folder, "{}.shp".format(os.path.basename(dst_folder))),
        #                 os.path.join(dst_folder, '*_nb_4326_tiled.tif')])

    def connectDB(self):

        self.conn = psycopg2.connect(host=self.DATABASE_URL, database=self.DATABASE_NAME, user=self.DATABASE_USER, password=self.DATABASE_PASSWORD)
        self.cur = self.conn.cursor()

    def insertDB(self,imageFile,dst_folder):
        ds = gdal.Open(os.path.join(dst_folder, imageFile))

        width = ds.RasterXSize
        height = ds.RasterYSize
        gt = ds.GetGeoTransform()
        minx = gt[0]
        miny = gt[3] + width * gt[4] + height * gt[5]
        maxx = gt[0] + width * gt[1] + height * gt[2]
        maxy = gt[3]

        geomWkt = "POLYGON(({0} {1}, {0} {3}, {2} {3}, {2} {1}, {0} {1}))".format(minx, miny, maxx, maxy)

        imageName = os.path.splitext(imageFile)[0]
        split_name = imageName.split('_')
        date = split_name[0]
        time = split_name[1]
        reformat_time = '{}:{}:{}'.format(time[:2],time[2:4],time[4:6])
        imageDate = '{} {}'.format(date, reformat_time)

        sql = u"insert into " + self.DATABASE_TABLE_NAME + u" (the_geom, location, image_dttm) " \
        u"values(ST_SetSRID(ST_GeomFromText('{}'),4326), '{}', '{}'); commit".format(geomWkt, imageFile, imageDate)
        self.cur.execute(sql)
        self.conn.commit()

    def updateBbox(self):
        sql = u"with geom_union as (select st_envelope(st_union(the_geom)) as geom from " + self.DATABASE_TABLE_NAME + u") " \
              u"select st_xmin(geom), st_xmax(geom), st_ymin(geom), st_ymax(geom) from geom_union"
        self.cur.execute(sql)

        result = self.cur.fetchone()

        cat = Catalog(self.HTTP + self.GEOSERVER_URL + "/geoserver/rest",username = self.GEOSERVER_USER, password=self.GEOSERVER_PASSWORD)
        print self.HTTP + self.GEOSERVER_URL + "/geoserver/rest/workspaces/uos/coveragestores/" + "uos_upload_image/coverages/" + self.DATABASE_TABLE_NAME + ".xml"
        coverage = cat.get_resource_by_url(self.HTTP + self.GEOSERVER_URL + "/geoserver/rest/workspaces/uos/coveragestores/" + "uos_upload_image/coverages/" + self.GEOSERVER_LAYER_NAME + ".xml")

        coverage.native_bbox = (str(result[0]),str(result[1]),str(result[2]),str(result[3]),"EPSG:4326")
        cat.save(coverage)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')

    event_handler = CompleteEventHandler()
    print "Watching Folder : " + event_handler.WATCH_FOLDER
    observer = Observer()
    observer.schedule(event_handler, path=os.path.abspath(event_handler.WATCH_FOLDER), recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()

    if observer.isAlive() :
        observer.stop()
    observer.join()
