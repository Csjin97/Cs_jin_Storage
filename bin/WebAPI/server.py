#########################################################################################
#   Server Redis API
#       Create :    2022.05.04
#       Modify :    2022.11.17
#       Info   :
#                   Redis DB 1: Server Info  (Key : SVR_ip)
#                   Redis DB 4: Server Resource Info (Key : ip)
#       History:
#           2022.11.17:     Change DB Number


# Get System Resource
from datetime import datetime
import json
import threading
import psutil
import shutil
import time, sys, datetime

from flask import Flask, redirect
from flask.views import MethodView
from flask import request, jsonify, make_response
# Current App for Logging
from flask import current_app

from Lib.common import IsLogin, IsAdmin
from Lib.RedisJSON import RedisJSON
from Lib.RedisInterface import CRedis
import _pickle as cPickle

#====================================================================================
# Resource Web Service
save= {}
class CServer(MethodView):
    def __init__(self):
        self.db = CResource()
        self.info = CMLInfo()

    def __func__(self, work, data, callback):
        result = {}
        try:
            result['success'] = IsLogin() and IsAdmin()
            result['msg'] = ''
            result['data'] = {}
            ip = ''
            code = 200
            if (result['success']):
                ip = data.get('ip', '')
                if (ip != ''):
                    result = callback(data)
                else:
                    result['msg'] = 'IP Not Found'
            else:
                result['msg'] = 'Not Logined'
                code = 401                          # Unauthorized

            if result['msg'] == '':
                msg = f'Server {work} {ip}'
                if (work != 'Read'):
                    current_app.logger.info(msg)
            else:
                if code == 200: code = 400          # Bad Request
                msg = f'Server {work} {result["msg"]}'
                current_app.logger.warning(msg)
        except Exception as e:
            code = 500                              # Internal Server Error
            result['success'] = False
            result['msg'] = str(e)
            current_app.logger.error(result['msg'])
            
        return make_response(jsonify(result), code)

    def get(self): # ip
        return self.__func__('Read', request.args.to_dict(), self.info.Read)

    def post(self): # data
        return self.__func__('Add', request.json, self.info.Add)

    def put(self): # data
        return self.__func__('Modify', request.json, self.info.Modify)

    def delete(self): # ip
        return self.__func__('Remove', request.json, self.info.Remove)


#====================================================================================
# Server Information
class CMLInfo(CRedis):
    def __init__(self):
        CRedis.__init__(self, db=1)
        self.proplist = {
            'ip': '',
            'name': '',
            'isClient': False,
            'ismlSvc': False,
            'ismlEng': False,
            'isStorage': False
        }
        self.resouce = CResource()

    def Add(self, data):
        result = {}
        result['msg'] = ''

        key = 'SVR_' + data.get('ip', '')
        item = self.store.get(key)
        if item == None:
            tmp = cPickle.dumps(data, protocol=2)
            self.store.set(key, tmp)
        else:
            result['msg'] = 'IP Exist'

        result['success'] = (result['msg'] == '')
        return result
    
    def Read(self, data):
        result = {}
        result['msg'] = ''
        result['data'] = {}
        ip = data.get('ip', '') # history server
        # get all server list
        keys = self._GetKeyList()
        for key in keys:
            if key[0:4] == 'SVR_':
                value = self.store.get(key)
                result['data'][key[4:]] = cPickle.loads(value)
                rsc = self.resouce.GetCurrentStatus(key[4:])
                result['data'][key[4:]]['cpu'] = rsc['cpu']
                result['data'][key[4:]]['mem'] = rsc['mem']
                result['data'][key[4:]]['disk'] = rsc['disk']
                result['data'][key[4:]]['net'] = rsc['net']
                if result['data'][key[4:]]['isClient']:
                    result['data'][key[4:]]['isClient'] = rsc['client']
                else:
                    result['data'][key[4:]]['isClient'] = -1
                if result['data'][key[4:]]['ismlSvc']:
                    result['data'][key[4:]]['ismlSvc'] = rsc['mlSve']
                else:
                    result['data'][key[4:]]['ismlSvc'] = -1
                if result['data'][key[4:]]['ismlEng']:
                    result['data'][key[4:]]['ismlEng'] = rsc['mlEng']
                else:
                    result['data'][key[4:]]['ismlEng'] = -1
                if result['data'][key[4:]]['isStorage']:
                    result['data'][key[4:]]['isStorage'] = rsc['mlStorage']
                else:
                    result['data'][key[4:]]['isStorage'] = -1

        result['data']['history'] = self.resouce.GetResource(ip)

        result['success'] = (result['msg'] == '')
        return result

    def Modify(self, data):
        result = {}
        result['msg'] = ''

        key = 'SVR_' + data.get('ip', '')
        item = self.store.get(key)
        if item != None:
            tmp = cPickle.dumps(data, protocol=2)
            self.store.set(key, tmp)
        else:
            result['msg'] = 'IP Not Exist'

        result['success'] = (result['msg'] == '')
        return result

    def Remove(self, data):
        result = {}
        result['msg'] = ''

        key = 'SVR_' + data.get('ip', '')
        item = self.store.get(key)
        if item != None:
            self._Delete(key)
        else:
            result['msg'] = 'IP Not Exist'

        result['success'] = (result['msg'] == '')
        return result
    
    def FindServerIP(self, svr_name):
        result = ''
        # get all server list
        keys = self._GetKeyList()
        for key in keys:
            if key[0:4] == 'SVR_':
                value = self.store.get(key)
                data = cPickle.loads(value)
                if data.get('name', '') == svr_name:
                    result = data.get('ip', '')
                    break
        return result

    def GetName(self, svr_ip):
        result = ''
        value = self.store.get('SVR_' + svr_ip)
        if (value != None):
            data = cPickle.loads(value)
            result = data.get('name')
        return result


#====================================================================================
# Resource 저장
class CResource(RedisJSON):
    def __init__(self):
        CRedis.__init__(self, db=4)
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
    
    def GetCurrentStatus(self, ip):
        # Server Process state and resource
        result = {}
        result['cpu'] = '-'
        result['mem'] = '-'
        result['disk'] = '-'
        result['net'] = '-'
        result['client'] = 0
        result['mlSve'] = 0
        result['mlEng'] = 0
        result['mlStorage'] = 0
        data = self.store.lrange(ip, 0, 0)

        if len(data) == 1:
            tmp = json.loads(data[0])
            result['cpu'] = tmp['cpu']
            result['mem'] = tmp['memory']
            result['disk'] = tmp['disk']
            result['net'] = round(float(tmp['network']) / 1000, 2)
            if tmp['client']:
                result['client'] = 1
            if tmp['ai']:
                result['mlSve'] = 1
            if tmp['engine']:
                result['mlEng'] = 1
            if tmp['storage']:
                result['mlStorage'] = 1
        return result

    def GetResource(self, ip):
        # timestamp를 epoch time으로 변환하는 함수
        def convert_to_epoch_time(timestamp):
            return time.mktime(timestamp.timetuple()) * 1000.0

        # ip 별 Resource 획득
        data = self.store.lrange(ip, 0, self.total - 1)
        result = {
            'cpu': [],
            'mem': [],
            'disk': [],
            'net': []
        }
        now = datetime.datetime.now() - datetime.timedelta(minutes=1)

        for item in data:
            tmp = json.loads(item)
            timestamp = datetime.datetime.strptime(tmp['time'], "%Y-%m-%d %H:%M:%S.%f")
            d = convert_to_epoch_time(timestamp)
            result['cpu'].append([d, tmp['cpu']])
            result['mem'].append([d, tmp['memory']])
            result['disk'].append([d, tmp['disk']])
            result['net'].append([d, round(float(tmp['network']) / 1000, 2)])

        if not data or datetime.datetime.strptime(json.loads(data[-1])['time'], "%Y-%m-%d %H:%M:%S.%f") < now:
            # data가 비어있는 경우 또는 마지막 데이터가 현재 시간보다 이전인 경우
            d = convert_to_epoch_time(now + datetime.timedelta(seconds=5))
            result['cpu'].append([d, '0'])
            result['mem'].append([d, '0'])
            result['disk'].append([d, '0'])
            result['net'].append([d, '0'])

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
        #print(result)
        self.net_pre_value = net_use
        self.net_pre_time = net_time

        #sys.stdout.write('\033[K')
        #print(result, end='\r')
        
        self.store.lpush(ip, json.dumps(result) )
        self.store.ltrim(ip, 0, self.total - 1)
