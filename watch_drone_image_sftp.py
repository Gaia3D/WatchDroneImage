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

import paramiko

class CompleteEventHandler(PatternMatchingEventHandler):
    _WAIT_SECOND = 1
    __watch_dict = {}

    PATTERN = ["*.jpg"]
    IMAGE_TYPE = "jgw"
    WATCH_FOLDER = "C:\\temp\\UOS_FTP\\Result"
    SERVICE_FOLDER = "c:\\temp\\UOS_upload_image"

    # set sftp setting
    SFTP_SERVER = None
    SFTP_FOLDER = "/home/gaia3d/imageFTP"
    SFTP_IP = "192.168.10.14"
    SFTP_PORT = 22
    SFTP_USER = "gaia3d"
    SFTP_PWD = "gaia3dgaia3d"
    SFTP_KEY = ""

    def __init__(self, patterns=None, ignore_patterns=None,
                 ignore_directories=False, case_sensitive=False):
        patterns = self.PATTERN

        super(CompleteEventHandler, self).__init__(patterns, ignore_patterns, ignore_directories, case_sensitive)

        #self.connectDB()
        self.connectSftp()

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
        remote_file = os.path.join(self.SFTP_FOLDER, os.path.basename(path))

        self.imageSftp(path, remote_file)

        worldFileName = ("{}." + self.IMAGE_TYPE).format(org_name)
        worldFile = os.path.join(src_folder, worldFileName)
        print worldFile
        while (True):
            if os.access(worldFile, os.W_OK):
                break
            time.sleep(1)

        reomte_worldFile = os.path.join(self.SFTP_FOLDER, worldFileName)

        self.imageSftp(worldFile, reomte_worldFile)

    def connectSftp(self):
        paramiko.util.log_to_file(os.path.join(os.path.dirname(__file__), "sftp.log"))

        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(hostname=self.SFTP_IP, port=self.SFTP_PORT, username=self.SFTP_USER, password=self.SFTP_PWD)
        # ssh.connect(hostname=self.SFTP_IP, port=self.SFTP_PORT, username=self.SFTP_USER, pkey=self.SFTP_PKEY)

        self.SFTP_SERVER = ssh

    def imageSftp(self, localFile, remoteFile):
        print "Send File : " + localFile

        sftp = self.SFTP_SERVER.open_sftp()

        sftp.put(localFile, remoteFile)

        sftp.close()
        print "Send OK : " + localFile

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