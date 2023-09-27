#########################################################################################
#   QuMail Web Management Service
#   id : { pw:'{SSHA}password or password', name: '', dept: '', mailaccount: '', mailpw: ''}

import os
import json
import platform

import logging
from logging.handlers import RotatingFileHandler, TimedRotatingFileHandler
from logging import Formatter

from flask import Flask

# Session Manager
from Lib.RedisSession import RedisSessionInterface

# API
from WebAPI.login import CLogin
from WebAPI.log import CLog

from WebAPI.server import CServer
from WebAPI.rule import CRule
from WebAPI.history import CHistory
from WebAPI.model import CModel
from WebAPI.train import CTrain
from WebAPI.basemodel import CBaseModel

# Start Configuration
class Config(object):
     # Flask settings
    SECRET_KEY = 'This is an INSECURE secret!! DO NOT use this in production!!'

    # Flask-SQLAlchemy settings
    db = {
        'user': 'hims',
        'password': 'hims1111',
        'host': '127.0.0.1',
        'port': '3306',
        'database': 'hims'
    }
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://%s:%s@%s:%s/%s?charset=utf8" % (db['user'], db['password'], db['host'], db['port'], db['database'])
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # Admin
    ADMIN = {
        "admin": {
            "password": "p@ssw0rd",
            "name": "관리자"
        },
    }

    # File Path
    DATA_ROOT = '/var/opt/hims/ml-websvc/'
    DATA_TEMP = DATA_ROOT + 'temp/'
    DATA_LOG = '/var/log/hims/ml-websvc/'
    os.makedirs(DATA_TEMP,  exist_ok=True)
    os.makedirs(DATA_LOG,  exist_ok=True)

mode = os.environ.get('FLASK_ENV', 'development')
app = Flask(__name__)
app.config.from_object(__name__+'.Config')

# RedisUser.py -c 를 사용해 관리자 암호를 생성할 것
config_file = '/opt/hims/ml-websvc/etc/mlmanager.conf'
#config_file = '../etc/bitxfer.conf'


logfile =  app.config['DATA_LOG'] + 'mlmgt.log'
if os.path.exists(config_file):
    with open(config_file, 'r') as f:
        tmp = f.read(-1)
    data = json.loads(tmp)
    # print(data)
    if ('admin' in data):
        app.config['ADMIN'] = data['admin']
        for key in app.config['ADMIN']:
            app.config['ADMIN'][key]['password'] = 'p@ssw0rd'

app.debug = (mode == 'development')
 
#file_handler = RotatingFileHandler(logfile, maxBytes=100000)
file_handler = TimedRotatingFileHandler(filename=logfile, when='midnight', interval=1, encoding='utf-8')
file_handler.setFormatter(Formatter('%(asctime)s %(levelname)s (%(module)s:%(lineno)d) %(message)s', "%m/%d/%Y %H:%M:%S")) #  in %(filename)s:%(lineno)d]'))
file_handler.setLevel(logging.DEBUG)
file_handler.suffix = '%Y%m%d'
app.logger.addHandler(file_handler)

#logging.basicConfig(filename='/home/shbaek/DATA/log/qumail.log',level=logging.DEBUG)

app.logger.info('Start ML Management Service')
app.logger.debug('Start Mode:' + mode + ', Debug=' + str(app.debug))
app.logger.debug('Log File: ' + logfile)
app.logger.debug('Admin IDs: ' + ','.join(app.config['ADMIN'].keys()))

# Session Config
#session = {}
# Session Timeout
#app.permanent_session_lifetime = timedelta(seconds=30)
# Session Maintain 30seconds
app.session_interface = RedisSessionInterface(timeout=60*60) # 60 minutes

#userManager = User(app.logger)
#policy = CFilePolicy()

login_view = CLogin.as_view('login_api')
app.add_url_rule('/login', view_func=login_view, methods=['GET', 'POST', 'DELETE'])

server_view = CServer.as_view('server_api')
app.add_url_rule('/server', view_func=server_view, methods=['GET', 'POST', 'PUT', 'DELETE'])

modelview = CModel.as_view('model_api')
app.add_url_rule('/model', view_func=modelview, methods=['GET', 'POST', 'PUT', 'DELETE'])

basemodelview = CBaseModel.as_view('basemodel_api')
app.add_url_rule('/basemodel', view_func=basemodelview, methods=['GET', 'POST', 'PUT', 'DELETE'])

rule_view = CRule.as_view('rule_api')
app.add_url_rule('/rule', view_func=rule_view, methods=['GET', 'POST', 'PUT', 'DELETE'])

history_view = CHistory.as_view('history_api')
app.add_url_rule('/history', view_func=history_view, methods=['GET'])

train_view = CTrain.as_view('train_api')
app.add_url_rule('/train', view_func=train_view, methods=['GET', 'POST', 'PUT', 'DELETE'])

log_view = CLog.as_view('log_api')
app.add_url_rule('/log', view_func=log_view, methods=['GET'])





if __name__ == "__main__":
    app.run(debug=(os.environ.get('FLASK_ENV', 'development') == 'development'))
