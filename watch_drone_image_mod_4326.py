# -*- coding: utf-8 -*-
# 참고: https://github.com/gorakhargosh/watchdog/

import sys
import time
import logging
import os
import subprocess
import threading
import requests
import pycurl
import pyproj
from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler
import psycopg2
from osgeo import gdal
from geoserver.catalog import Catalog
from urllib import urlencode

GEOWEBCACHE_GRIDSET_LIST = {}


class CompleteEventHandler(PatternMatchingEventHandler):
    _WAIT_SECOND = 10
    __watch_dict = {}

    WAIT_SECOND = 10
    #PATTERN = ["*.jpg"]
    #WORLD_EXT = "jgw"
    PATTERN = ["*.png"]
    WORLD_EXT = "pgw"
    WATCH_FOLDER = "d:\Documents\livedronemap\UOS_FTP\Result"
    #SERVICE_FOLDER = "d:\Documents\web\data\uos_upload_image"
    SERVICE_FOLDER = "c:\data\uos_upload_image"

    HTTP = 'http://'
    WATCH_URL = 'www.opengds.re.kr'

    GEOSERVER_URL = 'www.opengds.re.kr'
    GEOSERVER_USER = 'admin'
    GEOSERVER_PASSWORD = 'geoserver'
    GEOSERVER_STORE_NAME = 'uos'
    GEOSERVER_LAYER_NAME = 'uos_upload_image'
	
	
    
    DATABASE_URL = 'wgs.opengds.re.kr'
    DATABASE_USER = 'postgres'
    DATABASE_PASSWORD = 'postgres'
    DATABASE_NAME = 'uos_image'
    DATABASE_TABLE_NAME = '\"' + GEOSERVER_LAYER_NAME + '\"'
	
    GEOWEBCACHE_BOX_LEVEL = 19
	#GEOWEBCACHE_GRIDSET_LIST = {}
    
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

        start_timer = time.time()

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
        subprocess.call(['gdal_translate', '-of', 'GTiff', '-a_srs', 'EPSG:4326', '-co', 'TILED=YES', path, tiled_file])

        subprocess.call(['gdaladdo', '-r', 'average', tiled_file, '2', '4', '8', '16', '32', '64', '128', '256' , '512', '1024'])

        # os.remove(nb_file)
        #os.remove(trans_file)

        image_name = "{}_nb_4326_tiled.tif".format(org_name)

        logging.debug( "processing..... " + org_name)

        self.insertDB(image_name,dst_folder)
        self.updateBbox()
        logging.info( "End process : " + org_name)
        # subprocess.call(["gdaltindex", os.path.join(dst_folder, "{}.shp".format(os.path.basename(dst_folder))),
        #                 os.path.join(dst_folder, '*_nb_4326_tiled.tif')])

        end_timer = time.time() - start_timer

        logging.debug( "process time of " + org_name + " : " + str(end_timer))
        logging.info( "process time of " + org_name + " : " + str(end_timer))

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

        self.putGridSet(self.GEOWEBCACHE_BOX_LEVEL, minx, miny, maxx, maxy)
		
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

        #self.conn.close()

    def updateBbox(self):
        sql = u"with geom_union as (select st_envelope(st_union(the_geom)) as geom from " + self.DATABASE_TABLE_NAME + u") " \
              u"select st_xmin(geom), st_xmax(geom), st_ymin(geom), st_ymax(geom) from geom_union"
        self.cur.execute(sql)

        result = self.cur.fetchone()

        #self.cur.close()

        cat = Catalog(self.HTTP + self.GEOSERVER_URL + "/geoserver/rest",username = self.GEOSERVER_USER, password=self.GEOSERVER_PASSWORD)
        print self.HTTP + self.GEOSERVER_URL + "/geoserver/rest/workspaces/uos/coveragestores/" + "uos_upload_image/coverages/" + self.DATABASE_TABLE_NAME + ".xml"
        coverage = cat.get_resource_by_url(self.HTTP + self.GEOSERVER_URL + "/geoserver/rest/workspaces/uos/coveragestores/" + "uos_upload_image/coverages/" + self.GEOSERVER_LAYER_NAME + ".xml")

        coverage.native_bbox = (str(result[0]),str(result[1]),str(result[2]),str(result[3]),"EPSG:4326")
        cat.save(coverage)

    def getGridSet(self, level, valx, valy ):
        # todo reverse getgridset
        #         minx, maxx, miny, maxy를 구해 리턴해주고, self.GEOWEBCACHE_GRIDSET_LIST 에서 해당 키의 value를 false로 바꾼다.
        minx = 0
        miny = 0
        maxx = 0
        maxy = 0
        
        minimumX = -180
        mimimumY = -90
        maximX = 180
        maximY = 90
        
        tileSize = (maximX - minimumX) / pow(2, level)
        
        keyStr = 'L' + '{0:03d}'.format(level) + 'X' + '{0:10d}'.format(valx) + 'Y' + '{0:10d}'.format(valy)
        flag = GEOWEBCACHE_GRIDSET_LIST[keyStr]
        if flag:
            minx = tileSize*valx + minimumX
            miny = tileSize*valy + mimimumY
            maxx = tileSize*(valx+1) + minimumX
            maxy = tileSize*(valy+1) + mimimumY
            del GEOWEBCACHE_GRIDSET_LIST[keyStr]
		
        return minx, miny, maxx, maxy
		
    def putGridSet(self, level, minx, miny, maxx, maxy ):
        # todo java src:getGridSet --> convert
        #        + 각 gridset number(minx, maxx, miny, maxy가 나오므로 루프돌면서) 을 key로, true를 value로 하여 slef.GEOWEBCACHE_GRIDSET_LIST 에 넣는다.
        		
        print level, minx, miny, maxx, maxy
        minx = self.modifyDegreeX(minx)
        miny = self.modifyDegreeY(miny)
        maxx = self.modifyDegreeX(maxx)
        maxy = self.modifyDegreeY(maxy)
        print level, minx, miny, maxx, maxy
        
        minimumX = -180
        minimumY = -90
        maximX = 180
        maximY = 90

        x = 0
        y = 0
        Mx = 0
        My = 0
        
        print level, pow(2, level)

        tileSize = (maximX - minimumX) * 1.0 / pow(2, level)
        print ('tileSize=' + str(tileSize))
        
        x = int((minx - minimumX) / tileSize)
        y = int((miny - minimumY) / tileSize)
        Mx = int((maxx - minimumX) / tileSize)
        My = int((maxy - minimumY) / tileSize)
		
        print x, Mx, y, My
        for i in range(x, Mx):
            for j in range(y, My):
                GEOWEBCACHE_GRIDSET_LIST['L' + '{0:03d}'.format(level) + 'X' + '{0:10d}'.format(i) + 'Y' + '{0:10d}'.format(j)] = True
		
        
		
    def modifyDegreeX(self, value):
        return (value > 180) and self.modifyDegreeX(value - (180 - (-180))) or ( value < -180) and self.modifyDegreeX(value + (180 - (-180))) or value;

    def modifyDegreeY(self, value):
        return (value > 90) and self.modifyDegreeY(value - (90 - (-90))) or ( value < -90) and self.modifyDegreeY(value + (90 - (-90))) or value;

def main():

    #logging.debug( "initialing...")
    logging.basicConfig(level=logging.DEBUG,
                        format='%(asctime)s - %(message)s',
                        datefmt='%Y-%m-%d %H:%M:%S',
                        filename='./log/console.log')
    logging.debug( "start process")
    event_handler = CompleteEventHandler()
    logging.info( "Watching Folder : " + event_handler.WATCH_FOLDER)
    observer = Observer()
    observer.schedule(event_handler, path=os.path.abspath(event_handler.WATCH_FOLDER), recursive=True)
    observer.start()
    

    # 데몬 쓰레드
    t1 = threading.Thread(target=getCache,
                        args=(event_handler.HTTP + event_handler.GEOSERVER_URL + '/geoserver/gwc/rest/seed/' + event_handler.GEOSERVER_STORE_NAME + ':' + event_handler.GEOSERVER_LAYER_NAME + '.json',
                            event_handler.GEOSERVER_USER,
                            event_handler.GEOSERVER_PASSWORD,
						    event_handler.GEOWEBCACHE_BOX_LEVEL))
    t1.daemon = True 
    t1.start()

        #t1.stop()
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()

    if observer.isAlive() :
        observer.stop()
    observer.join()
	
    
#캐시 생성 프로세스...
def getCache(url, username, password, level):
    while True:
	
        #print ("qwerasdf")
		
        #resp = requests.get(url)
        
        #getGridSet 시작 (함수를 그냥 포함시켜버림)
        minx = 0
        miny = 0
        maxx = 0
        maxy = 0
        
        minimumX = -180
        mimimumY = -90
        maximX = 180
        maximY = 90
        
        valx = 0
        valy = 0
		
        tileSize = (maximX - minimumX) * 1.0  / pow(2, level)
		
        flag = False
        
        keys = GEOWEBCACHE_GRIDSET_LIST.keys()
        keyStr = None if len(keys) < 1 else keys.pop()
        if keyStr :
            flag = GEOWEBCACHE_GRIDSET_LIST[keyStr]
            print ('keyStr=' + keyStr)
            valx = int(keyStr[5:15])
            valy = int(keyStr[16:26])
            print valx, valy
        if flag:
            minx = tileSize*valx + minimumX
            miny = tileSize*valy + mimimumY
            maxx = tileSize*(valx+1) + minimumX
            maxy = tileSize*(valy+1) + mimimumY
            del GEOWEBCACHE_GRIDSET_LIST[keyStr]
        #getGridSet 종료
			
        print u'계산값', maxx, minx, maxy, miny, (maxx-minx) * (maxy-miny)
        if not (minx == 0 and miny == 0 and maxx == 0 and maxy == 0)  :	# 4값이 다 0이라면... (꺼낸 값이 없다면) 프로세스를 건너뛴다.
            c = pycurl.Curl()
            c.setopt(c.URL, url)
            
            
            #post_data = '{\'seedRequest\':'+'{\'name\':\'uos:uos_upload_image\','+'\'bounds\':{\'coords\':{\'double\':[\'127.119131406\',\'37.5467386859\',\'127.120092563\',\'37.5480469231\']}},'+'\'srs\':{\'number\':4326},'+ '\'zoomStart\':1,\'zoomStop\':23,'+ '\'format\':\'image\/png\',' + '\'TIME\':\'P1Y\/PRESENT\',' + '\'type\':\'reseed\',\'threadCount\':1}}'
            post_data = '{\'seedRequest\':'+'{\'name\':\'uos:uos_upload_image\','+'\'bounds\':{\'coords\':{\'double\':[\'' + str(minx) + '\',\'' + str(miny) + '\',\'' + str(maxx) + '\',\'' + str(maxy) + '\']}},'+'\'srs\':{\'number\':4326},'+ '\'zoomStart\':12,\'zoomStop\':23,'+ '\'format\':\'image\/png\',' + '\'parameter_TIME\':\'P1Y\/PRESENT\',' + '\'type\':\'reseed\',\'threadCount\':3}}'
            #postfields = urlencode(post_data)
            #post_data = 'threadCount=01^&type=seed^&gridSetId=My_EPSG^%^3A4326^&format=image^%^2Fpng^&zoomStart=09^&zoomStop=09^&parameter_TIME=P2Y^%^2FPRESENT^&parameter_STYLES=raster^&minX=^&minY=^&maxX=^&maxY='
            postfields = post_data
            c.setopt(c.POSTFIELDS, postfields)
            c.setopt(c.USERPWD, str("%s:%s" % (username, password)))
            c.perform()
            c.close()
            
            
            # 3857 좌표계에 대해서 한번 더 돌림
            print (str(minx) + '_' + str(maxy))

            p4326 = pyproj.Proj(init='epsg:4326')
            p3857 = pyproj.Proj(init='epsg:3857')
			
            print minx, miny
            tminx,tminy = pyproj.transform(p4326, p3857, minx, miny)
            tmaxx,tmaxy = pyproj.transform(p4326, p3857, maxx, maxy)
            
            print (str(tminx) + '_' + str(tmaxy))

            c2 = pycurl.Curl()
            c2.setopt(c2.URL, url)
            
            #post_data = '{\'seedRequest\':'+'{\'name\':\'uos:uos_upload_image\','+'\'bounds\':{\'coords\':{\'double\':[\'127.119131406\',\'37.5467386859\',\'127.120092563\',\'37.5480469231\']}},'+'\'srs\':{\'number\':3857},'+ '\'zoomStart\':1,\'zoomStop\':23,'+ '\'format\':\'image\/png\',' + '\'TIME\':\'P1Y\/PRESENT\',' + '\'type\':\'reseed\',\'threadCount\':1}}'
            post_data2 = '{\'seedRequest\':'+'{\'name\':\'uos:uos_upload_image\','+'\'bounds\':{\'coords\':{\'double\':[\'' + str(tminx) + '\',\'' + str(tminy) + '\',\'' + str(tmaxx) + '\',\'' + str(tmaxy) + '\']}},'+'\'srs\':{\'number\':900913},'+ '\'zoomStart\':12,\'zoomStop\':23,'+ '\'format\':\'image\/png\',' + '\'TIME\':\'P1Y\/PRESENT\',' + '\'type\':\'reseed\',\'threadCount\':3}}'
            #postfields = urlencode(post_data)
            postfields2 = post_data2
            c2.setopt(c2.POSTFIELDS, postfields2)
            c2.setopt(c2.USERPWD, str("%s:%s" % (username, password)))
            c2.perform()
            c2.close()

            #cat = Catalog(url,username = username, password=password)
            #coverage = cat.get_resource_by_url(self.HTTP + self.GEOSERVER_URL + "/geoserver/rest/workspaces/uos/coveragestores/" + "uos_upload_image/coverages/" + self.GEOSERVER_LAYER_NAME + ".xml")
            
        else :
            time.sleep(5)
			
        time.sleep(0.005)
		
        #for k in GEOWEBCACHE_GRIDSET_LIST.keys():
        #    print("GEOWEBCACHE_GRIDSET_LIST : " + k)

        print ''
        print('cache creation complete!!')
        print('to do jobs waiting...' + str(len(GEOWEBCACHE_GRIDSET_LIST)))
			

    

if __name__ == "__main__":
    main()