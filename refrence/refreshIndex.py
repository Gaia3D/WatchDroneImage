# -*- coding: utf-8 -*-
import os
import subprocess

shp_dir = os.path.dirname(os.path.abspath(__file__))

if os.path.exists(shp_dir):
    for file_name in os.listdir(shp_dir):
        if os.path.splitext(file_name)[1] == '.shp':
            os.remove(os.path.join(shp_dir, file_name))
else:
    print "error"


subprocess.call(["gdaltindex", os.path.join(shp_dir, "{}.shp".format(os.path.basename(shp_dir))),
                         os.path.join(shp_dir, '*.jpg')])

