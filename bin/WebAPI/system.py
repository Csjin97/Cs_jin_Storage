#########################################################################################
#
#   Login API
#               2022.05.04

# Get System Resource
from datetime import datetime
import json
import threading
import psutil
import shutil
import time, sys

from flask import Flask, redirect
from flask.views import MethodView
from flask import jsonify, make_response
# Current App for Logging
from flask import current_app

from Lib.common import IsLogin, IsAdmin
from Lib.RedisJSON import RedisJSON

#====================================================================================
# Resource 저장
class CResource(RedisJSON):
    def __init__(self):
        super().__init__(name='SystemResource', db=1)
        self.net_pre_value = 0
        self.net_pre_time = 0
        self.total = 600
        self.sendpkt = 0
        self.recvpkt = 0

    def Start(self):
        t = threading.Thread(target=self.ResourceLoop, args=())
        t.setDaemon(True)
        t.start()

    def ResourceLoop(self):
        while (True):
            #for i in range(10):
            self.AppendResource()
            time.sleep(1)
            # self.GetResource()

    def GetResource(self):
        data = self.store.lrange(self.name, 0, self.total-1)
        result = {}
        result['cpu'] = []
        result['mem'] = []
        result['disk'] = []
        result['net'] = []
        result['send'] = []
        result['recv'] = []
        for i in range(len(data)):
            tmp = json.loads(data[i])
            result['cpu'].append( [ tmp[0], tmp[1] ] )
            result['mem'].append( [ tmp[0], tmp[2] ] )
            result['disk'].append( [ tmp[0], tmp[3] ] )
            result['net'].append( [ tmp[0], tmp[4] ] )
            result['send'].append( [ tmp[0], tmp[5] ] )
            result['recv'].append( [ tmp[0], tmp[6] ] )
        return result

    def AppendResource(self):
        disk = shutil.disk_usage("/")
        net_use = psutil.net_io_counters().bytes_sent + psutil.net_io_counters().bytes_recv
        #net_use = net_use/1024./1024./1024.*8 # Gigabits
        # net_use = net_use * 8   # bits
        net_use = net_use/1024./1024. # MegaByte
        net_time = time.time()
        net_usage = 0

        if self.net_pre_value == 0:
            self.net_pre_value = net_use
        if self.net_pre_time == 0:
            self.net_pre_time == net_time

        if (self.net_pre_time < net_time):
            #net_usage = 100 * (net_use - net_pre_value) / (net_time - net_pre_time) # Gigabit adaptor
            net_usage = (net_use - self.net_pre_value) / (net_time - self.net_pre_time) # 100MByte Gigabit adaptor
        #print("Network", net_use - net_pre_value, net_time - net_pre_time, net_usage)   # GigaBit
        if net_usage > 100:
            net_usage = 100

        result = []
        
        result.append(datetime.now().timestamp() * 1000.0)  # msec
        result.append(psutil.cpu_percent())
        result.append(psutil.virtual_memory().percent)
        result.append(100 * disk.used / disk.total)
        result.append(net_usage)
        result.append(self.sendpkt)
        result.append(self.recvpkt)
        #print(result)
        self.net_pre_value = net_use
        self.net_pre_time = net_time

        #sys.stdout.write('\033[K')
        #print(result, end='\r')
        
        self.store.lpush( self.name, json.dumps(result) )
        self.store.ltrim(self.name, 0, self.total - 1)
