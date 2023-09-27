#########################################################################################
#
#   Login API
#               2022.05.04

import os
from urllib import request, parse

from flask import Flask, redirect, url_for
from flask.views import MethodView
from flask import request, jsonify, session, make_response
# Current App for Logging
from flask import current_app

from Lib.common import IsLogin

class CLogin(MethodView):
    def __init__(self) -> None:
        super().__init__()

    # Check Login
    def get(self):
        # 유효한 사용자 id가 있어야 한다.
        id = session.get('id', None)
        result = {
            "success": (id != None),
            "msg": ""
        }
        isAdmin = session.get('isAdmin', None)
        if (isAdmin == None):
            result['msg'] = ''
        elif (isAdmin):
            result['msg'] = 'admin.html'
        else:
            result['msg'] = 'app.html'

        current_app.logger.info('Login Check ' + str(id) + ' ' + str(result['success']) )

        return make_response(jsonify(result), 200)

    def post(self):
        session.clear()
        current_app.logger.info('Login Start')
        data = request.get_json()
        # print('login data:', data)
        if (data == None):
            current_app.logger.warning('Login data not found')
            return make_response("Service unavailable", 503)
        if not ('id' in data) or not ('pw' in data):
            current_app.logger.warning('Login id or pw not found')
            return make_response("Service unavailable", 503)

        id = data['id']
        pw = data['pw']

        isAdmin = False
        isApprove = False
        name = ''
        dept = ''
        datapath = ''
        result = {
            'success': True,
            'msg': ''
        }
        # Check Admin Login
        if id in current_app.config['ADMIN'].keys():
            if (pw == current_app.config['ADMIN'][id]['password']):
                isAdmin = True
                name = current_app.config['ADMIN'][id]['name']
                dept = '관리자'
            else:
                current_app.logger.warning('Login id or pw incorrect ' + id + ',' + pw)
                return make_response("Unauthorized", 401)


        # 동일 ID가 이미 로그인 중이면 해당 세션을 삭제할것
        current_app.session_interface.IDExistClearSession(id)

        session['id'] = id
        session['name'] = name
        session['dept'] = dept
        session['isAdmin'] = isAdmin
        session['isApprove'] = isApprove
        session['datapath'] = datapath

        result = {}
        result['success'] = True
        if (isAdmin):
            result['msg'] = 'admin.html'
        else:
            result['msg'] = 'app.html'
        resp = make_response(jsonify(result), 200)

        resp.set_cookie('id', id)
        resp.set_cookie('name', parse.quote(name) )     # 한글 깨짐 문제
        if (isAdmin):
            resp.set_cookie('isAdmin', '1')
        else:
            resp.set_cookie('isAdmin', '0')
        resp.set_cookie('mode', current_app.config['ENV'])

        current_app.logger.info('Login Success ' + ','.join( [id, name, dept, 'Approver:' + str(isApprove), 'Admin:' + str(isAdmin) ] ) )
        return resp

    def delete(self):
        id = session.get('id', None)
        result = {
            'success': id != None,
            'msg': ''
        }
        if id == None:
            current_app.logger.info('Logout None')
        else:
            current_app.logger.info('Logout Success ' + id)
            session.clear()

        current_app.session_interface.IDExistClearSession(id)
        return make_response(jsonify(result), 200)
    