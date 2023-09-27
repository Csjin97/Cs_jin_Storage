
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


import _pickle as cPickle

db_data = {
    "train": [],
    "data_set": [],
    "train_options": [],
    "train_conditions": []
}
#====================================================================================
# Resource Web Service
class CTrain(MethodView):
    def __init__(self):
        self.info = CMLTarin()

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
                msg = f'Train {work} {clientname}'
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
class CMLTarin(CRedis):
    def __init__(self):
        CRedis.__init__(self, db=5)

        # proplist --> Not used
        self.proplist = {
            '''
            'type': {
                'train', 'data_set', 'training_options', 'training_conditions' : {
                    [Name]: {
                        'data_set': '',
                        'training_options': '',
                        'training_conditions': '',
                        'description': '',
                        'creat_date': '',
                    }
                }
            }
            '''
        } 
    
    def Add(self, data):
        result = {}
        result['msg'] = ''
        type_values = data.get('type', {})
        for type_key, type_value in type_values.items():
            print(f"add data / type_key:{type_key},type_value:{type_value}")
            if type_key == "train":
                db_data["train"].append(type_value)
                print(db_data["train"])
            elif type_key == "data_set":
                db_data["data_set"].append(type_value)
                print(db_data["data_set"])
            elif type_key == "train_options":
                db_data["train_options"].append(type_value)
                print(db_data["train_options"])
            elif type_key == "train_conditions":
                db_data["train_conditions"].append(type_value)
                print(db_data["train_conditions"])
        return result

    def Read(self, data):
        result = {}
        result['msg'] = ''
        type_values = data.get('type', {})
        if(type_values == "all"):
            result['data'] = db_data
            print(f"read data : {result}")
        return result

    def Modify(self, data):
        result = {}
        result['msg'] = ''
        type_values = data.get('type', '')
        for type_key, type_value in type_values.items():
            if type_key == "train":
                db_data["train"].update(type_value)
            elif type_key == "data_set":
                db_data["data_set"].update(type_value)
            elif type_key == "train_options":
                db_data["train_options"].update(type_value)
            elif type_key == "train_conditions":
                db_data["train_conditions"].update(type_value)
        return result

    def Remove(self, data):
        result = {}
        result['msg'] = ''
        type_values = data.get('type', '')
        for type_key, type_value in type_values.items():
            print(f"type_key: {type_key}, type_value: {type_value}")
            '''
            if type_key == "train":
                db_data["train"]
            elif type_key == "data_set":
                db_data["data_set"]
            elif type_key == "train_options":
                db_data["train_options"]
            elif type_key == "train_conditions":
               db_data["train_conditions"]
            '''
        return result

        
