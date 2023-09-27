import os

# gunicorn -c ../etc/gunicorn_setting.py websvc:app
# bind = '127.0.0.1:' + str(os.getenv('PORT', 19000))
bind = 'unix:/tmp/mlmanager.sock'
proc_name = 'ML-WEBSVC'
workers = 4 
reload = True
# Flask 실행 환경변수s
raw_env=["FLASK_ENV=development"]
#raw_env=["FLASK_ENV=production"]
