#########################################################################################
#
#   History API
#               2022.09.28

# Get System Resource
from datetime import datetime
import json
import threading
import psutil
import shutil
import time, sys
import math
import os

from flask import Flask, redirect
from flask.views import MethodView
from flask import request, jsonify, make_response
# Current App for Logging
from flask import current_app
import traceback
from Lib.common import IsLogin, IsAdmin
from Lib.DBHistory import DBHistory
import _pickle as cPickle
from RPC.ImgRequest import ImgRequest

from Lib.revUtility2 import RevDict
import traceback
class CHistory(MethodView):
    def __init__(self):
        self.info = CMLHistory()    

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
        #print(result)
        return make_response(jsonify(result), code)

    def get(self): # ip
        return self.__func__('Read', request.args.to_dict(), self.info.Read)
#====================================================================================

# Server Information
class CMLHistory():
    def __init__(self):
        self.db = DBHistory()

    def Read(self, data):
        # tmp1 = RevDict.diffTime()
        try:
            uuid = data.get('uuid', '')
            uuid = uuid.strip()
            if uuid != '':
                msg, data = self.db.Read(uuid)
                img = ImgRequest()
                image, width, height = img.get_image_from_storage(uuid)
                data[uuid]['image'] = image
                data[uuid]['wh'] = (width, height)
            else:
                client_id = data.get('client_id', '')
                recipe = data.get('recipe', '')
                lot = data.get('lot', '')
                name = data.get('name', '')
                start_date = data.get('start_date', '')
                end_date = data.get('end_date', '')
                state = data.get('state', '')
                label = data.get('label', '')

                client_id = client_id.strip()
                recipe = recipe.strip()
                lot = lot.strip()
                name = name.strip()
                start_date = start_date.strip()
                end_date = end_date.strip()
                state = state.strip()
                label = label.strip()
                msg, data = self.db.Search(client_id, start_date, end_date, recipe, lot, name, state, label)

            result = {}
            result['success'] = True
            result['msg'] = msg
            result['data'] = data

        except Exception as e:
            traceback.print_exc()
            result = {}
            result['success'] = False
            result['msg'] = ''
            result['data'] = ''
            
        # tmp2 = RevDict.diffTime(tmp1)
        # RevDict.timeList('request',tmp2)
        # RevDict.timeprint()
        return result

    def __del__(self):
        self.db.Close()