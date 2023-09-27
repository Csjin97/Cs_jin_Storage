#########################################################################################
#   Server Redis API
#       Create :    2022.11.17
#       Modify :    2022.11.17
#       Info   :
#                   Redis DB 2: Model Info  (Key : uuid)
#       History:
#           2022.11.17:     Create
#           2022.11.18:     Implement Add, Read Function


# Get System Resource
from datetime import datetime
import json, os
import threading
import psutil
import shutil, uuid
import time, sys, datetime

from flask import Flask, redirect
from flask.views import MethodView
from flask import request, jsonify, make_response
from werkzeug.utils import secure_filename

# Current App for Logging
from flask import current_app

from Lib.common import IsLogin, IsAdmin
from Lib.RedisJSON import RedisJSON
from Lib.RedisInterface import CRedis
import _pickle as cPickle

#====================================================================================
# Resource Web Service
class CModel(MethodView):
    def __init__(self):
        self.info = CModelInfo()

    def __func__(self, work, data, callback):
        result = {}
        try:
            result['success'] = IsLogin() and IsAdmin()
            result['msg'] = ''
            result['data'] = {}
            ip = ''
            code = 200
            print(data)
            if (result['success']):
                result = callback(data)
            else:
                result['msg'] = 'Not Logined'
                code = 401                          # Unauthorized

            if result['msg'] == '':
                msg = f'Model {work} {ip}'
                if (work != 'Read'):
                    current_app.logger.info(msg)
            else:
                if code == 200: code = 400          # Bad Request
                msg = f'Model {work} {result["msg"]}'
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
class CModelInfo(CRedis):
    def __init__(self):
        CRedis.__init__(self, db=2)
        self.proplist = {
            'uuid': '',  #base model uuid
            'option': {},
            'pre_process': {},
            'post_process': {},
            'desc': ''
        }

    def __GetBaseModels__(self):
        # BaseModel: { uuid:filename, uuid:filename, ... }
        result = {}
        item = self.store.get('BaseModel')
        if (item != None):
            result = cPickle.loads(item)
        '''
        result = {
            '6FD4B1FC4F7B11ED81BB04D9F581C73B': 'CHDBOT_221005_test.vrws',
            '8DAA936A4F7B11EDB03C04D9F581C73B': 'CHDBOT_221005_test.vrws',
            '9C8B44BA4F7B11ED91E504D9F581C73B': 'CHDBOT_221005_test.vrws',
            'C0DF90EF4F7911ED975404D9F581C73B': 'CHDBOT_221005_test.vrws'
        }
        '''
        for each in result:
            result[each] = os.path.splitext(result[each])[0]

        return result

    def __convert__(self, data):
        result = {}
        try:
            result = cPickle.loads(data)
        except:
            result = json.loads(data)
        if 'ppconfig' in result:
            result['pre_process'] = result['ppconfig']['pre_process']
            result['post_process'] = result['ppconfig']['post_process']
            result.pop('ppconfig')
        return result
    
    def __MoveBaseModel__(self, src, dst):
        #shutil.move(src, dst)
        os.remove(src)

    def __ReadBaseModel__(self):
        item = self.store.get('BaseModel')
        if item == None:
            result = {}
        else:
            result = cPickle.loads(item)
        #print(result)
        return result
    def RegistBaseModel(self, request):
        # Add New Base Model (Regist File)
        result = {}
        result['msg'] = ''
        try:
            file = request.files["file"]
            filename = secure_filename(file.filename)
            current_app.logger.info('Upload File ' + filename)
            tmp = filename.split('.')
            filename2 = os.path.join('/var/opt/hims/ml-websvc/run/', filename)
            #print(filename2)
            file.save(filename2)
            data = self.__ReadBaseModel__()
            id = uuid.uuid4().hex
            data[id.upper()] = filename
            self.store.set('BaseModel', cPickle.dumps(data, protocol=2))

            self.__MoveBaseModel__(filename2, filename)

        except Exception as e:
            result['msg'] = 'error ' + str(e)
            current_app.logger.error(str(e))

        result['success'] = (result['msg'] == '')
        return make_response(jsonify(result), 200)

    def Add(self, data):
        result = {}
        result['msg'] = ''
        '''
        data = {
            'name': 'new model name'
            'uuid': 'base_model_id',
            'option': {},
            'pre_process': {},
            'post_process': {},
            'desc': ''
        }
        '''
        name = data.get('name', '')
        item = None
        if (name != ''):
            key = 'MODEL_' + name
            item = self.store.get(key)
            if item == None:
                tmp = cPickle.dumps(data, protocol=2)
                #uuid = tmp['uuid']
                #print('[test] '+str(data))
                self.store.set(key, tmp)
            else:
                result['msg'] = 'Model Exist'
        else:
            result['msg'] = 'Model Name Empty'

        result['success'] = (result['msg'] == '')
        return result

    def Read(self, data):
        result = {}
        result['msg'] = ''
        result['data'] = {}
        name = data.get('name', '') # history server
        # get all server list
        if name == '':
            bmodel = self.__ReadBaseModel__()
            keys = self._GetKeyList()
            for key in keys:
                if key[0:6] == 'MODEL_':
                    value = self.store.get(key)
                    value = self.__convert__(value)
                    # Find bmodel / convert uuid to name
                    basemodelID = value.get('basemodel', '')
                    if basemodelID != '':
                        model_name = bmodel.get(basemodelID, '')
                        if model_name != '':
                            value['basemodel'] = model_name
                    value['name'] = [key[6:]]
                    
                    result['data'][key[6:]] = value
        elif name.lower() == 'basemodel':
            result['data'] = self.__GetBaseModels__()
        else:
            value = self.store.get('MODEL_' + name)
            if (value != None):
                result['data'][name] = self.__convert__(value)
            else:
                result['data'][name] = {}

        result['success'] = (result['msg'] == '')
        return result

    def Modify(self, data):
        result = {}
        result['msg'] = ''
        
        # JSON 문자열을 파싱하여 Python 딕셔너리로 변환 
        if isinstance(data, str):
            data_dict = json.loads(data)
        else:
            data_dict = data
        
        key = 'MODEL_' + data_dict.get('name', '')
        item = self.store.get(key)
        
        if item is not None:
            tmp = cPickle.dumps(data_dict, protocol=2)
            self.store.set(key, tmp)
        else:
            result['msg'] = 'Model Not Exist'
        
        result['success'] = (result['msg'] == '')
        return result

    def Remove(self, data):
        result = {}
        result['msg'] = ''
        
        key = 'MODEL_' + data.get('name', '')
        item = self.store.get(key)
        if item != None:
            self._Delete(key)
        else:
            result['msg'] = 'Model Not Exist'

        result['success'] = (result['msg'] == '')
        return result
    
    def GetModelList(self):
        result = {}
        # get all model list
        keys = self._GetKeyList()
        for key in keys:
            if key[0:6] == 'MODEL_'or key[0:5] == 'BASE_':
                value = self.store.get(key)
                data = self.__convert__(value)
                name = data.get('name', '')
                desc = data.get('desc', '')
                uuid = data.get('uuid', '')
                if (name != ''):
                    name = name.rsplit('.', 1)[0]
                if name != '':
                    result[key] = { 'name': name, 'desc': desc, 'uuid':uuid}
        return result

    def GetName(self, model_id):
        result = ''
        value = self.store.get(model_id)
        if (value != None):
            try:
                data = cPickle.loads(value)
            except:
                data = json.loads(value)
        
            result = data.get('name', '')
            if (result != ''):
                result = result.rsplit('.', 1)[0]
        return result

    def FindModelID(self, model_name):
        result = ''
        if model_name == '':
            return ''

        # get all model list
        keys = self._GetKeyList()
        for key in keys:
            value = self.store.get(key)
            try:
                data = cPickle.loads(value)
            except:
                data = json.loads(value)
            name = data.get('name', '')
            if (name != ''):
                name = name.rsplit('.', 1)[0]
            if name == model_name:
                #print(data)
                result = key
                break
        return result

