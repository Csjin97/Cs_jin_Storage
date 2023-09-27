#########################################################################################
#
#   Common Functions
#

import os, shutil
import subprocess
from flask import session

CFG_FILE = '../etc/bitxfer.conf'

def IsLogin():
    userid = session.get('id', None)
    #username2 = request.cookies.get('username', None)
    #print (os.getpid(), 'IsLogin', username, username2)
    return (userid != None)

def IsAdmin():
    result = session.get('isAdmin', False)
    #username2 = request.cookies.get('username', None)
    #print (os.getpid(), 'IsLogin', username, username2)
    return result

def ShellExec(args):
    print(args)
    p = subprocess.Popen(args, stdout = subprocess.PIPE, stderr = subprocess.PIPE)
    result = ''
    while p.poll() is None:
        tmp = p.stdout.read()
        result += tmp.decode('utf-8')
    tmp = p.stdout.read()
    result += tmp.decode('utf-8')
    print('...', result)
    if p.returncode != 0:
        result = ''
    tmp = result.split('\n')
    #print('--------------------------------------')
    result = tmp[len(tmp)-2]
    #print('2: --->', tmp)
    #print('--------------------------------------')
    return (p.returncode == 0), result

def GetUserDirectorySize(directory):
    # du -ch ~/DATA/send/ds2akn/*.zip, du -sh
    if not os.path.exists(directory):
        return 0
    args = [ "du", '-s', directory]
    # print(args)
    p = subprocess.Popen(args, stdout = subprocess.PIPE)
    p.wait()
    s = p.stdout.read()
    #print('Test', s)
    size = s.split()[0]
    result = p.returncode #
    # print('>>>>', directory, p.returncode, int(size))
    return int(size) * 1024
