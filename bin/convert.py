#! /usr/bin/python
# coding: utf-8
#======================================================================
import sys
import base64
import unicodedata

codelist = [ 'cp949', 'utf-8', 'gbk', 'gb18030', 'euc-kr', 'ibm-euckr', 'ks_c_5601-1987', 'gb2312']

def AutoConvert(text):
	result = ''
	for codeset in codelist:
		try:
			result = text.decode(codeset).encode('utf-8')
			break
		except:
			result = ''
	return result

def AutoConvert2(text):
	result = []
	src = text.split('>')
	for each in src:
		line = AutoConvert(each)
		if (line != ''):
			result.append(line)
		else:
			result.append(each)
	return '>'.join(result)
	
def ConvertToUTF8(text, charset):
	if text == None:
		return ''
	
	if charset != 'None':
		charset = charset.lower()
		if (charset == 'ks_c_5601-1987') or (charset == 'euc-kr') or (charset == 'ibm-euckr'):
			charset = 'cp949'
		elif (charset == 'gb2312'):
			charset = 'gbk'
	else:
		charset = None
	try:
		result = text.decode(charset).encode('utf-8')
	except:	
		result = AutoConvert2(text)
		if (result == ''):
			result = text
	return result

def WebText2Text(text, codeset):
	data = []
	i = 0
	while (i < len(text)):
		if text[i] == '%':
			data.append(int(text[i+1:i+3], 16) & 0xff)
			i+=2
		else:
			data.append(ord(text[i]))
		i += 1

	s = "".join(map(chr, data))
	try:
		s = s.decode(codeset)
		s = unicodedata.normalize('NFC', s)
	except:
		#print 'Err: WebText Conversion'
		ss = '' # dummy code
	return s.encode(codeset)
	
def Convert(cmd, text, charset):
	tmp = base64.b64decode(text)
	#tmp = json.loads(text)
	#result = tmp['data']

	#print('-------------------------------')
	#print(charset)
	#print(tmp)

	if cmd == 'd':
		result = text.decode(charset)
	elif cmd == 'e':
		result = text.encode(charset)
	elif cmd == 'u':
		result = ConvertToUTF8(tmp, charset)
	elif cmd == 'w':
		result = WebText2Text(tmp, charset)
	return base64.b64encode(result)

if __name__ == "__main__":
	with open(sys.argv[2], 'r') as f:
		data = f.read(-1)
	print(Convert(sys.argv[1], data, sys.argv[3]))
	#data = 'S0fAzLTPvcO9ug=='
	#data = 'uem788f2'
	#data = 'W0tHwMy0z73DvbogILDhwabIrsDOXSC56bvzx/a01CwgKMHWKb+jxry3ur26v6G8rSCw4cGmx8+9xSCzu7+qIMiuwM652bb4tM+02S4='
	#result = Convert('u', data, 'euc-kr')
	#print('result:', result)
