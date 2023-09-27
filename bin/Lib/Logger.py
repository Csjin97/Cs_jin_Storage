#! /usr/bin/python
# coding: utf-8
#======================================================================
# Log class
# 
#======================================================================
import os
import sys
import shutil
import datetime
import traceback
import subprocess

import logging
import logging.handlers

class DummyLogger():
	def info(self, message):
		self.__Write__('info', message)
	
	def debug(self, message):
		self.__Write__('debug', message)
	
	def warning(self, message):
		self.__Write__('warning', message)
	
	def error(self, message):
		self.__Write__('error', message)	
		
	def critical(self, message):
		self.__Write__('critical', message)
		
	def TraceBack(self, msg = ''):
		exc_type, exc_value, exc_traceback = sys.exc_info()		
		errN = exc_traceback
		err = errN
		while True:
			aa = traceback.extract_tb(errN)
			if (aa == []) or (aa[0][0][0:6] != '/Users'):
				break
			err = errN
			errN = err.tb_next

		aa = traceback.extract_tb(err)
		msg2 = ','.join([msg, aa[0][0], str(aa[0][1])])
		self.error('A_' + msg2)
		return msg2
			
	def ListToString(self, data):
		result = []
		for each in data:
			result.append(each)#.decode('utf-8').encode('utf-8')) #.encode('utf-8'))
		return ','.join(result)	
	
	def WriteEmlLog(self, result, account):
		reject = result.get('Body', None)
		msg = []
		msg.append(result['UID'])
		if (reject != None) and (reject == 'REJECT'):
			msg.append('Reject')
		elif reject == 'Start':
			msg.append('Start')
		else:
			msg.append('Success')
		
		msg.append('D[' + result['Date'] + ']')		
		data = self.ListToString(result.get('From',[]))
		msg.append('F[' + data + ']')
		data = self.ListToString(result.get('To',[]))
		msg.append('T[' + data + ']')		
		data = self.ListToString(result.get('Cc',[]))
		msg.append('C[' + data + ']')		
		data = self.ListToString(result.get('Bcc',[]))
		msg.append('B[' + data + ']')		
		
		msg.append('S[' + result['Subject'] + ']')		
		data = self.ListToString(result.get('Files',[]))
		msg.append('A[' + data + ']')
		
		self.info(' '.join(msg))

	def __Write__(self, logtype, message):
		d = datetime.datetime.now()
		# format date type message
		s = d.strftime('%m/%d/%y') + ' ' + d.strftime('%H:%M:%S.%f')[:12]
		print(s + ' ' + logtype + ' ' + message)

	def ErrorHandle(self, heading=''):
		# Add 180404
		result = ''
		try:
			exc_type, exc_value, exc_tb = sys.exc_info()
			msg = str(exc_value)
			if msg == '':
				msg = '--'
			msg = msg.replace(' ', '_')
			_ , ff = os.path.split(exc_tb.tb_frame.f_code.co_filename)
			isError = (exc_type.__name__ != 'CustomException')
			if isError:
				result = ' '.join([ ff, str(exc_tb.tb_lineno), exc_type.__name__, msg ])
			else:
				result = ' '.join([ ff, str(exc_tb.tb_lineno), msg ])
		except Exception as e:
			print('Error ErrorHandle()', e)
			result = 'ErrorHandle ' + e.__repr__()
			isError = True
		if isError:
			self.error('B_' + heading + result)
		else:
			self.warning(heading + result)
		return isError, result

	def WarningHandle(self, heading=''):
		# Add 180404
		result = ''
		try:
			exc_type, exc_value, exc_tb = sys.exc_info()
			msg = str(exc_value)
			if msg == '':
				msg = '--'
			msg = msg.replace(' ', '_')
			_ , ff = os.path.split(exc_tb.tb_frame.f_code.co_filename)
			result = ' '.join([ ff, str(exc_tb.tb_lineno), msg ])
		except Exception as e:
			print('Error WarningHandle()', e)
			result = 'WarningHandle ' + e.__repr__()
		self.warning(heading + result)
		return result

	def ShellExec(self, message):
		args = ['/Users/Seculane/KOCES/script/alert.py', '4', message]
		result = ''
		p = subprocess.Popen(args, stdout = subprocess.PIPE, stderr = file(os.devnull,'w'))
		while p.poll() is None:
			result += p.stdout.read()
		result += p.stdout.read()
		
class CustomException(Exception):
	def __init__(self, msg):
		self.msg = msg
	
	def __str__(self):
		return self.msg

class Logger(DummyLogger):
	def __init__(self, logName, logFileName = '', isDebug = True, isConsoleOut = True, dformat = '%m/%d/%Y %H:%M:%S'):
		self.format = format
		self.isDebug = isDebug
		self.isConsoleOut = isConsoleOut
		self.logFileName = logFileName
		self.BackupLogFile()
		
		if (isDebug):
			loglevel = logging.DEBUG
		else:
			loglevel = logging.INFO
			
		self.logger = logging.getLogger(logName)
		self.logger.setLevel(loglevel)
		Format = "%(asctime)s.%(msecs)03d %(levelname)s %(message)s"
		formatter = logging.Formatter(Format, dformat)

		if (isConsoleOut):
				ch = logging.StreamHandler()
				ch.setLevel(loglevel)
				ch.setFormatter(formatter)
				self.logger.addHandler(ch)

		if logFileName != '':
			hdlr = logging.handlers.TimedRotatingFileHandler(logFileName, 'midnight', 1)
			hdlr.setFormatter(formatter)
			hdlr.setLevel(loglevel)
			self.logger.addHandler(hdlr)

	# 재 실행시에 날짜가 지난 경우 기존것은 백업하고 새로 생성
	def BackupLogFile(self):
		if (os.path.exists(self.logFileName)):
			dt = datetime.datetime.now()
			mtime = datetime.datetime.fromtimestamp(os.path.getmtime(self.logFileName))
			nkey = dt.strftime('%Y-%m-%d')
			mkey = mtime.strftime('%Y-%m-%d')
			if (nkey != mkey):
				shutil.move(self.logFileName, self.logFileName + '.' + mkey)

	def info(self, message, extrainfo = '', arg = 'aaa'):
		message = message.replace("'", '"')
		if extrainfo == '':
			self.logger.info(message)
		else:
			self.logger.info(extrainfo + ' ' + message)
		
	def error(self, message, extrainfo = ''):
		message = message.replace("'", '"')
		if extrainfo == '':
			self.logger.error('C_' + message)
		else:
			self.logger.error('D_' + extrainfo + ' ' + message)
		# self.ShellExec(message)
		
	def debug(self, message, extrainfo = ''):
		message = message.replace("'", '"')
		if extrainfo == '':
			self.logger.debug(message)
		else:
			self.logger.debug(extrainfo + ' ' + message)
		
	def warning(self, message, extrainfo = ''):
		message = message.replace("'", '"')
		if extrainfo == '':
			self.logger.warning(message)
		else:
			self.logger.warning(extrainfo + ' ' + message)