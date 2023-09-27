#########################################################################################
#   Rule Redis API
#       Create :    2022.05.04
#       Modify :    2022.11.18
#       Info   :
#                   Redis DB 2: Server Info  (Key : Rule_ip)
#                   Json      : {Server: ip, model: uuid, option, rule(filter)
#       History:
#           2022.11.17:     Change DB Number, Add Add function
#           2022.11.18:     Modify function, Delete Function


# Get System Resource
from datetime import datetime
import json
import threading
import psutil
import shutil
import time, sys

from flask import Flask, redirect
from flask.views import MethodView
from flask import request, jsonify, make_response
# Current App for Logging
from flask import current_app

from Lib.common import IsLogin, IsAdmin
from Lib.RedisJSON import RedisJSON
from Lib.RedisInterface import CRedis
from WebAPI.server import CMLInfo
from WebAPI.model import CModelInfo
import _pickle as cPickle

#====================================================================================
# Resource Web Service
class CRule(MethodView):
    def __init__(self):
        self.info = CMLRule()

    def __func__(self, work, data, callback):
        result = {}
        try:
            result['success'] = IsLogin() and IsAdmin()
            result['msg'] = ''
            result['data'] = {}
            clientname = ''
            code = 200
            if (result['success']):
                work = data.get('work', '')
                if (work != ''):
                    result = callback(data)
                else:
                    result['msg'] = 'Command Not Found'
            else:
                result['msg'] = 'Not Logined'
                code = 401                          # Unauthorized

            if result['msg'] == '':
                msg = f'Rule {work} {clientname}'
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
class CMLRule(CRedis):
    def __init__(self):
        CRedis.__init__(self, db=3)
        # data structure   
        #   client_name : { '1': {data}, '2': {data}, .... }

        # proplist --> Not used
        self.proplist = {
            'client': 'ip',
            'model': 'uuid',
            'priority': 1,
            'threshold': 0,
            'recipe': [ 'Off', '', 0 ],
            'filename': [ 'Off', '', 0 ]
        }
        self.svrinfo = CMLInfo()
        self.modelinfo = CModelInfo()

    def GetDataKey(self, data):
        recipe = data.get('recipe', ['', ''])
        filekey = data.get('filename', ['', ''])
        if recipe == '':
            recipe = ['', '']
        if filekey == '':
            filekey = ['', '']
        return recipe[0] + ':' + recipe[1] + ';' + filekey[0] + ':' + filekey[1]

    def __MakeJson__(self, ip, modelid, data):
        result = {
            'client': ip,
            'model': modelid,
            'option': {
                'threshold' : data.get('threshold', '')
            },
            'filter': {
                'recipe' : data.get('recipe', ['off', '0']),
                'filename' : data.get('filename', ['off', '0'])
            }
        }
        return result
    def __MakeKey__(self, data):
        ip = self.svrinfo.FindServerIP(data.get('client_name', ''))
        return 'Rule_' + ip

    def Add(self, data):
        # {'client_name': 'Client 1', 'model_name': 'ASE 2',
        #      'threshold': '', 'recipe': ['a2', '3'], 'filename': ['sds', '3']}
        ip = self.svrinfo.FindServerIP(data.get('client_name', ''))
        modelid = self.modelinfo.FindModelID(data.get('model_name', ''))
        result = {}
        result['msg'] = ''
        key = self.__MakeKey__(data)
        key2 = self.GetDataKey(data)
        value = self.__MakeJson__( ip, modelid, data)

        item = self.store.get(key)
        if item == None:
            item = { key2: value }
            tmp = cPickle.dumps(item, protocol=2)
            self.store.set(key, tmp)
        else:
            # Always add last location
            item = cPickle.loads(item)
            if (item.get(key2, '') == ''):
                item[key2] = value
                tmp = cPickle.dumps(item, protocol=2)
                self.store.set(key, tmp)
            else:
                result['msg'] = "Rule Exist"

        result['success'] = (result['msg'] == '')
        return result
    
    def __convert__(self, data):
        # data = { }
        result = {}
        for key in data:
            result[key] = data[key]
            result[key]['key'] = key
            result[key]['ip'] = result[key]['client']
            result[key]['model'] = self.modelinfo.GetName(result[key]['model'])
            result[key].pop('client')
        return result

    def Read(self, data):
        result = {}
        result['msg'] = ''
        result['data'] = { }
        work = data.get('work', '')
        if work == 'rule':
            keys = self._GetKeyList()
            for key in keys:
                if key[0:5] == 'Rule_':
                    value = self.store.get(key)
                    tmp = cPickle.loads(value)
                    name = self.svrinfo.GetName(key[5:])
                    result['data'][name] = self.__convert__(tmp)
        elif work == 'model': # { uuid1 : name1, uuid2: name2 }
            result['data'] = self.modelinfo.GetModelList()
        else:
            result['msg'] = 'Unknown Command'
        result['success'] = (result['msg'] == '')
        return result

    def Modify(self, data):
        # client_name,   filter_key
        ip = self.svrinfo.FindServerIP(data.get('client_name', ''))
        modelid = self.modelinfo.FindModelID(data.get('model_name', ''))
        result = {}
        result['msg'] = ''
        key = self.__MakeKey__(data)
        deletekey = data.get('rule_key', '')
        addkey = self.GetDataKey(data)
        value = self.__MakeJson__( ip, modelid, data)

        item = self.store.get(key)

        if item != None:
            item = cPickle.loads(item)
            if deletekey != '':
                item.pop(deletekey, None)
            item[addkey] = value
            tmp = cPickle.dumps(item, protocol=2)
            self.store.set(key, tmp)
        else:
            result['msg'] == 'Client Not Found'

        result['success'] = (result['msg'] == '')
        return result

    def Remove(self, data):
        result = {}
        result['msg'] = ''

        key = self.__MakeKey__(data)
        deletekey = data.get('rule_key', '')
        item = self.store.get(key)
        if item != None:
            item = cPickle.loads(item)
            if deletekey != '':
                item.pop(deletekey, None)
                tmp = cPickle.dumps(item, protocol=2)
                self.store.set(key, tmp)
        else:
            result['msg'] = 'Client Not Exist'

        result['success'] = (result['msg'] == '')
        return result
