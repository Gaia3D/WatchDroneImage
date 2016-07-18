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
    _SERVICE_FOLDER = None
    __watch_dict = {}

    def __init__(self, patterns=None, ignore_patterns=None,
            ignore_directories=False, case_sensitive=False,
            wait_second=10, service_folder=None):
        super(CompleteEventHandler, self).__init__(patterns, ignore_patterns,
                                                   ignore_directories, case_sensitive)

        self._WAIT_SECOND = wait_second
        self._SERVICE_FOLDER = service_folder

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
        if not self._SERVICE_FOLDER:
            dst_folder = src_folder
        else:
            dst_folder = self._SERVICE_FOLDER
        org_name, ext = os.path.splitext(os.path.basename(path))
        nb_file = os.path.join(dst_folder, "{}_nb.tif".format(org_name))
        trans_file = os.path.join(dst_folder, "{}_nb_4326.tif".format(org_name))
        tiled_file = os.path.join(dst_folder, "{}_nb_4326_tiled.tif".format(org_name))

        worldFile = "{}.jgw".format(os.path.splitext(path)[0])
        print worldFile
        while(True):
            if os.access(worldFile, os.W_OK):
                break
            time.sleep(1)

        subprocess.call(['nearblack', '-of', 'GTiff', '-color', '205,205,205', '-setalpha', path, '-o',
                         nb_file])
        subprocess.call(['gdalwarp', '-r', 'cubic', '-of', 'GTiff', '-s_srs', 'EPSG:5186', '-t_srs', 'EPSG:4326',
                         nb_file, trans_file])
        subprocess.call(['gdal_translate', '-of', 'GTiff', '-co', 'TILED=YES', trans_file, tiled_file])
        subprocess.call(['gdaladdo', '-r', 'average', tiled_file, '2', '4', '8', '16', '32', '64'])
        os.remove(nb_file)
        os.remove(trans_file)

        image_name = "{}_nb_4326_tiled.tif".format(org_name)
        self.insertDB(image_name,dst_folder)
        self.updateBbox()
        print "End process : " + org_name
        # subprocess.call(["gdaltindex", os.path.join(dst_folder, "{}.shp".format(os.path.basename(dst_folder))),
        #                 os.path.join(dst_folder, '*_nb_4326_tiled.tif')])

    def connectDB(self):
        ip = 'localhost'
        db = 'uos_image'
        user = 'postgres'
        pw = 'gaia3d'

        self.conn = psycopg2.connect(host=ip, database=db, user=user, password=pw)
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
        # 밀리세컨드가 들어가면 이미지가 안나옴
        reformat_time = '{}:{}:{}'.format(time[:2],time[2:4],time[4:6])
        imageDate = '{} {}'.format(date, reformat_time)

        sql = u"insert into uos_fast (the_geom, location, image_dttm) " \
        u"values(ST_SetSRID(ST_GeomFromText('{}'),4326), '{}', '{}'); commit".format(geomWkt, imageFile, imageDate)
        self.cur.execute(sql)
        self.conn.commit()

    def updateBbox(self):
        sql = u"with geom_union as (select st_envelope(st_union(the_geom)) as geom from uos_fast) " \
              u"select st_xmin(geom), st_xmax(geom), st_ymin(geom), st_ymax(geom) from geom_union"
        self.cur.execute(sql)

        result = self.cur.fetchone()

        cat = Catalog("http://localhost:8081/geoserver/rest",username ="admin",password="geoserver")
        coverage = cat.get_resource_by_url("http://localhost:8081/geoserver/rest/workspaces/uos/coveragestores/"
                                           "uos_image/coverages/uos_fast.xml")

        coverage.native_bbox = (str(result[0]),str(result[1]),str(result[2]),str(result[3]),"EPSG:4326")
        cat.save(coverage)

if __name__ == "__main__":
    WATCH_FOLDER = "c:\\ftp_root"
    SERVICE_FOLDER = "c:\\temp\\uos_fast"
    PATTERN = ["*.jpg"]
    WAIT_SECOND = 10
    print "Watching Folder : " + WATCH_FOLDER
    logging.basicConfig(level=logging.INFO,
                        format='%(asctime)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S')

    event_handler = CompleteEventHandler(patterns=PATTERN, wait_second=WAIT_SECOND, service_folder=SERVICE_FOLDER)
    observer = Observer()
    observer.schedule(event_handler, path=os.path.abspath(WATCH_FOLDER),
            recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()