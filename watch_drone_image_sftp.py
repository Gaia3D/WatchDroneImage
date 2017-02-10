# -*- coding: utf-8 -*-
# 참고: https://github.com/gorakhargosh/watchdog/

import sys
import time
import logging
import os
import threading

from watchdog.observers import Observer
from watchdog.events import PatternMatchingEventHandler

from ftplib import FTP

class CompleteEventHandler(PatternMatchingEventHandler):
    _WAIT_SECOND = 1
    __watch_dict = {}

    PATTERN = ["*.jpg"]
    IMAGE_TYPE = "jgw"
    WATCH_FOLDER = "/Users/jsKim-pc/Documents/2017/uos_test_image/ftp"

    # set ftp setting
    FTP_SERVER = None
    FTP_FOLDER = "/Result"
    FTP_FOLDER_TMP = "/temp"
    FTP_IP = ""
    FTP_PORT = 21
    FTP_TIMEOUT = 3
    FTP_USER = ""
    FTP_PWD = ""

    def __init__(self, patterns=None, ignore_patterns=None,
                 ignore_directories=False, case_sensitive=False):
        patterns = self.PATTERN

        super(CompleteEventHandler, self).__init__(patterns, ignore_patterns, ignore_directories, case_sensitive)

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
        print 'src_folder : ' + src_folder
        org_name, ext = os.path.splitext(os.path.basename(path))

        self.imageFTP(os.path.basename(path))

        worldFileName = ("{}." + self.IMAGE_TYPE).format(org_name)
        worldFile = os.path.join(src_folder, worldFileName)
        print worldFile
        while (True):
            if os.access(worldFile, os.W_OK):
                break
            time.sleep(0.5)

        self.imageFTP(worldFileName)

    def connectFTP(self):

        ftp = FTP()
        ftp.connect(self.FTP_IP, self.FTP_PORT, self.FTP_TIMEOUT)
        ftp.login(self.FTP_USER, self.FTP_PWD)

        return ftp

    def imageFTP(self, fileName):

        ftp = self.connectFTP()

        print "Send File : " + fileName

        origin = os.path.join(self.WATCH_FOLDER, fileName)
        remote = os.path.join(self.FTP_FOLDER, fileName)
        remoteTmp = os.path.join(self.FTP_FOLDER_TMP, fileName + ".tmp")

        ftp.storbinary("STOR "+ remoteTmp, open(origin, 'rb'))

        ftp.rename(remoteTmp, remote)

        print "Send OK : " + fileName

        ftp.close()

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
    observer.join()