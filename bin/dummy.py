##################################################
# Dummy Process
#

from datetime import datetime

class Logger:
    def info(self, msg):
        print(datetime.now(), 'info', msg)
    def debug(self, msg):
        print(datetime.now(), 'debug', msg)
    def warning(self, msg):
        print(datetime.now(), 'warning', msg)

class Sender:
    def info(self, msg):
        print(datetime.now(), 'info', msg)
    def debug(self, msg):
        print(datetime.now(), 'debug', msg)
    def warning(self, msg):
        print(datetime.now(), 'warning', msg)

class Receiver:
    def info(self, msg):
        print(datetime.now(), 'info', msg)
    def debug(self, msg):
        print(datetime.now(), 'debug', msg)
    def warning(self, msg):
        print(datetime.now(), 'warning', msg)
