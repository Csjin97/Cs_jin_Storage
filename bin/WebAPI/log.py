#########################################################################################
#
#   User API
#               2022.05.12
import datetime
import json
import re
import os

from flask.views import MethodView
from flask import request, jsonify, session, make_response
from flask import current_app

from Lib.common import IsLogin, IsAdmin

class CLog(MethodView):
    def __init__(self) -> None:
        super().__init__()

    def get(self):
        if not (IsLogin() and IsAdmin()):
            current_app.logger.warning('Log get failed')
            return make_response({'success': False, 'data': []}, 401)

        current_app.logger.info('Log Search Start')
        data = request.args.to_dict()
        # print(data)
        '''
        {
            'pageno': pageno,
            'state': 'IDWE',                    // INFO, DEBUG, WARNING, ERROR
            'keyword': 'ssss',
            'period': 202205011713-202205252311 // s-e
        }
        '''

        state = data.get('state', 'IDWE').lower()
        keyword = data.get('keyword').strip()
        result = {
            'success': True,
            'msg': '',
            'data': {}
        }
        s_info = state.find('i') >= 0
        s_debug = state.find('d') >= 0
        s_warning = state.find('w') >= 0
        s_error = state.find('e') >= 0
        #print(state, s_info, s_debug, s_warning, s_error)

        period = data.get('period', '')
        pageno = data.get('pageno', 0)
        pagesize = 30   # Get Policy
        dt = datetime.datetime.now()
        dt2 = dt + datetime.timedelta(days=-1)
        start = dt2.strftime('%Y%m%d %H%M')
        end = dt.strftime('%Y%m%d %H%M')
        if len(period) == 25:
            tmp = period.split('-')
            if len(tmp) == 2:
                start = tmp[0]
                end = tmp[1]
        qSt = datetime.datetime.strptime(start, '%Y%m%d%H%M')
        qEd = datetime.datetime.strptime(end, '%Y%m%d%H%M')
        #print('--------', qSt, qEd)

        d = (qEd - qSt).days + 1
        total = 0
        max_log = 499
        for i in range(d):
            td =  qSt + datetime.timedelta(days=i)
            #print( td, dt )
            filename = current_app.config['DATA_LOG'] + 'mlmgt.log'
            if (td.strftime('%Y%m%d') != dt.strftime('%Y%m%d')):
                filename = filename + '.' + td.strftime('%Y%m%d')
            #print( 'Load Log File', filename, os.path.exists(filename), total)
            if os.path.exists(filename) and (total <= max_log):
                #print( 'Load Log File', filename)
                loglist = []
                with open( filename, 'r' ) as f:
                    #숫자 앞에 \n 으로 로그 분리
                    pattern = '\n(?=\d)'
                    data = re.split(pattern , f.read())
                    #print(data)
                    for line in data:
                        tmp = line.split(' ')   # date time type (module:line) message........
                        #print(tmp)
                        if len(tmp) > 4:
                            time =  datetime.datetime.strptime(tmp[0] +' '+ tmp[1], '%m/%d/%Y %H:%M:%S')
                            if (time < qSt) or (time > qEd):
                                continue
                            logtype = tmp[2].lower()
                            isAppend =  (s_info and (logtype == 'info')) or \
                                        (s_debug and logtype == 'debug') or \
                                        (s_warning and logtype == 'warning') or \
                                        (s_error and logtype == 'error')
                            if (isAppend):
                                message = ' '.join(tmp[4:])
                                #print(message, keyword)
                                if (keyword == '') or re.search(keyword, message, re.IGNORECASE):         #(message.find(keyword) >= 0):
                                    if (total <= max_log):
                                        loglist.append( [ tmp[1], logtype, '', message ])
                                        total = total + 1
                                    else:
                                        loglist.append( [ '-1', 'warning', '', '로그가 너무 많습니다.' ])
                                        break
                result['data'][td.strftime('%Y/%m/%d')] = loglist
            else:
                if not os.path.exists(filename):
                    result['data'][td.strftime('%Y/%m/%d')] = []
                else:
                    result['data'][td.strftime('%Y/%m/%d')] = [ [ '-1', 'warning', '', '로그가 너무 많습니다.' ] ]
            #print( td.strftime('%Y/%m/%d'), len( result['data'][td.strftime('%Y/%m/%d')] ) )
        current_app.logger.info('Log Search Success ' + str(total))
        return make_response(json.dumps(result), 200)

