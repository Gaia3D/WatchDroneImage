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

        subprocess.call(['nearblack', '-of', 'GTiff', '-color', '205,205,205', '-setalpha', path, '-o',
                         nb_file])
        subprocess.call(['gdalwarp', '-r', 'cubic', '-of', 'GTiff', '-s_srs', 'EPSG:5186', '-t_srs', 'EPSG:4326',
                         nb_file, trans_file])
        subprocess.call(['gdal_translate', '-of', 'GTiff', '-co', 'TILED=YES', trans_file, tiled_file])
        subprocess.call(['gdaladdo', '-r', 'average', tiled_file, '2', '4', '8', '16', '32', '64'])
        os.remove(nb_file)
        os.remove(trans_file)
        subprocess.call(["gdaltindex", os.path.join(dst_folder, "{}.shp".format(os.path.basename(dst_folder))),
                         os.path.join(dst_folder, '*_nb_4326_tiled.tif')])



if __name__ == "__main__":
    WATCH_FOLDER = "c:/ftp_root"
    SERVICE_FOLDER = "c:/temp/uos_fast"
    PATTERN = ["*.jpg"]
    WAIT_SECOND = 10

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