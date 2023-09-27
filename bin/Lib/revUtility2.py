import math
import os
import json
from datetime import datetime
from flask import current_app
"""
last updated: 2021/06/11
"""

timeCheck = {}
class RevDict(object):
	def diffTime(tmStart=0):
		"""
		초단위 시간 차이를 측정
		:param tmStart:
		:return:
		"""
		now = datetime.now()
		if tmStart:
			return (now - tmStart).total_seconds()
		return now

	def timeList(text, data):
		timeCheck[text] = "{:.6f}".format(data)

	def timeprint():
		current_app.logger.info(timeCheck)