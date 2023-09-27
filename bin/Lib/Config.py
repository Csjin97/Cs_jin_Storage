#! /usr/bin/python
# coding: utf-8
#======================================================================
# Log class
# 
#======================================================================
import os
import json	

class Config():
	def __init__(self, confFileName):
		self.Success = False
		
		if not os.path.exists(confFileName):
			print 'Configuration file not found: %s ' % confFileName
			return
		
		try:
			with open(confFileName, 'r') as f:
				s = f.read(-1)
			self.data = json.loads(s)
		except:
			print 'Error: %s has incorrect data' % confFileName
			return		
		self.Success = True
		
	def Value(self, key, default):
		if (self.Success):
			return self.data.get(key, default)
		else:
			return default
			
	def Get(self, category, key, default):
		if (self.Success):
			cat = self.data.get(category, None)
			if cat != None:
				return cat.get(key, default)

		return default
		
	def DaemonInfo(self, keys):
		result = {}
		if (self.Success):
			cat = self.data.get('daemon', None)
			if cat != None:
				for each in keys:
					value = cat.get(each, None)
					if (value != None):
						result[each] = value.encode()

		for each in keys:
			if not (each in result.keys()):
				result[each] = ''
		
		return result