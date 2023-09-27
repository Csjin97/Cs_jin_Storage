#=====================================================================================
# Shell Execute Control
#=====================================================================================
import os
import time
from datetime import datetime
import subprocess
import fcntl
import signal
from urllib.request import ProxyBasicAuthHandler
import psutil

class ShellCtrl(object):
	""" External shell control """
	def __init__(self):
		self.proc = None
		return

	def __del__(self):
		print('Destruct')
		self.Close(0.1)

	def Exec(self, exeName, args, timeout=1):
		""" Synchronous Shell Execute, Wait for process terminate

			Arguments:
				exeName: file name
				args: runtime arguments

			Return: (str: readout stdout message)
		"""
		result = ''
		start_time = datetime.now()
		if not self.Open(exeName, args):
			return "Exe file not found"

		while self.proc.poll() is None:
			#s = self.non_block_read(p)
			s = self.Read()
			if (not s is None) and (s != ''):
				result += s
			# Check Timeout
			elapsed_time = datetime.now() - start_time
			if (timeout > 0) and (elapsed_time.total_seconds() > timeout):
				self.Close(0.1)
				result += 'Time Out'
			time.sleep(0.1)
		s = self.Read()
		if (not s is None) and (s != ''):
			result += s
		return result

	def Open(self, exeFile, args):
		""" Open Process (Non-blocking)

			Arguments:
				exeFile: exe filename
				args: Arguments
		"""
		print(exeFile)
		if not os.path.exists(exeFile):
			self.proc = None
			return False
		
		params = [exeFile]
		params.extend(args)
		try:
			self.proc = subprocess.Popen(params, bufsize=0, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
			fd = self.proc.stdout.fileno()
			fl = fcntl.fcntl(fd, fcntl.F_GETFL)
			fcntl.fcntl(fd, fcntl.F_SETFL, fl | os.O_NONBLOCK)
		except Exception as e:
			print('OPEN', str(e))
		return True

	def Read(self):
		""" Read stdout """
		result = ''
		try:
			if not (self.proc is None):
				result = self.proc.stdout.read()
		except Exception as e:	# IOError as e
			if e.errno != 35:	# Reject Resource Unavailable Error
				print('READ', str(e))
			result = None
		if result == None:
			result = ''
		#print(type(result), result)
		if type(result) == type('aa'):
			return result
		else:
			return result.decode('ascii')

	def Close(self, waitTimeSeconds=1):
		""" Stop Process """
		#print('CLOSE', waitTimeSeconds)
		if self.proc is None:
			return 0

		pid = self.proc.pid
		#print('CLOSE', pid)
		try:
			self.proc.send_signal(signal.SIGTERM)
		except Exception as e:
			print('Close', str(e))

		# Wait for Close (Blocked)
		if waitTimeSeconds == 0:
			retCode = self.proc.wait()
			return retCode
		time.sleep(waitTimeSeconds)

		self.KillByPID(pid)
		return -1

	def KillByName(self, name):
		""" Stop Process """
		#print 'Kill Name', name
		isFind = True
		while isFind:
			isFind = False
			for proc in psutil.process_iter():
				try:
					if proc.name() == name:
						isFind = True
						proc.kill()
				except Exception as e:
					print('KillByName', str(e))
					continue
		return isFind

	def KillByPID(self, pid):
		""" Stop Process """
		#print 'Kill PID', pid
		for proc in psutil.process_iter():
			try:
				if proc.pid == pid:
					proc.kill()
					#time.sleep(1)
					#print 'Kill', pid, 'Complete'
			except Exception as e:
				print('KillByPID', str(e))
				continue
		return -1

	def IsLive(self):
		""" Process is Live	"""
		return (not self.proc is None) and (self.proc.poll() is None)



def SelfTest():
	""" Self Test Function """
	s = ShellCtrl()
	print( datetime.now() )
	print( s.Run('test.py', ['-k', '-i', 'ds2akn', '-u', '23206'], 0) )
	print( datetime.now() )
	print( 'Complete' )

#=====================================================================================
# Self Test
if __name__ == "__main__":
	SelfTest()
