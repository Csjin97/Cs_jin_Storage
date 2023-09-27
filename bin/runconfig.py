#! /usr/bin/python
# coding: utf-8
#-------------------------------------------------------------
import os
import json

def Is(value, compare):
	return value == compare

def NotIs(value, compare):
	return value != compare

# Test hstest.py
def WebConfig(d, s, m, sl):
	info = {}
	info['DirIs'] = d
	info['ServiceIs'] = s
	info['IsMaster'] = m
	info['IsSlave'] = sl

	ExportFile = 'N'
	ImportFile = 'N'
	ExportMail = 'N'
	ImportMail = 'N'
	MailTest = 'N'
	EditOrganize = 'N'

	if NotIs(info['DirIs'], 'IMPORT') and NotIs(info['ServiceIs'], 'MAIL') and Is(info['IsMaster'], 'Yes'):
		if info['IsSlave'] == 'No':
			ExportFile = 'Edit'
		else:
			ExportFile = 'View'

	if NotIs(info['DirIs'], 'IMPORT') and NotIs(info['ServiceIs'], 'FILE') and Is(info['IsMaster'], 'Yes'):

		if info['IsSlave'] == 'No':
			ExportMail = 'Edit'
		else:
			ExportMail = 'View'

	if NotIs(info['DirIs'], 'EXPORT') and NotIs(info['ServiceIs'], 'MAIL') and Is(info['IsMaster'], 'Yes') and NotIs(info['IsSlave'], 'Yes'):
		ImportFile = 'Edit'
	elif Is(info['DirIs'], 'IMPORT') and NotIs(info['ServiceIs'], 'MAIL') and NotIs(info['IsMaster'], 'Yes'):
		ImportFile = 'REVR'
	elif  NotIs(info['DirIs'], 'EXPORT') and NotIs(info['ServiceIs'], 'MAIL') and (NotIs(info['IsMaster'], 'Yes') or Is(info['IsSlave'], 'Yes')):
		ImportFile = 'View'

	if NotIs(info['DirIs'], 'EXPORT') and NotIs(info['ServiceIs'], 'FILE') and Is(info['IsMaster'], 'Yes') and NotIs(info['IsSlave'], 'Yes'):
		ImportMail = 'Edit'
	elif Is(info['DirIs'], 'IMPORT') and NotIs(info['ServiceIs'], 'FILE') and NotIs(info['IsMaster'], 'Yes'):
		ImportMail = 'REVR'
	elif  NotIs(info['DirIs'], 'EXPORT') and NotIs(info['ServiceIs'], 'FILE') and (NotIs(info['IsMaster'], 'Yes') or Is(info['IsSlave'], 'Yes')):
		ImportMail = 'View'

	if NotIs(info['ServiceIs'], 'FILE') and ((Is(info['DirIs'], 'BOTH') and NotIs(info['IsMaster'], 'Yes')) or (Is(info['DirIs'], 'IMPORT') and Is(info['IsMaster'], 'Yes') and NotIs(info['IsSlave'], 'Yes'))):
		MailTest = 'Yes'

	if (Is(info['IsMaster'], 'Yes') and NotIs(info['IsSlave'], 'Yes')) or (NotIs(info['IsMaster'], 'Yes') and Is(info['DirIs'], 'IMPORT')):
		EditOrganize = 'Edit'
	else:
		EditOrganize = 'View'

	result = {}
	result['ExportFile'] = ExportFile
	result['ImportFile'] = ImportFile
	result['ExportMail'] = ExportMail
	result['ImportMail'] = ImportMail
	result['MailTest'] = MailTest
	result['EditOrganize'] = EditOrganize

	return result

def GetConfFileName():
	return '../etc/secumail.conf'

# Auto Create Path
def createFolder(directory):
    try:
        if not os.path.exists(directory):
            os.makedirs(directory)
    except OSError:
        print ('Error: Creating directory. ' +  directory)

def GetConfig():
	fileSetting = GetConfFileName()
	with open(fileSetting, 'r') as f:
		tmp = f.read()
	info = json.loads(tmp)
	info['web'] = info['WebRoot']
	info['mailapp'] = info['Root'] + info['mailapp']
	info['bin'] = info['Root'] + '/bin'

	# Policy Edit Option
	#result = WebConfig(info['DirIs'], info['ServiceIs'], info['IsMaster'], info['IsSlave'])
	#info.update(result)

	info['IsSlave'] = (info['IsSlave'] == 'Yes')
	info['hasSlave'] = (info['hasSlave'] == 'Yes')

	info['IsMaster'] = (info['IsMaster'] == 'Yes')

	if info['IsMaster']:
		if info['DirIs'] == 'BOTH':
			info['mode'] = "both"
		else:
			info['mode'] = "send"
	else:
		if info['DirIs'] == 'BOTH':
			info['mode'] = "both"
		else:
			info['mode'] = "recv"

	info['MasterIP'] = info.get('MasterIP', None)
	info['SlaveIP'] = info.get('SlaveIP', None)

	info['run'] = info['datadir'] + "/run"
	info['log'] = info['datadir'] + "/log"
	info['mail'] = info['datadir'] + "/mail"
	info['senddir'] = info['datadir'] + "/send"
	info['recvdir'] = info['datadir'] + "/recv"
	info['tempdir'] = info['datadir'] + "/tmp"
	info['backup'] = info['datadir'] + "/backup"
	info['userdir'] = "/opt/Seculane/Users"
	info['convdir'] = info['bin'] # "/Users/shbaek/Dropbox/Seculane/WebService/src"
	createFolder(info['datadir'])
	createFolder(info['run'])
	createFolder(info['log'])
	createFolder(info['mail'])
	createFolder(info['mail'] + '/render')
	createFolder(info['senddir'])
	createFolder(info['recvdir'])
	createFolder(info['tempdir'])
	createFolder(info['backup'])


	# Policy Edit Option
	info['IsEditable'] = info['IsMaster'] and (not info['IsSlave'])
	info['IsEditOrg'] = info['IsEditable'] or ((not info['IsMaster']) and (info['DirIs'] == 'IMPORT'))
	info['IsMailTest'] = (info['ServiceIs'] != 'FILE') and (((info['DirIs'] == 'BOTH') and (not info['IsMaster'])) or ((info['DirIs'] == 'IMPORT') and info['IsMaster'] and (not info['IsSlave'])))

	info['IsViewFile'] = not info['IsEditable']
	info['IsViewFile'] = info['IsViewFile'] and (info['ServiceIs'] != 'MAIL')
	info['IsViewMail'] = (not info['IsEditable']) or (info['IsMaster'] and (info['DirIs'] == 'IMPORT'))
	info['IsViewMail'] = info['IsViewMail'] and (info['ServiceIs'] != 'FILE')

	# print '-'*50
	#print 'DirIs', info['DirIs']
	#print 'ServiceIs', info['ServiceIs']
	#print 'IsMaster', info['IsMaster']
	#print 'IsSlave', info['IsSlave']
	#print 'IsEditable', info['IsEditable']
	#print 'IsEditOrg', info['IsEditOrg']
	#print 'IsViewFile', info['IsViewFile']
	#print 'IsViewMail', info['IsViewMail']
	#print '-'*50

	return info

if __name__ == '__main__':
	info = GetConfig()
	print info
