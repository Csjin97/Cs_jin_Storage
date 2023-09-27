#########################################################################################
#
#   HIMS Resource Daemon
#               2022.08.26
#           Resource Check  --> regist redis
#           
from datetime import datetime
import os
import platform
import sys
from time import sleep
from WebAPI.system import CResource
import daemon
from daemon import pidfile
import dummy

DATA_ROOT = '/var/opt/hims/ml-websvc/'
print (DATA_ROOT)
pid_file = DATA_ROOT + 'run/mlmgt.pid'
DATA_LOG = DATA_ROOT + 'log/'

os.makedirs(DATA_LOG,  exist_ok=True)
os.makedirs( DATA_ROOT + 'run/',  exist_ok=True)

def start():
    # Auto Resource Update
    k = CResource()
    k.Start()

    while True:
        sleep(0.2)


def start_daemon():
    with daemon.DaemonContext(
        working_directory = '/tmp',
        umask = 0o002,
        pidfile = pidfile.TimeoutPIDLockFile(pid_file),
        ) as context:
        start() # 실행 하고자 하는 함수

def main():
    try:
        if sys.argv[1] == 'start':
            start_daemon()
        elif sys.argv[1] == 'test':
            start()
        elif sys.argv[1] == 'stop':
            pid = '999999'
            
            f = open(pid_file, 'r')
            
            for line in f:
                print(line)
                pid = line = line.strip()

            f.close()
            cmd = 'kill '+ pid
            print('kill', pid)

            os.system(cmd)
            
    except Exception as e:
        print(e)

if __name__ == '__main__':
    main()
