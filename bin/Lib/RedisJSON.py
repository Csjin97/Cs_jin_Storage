#########################################################################################
#
#   File Policy Management (Use Redis)
from datetime import datetime
import json
import redis

class RedisJSON():
    def __init__(self, name, host='localhost', port=6379, db=1, timeout=3600):
        self.store = redis.StrictRedis(host=host, port=port, db=db)
        self.name = name
    
    def Get(self, key, default = ''):
        data = self.GetAll()
        result = data.get(key, default)
        return result

    def GetAll(self):
        data = self.store.get(self.name)
        result = self.proplist
        try:
            buffer = json.loads(data)
            for key in self.proplist:
                if (key in buffer):
                    result[key] = buffer[key]
        except Exception as e:
            #print('RedisJSON.GetAll', e)
            pass
        return result

    def Filter(self, data):
        result = {}
        for key in self.proplist:
            result[key] = self.proplist[key]
            if (key in data):
                result[key] = data[key]
        return result

    def Compare(self, after):
        result = {}
        before = self.GetAll()
        for key in self.proplist:
            b = before.get(key, '')
            a = after.get(key, '')
            if (a != b) and (a != ''):
                result[key] = str(b) + ' -> ' + str(a)
        return result

    def Set(self, key, value):
        result = self.GetAll()
        result[key] = value
        self.SetAll(result)

    def SetAll(self, data):
        try:
            # Check Keys
            safedata = self.Filter(data)
            #print(safedata)
            self.store.set(self.name, json.dumps(safedata))
        except Exception as e:
            print('RedisJSON.SetAll', e)

    def SetAllTimeout(self, data, timeout=60):
        try:
            # Check Keys
            safedata = self.Filter(data)
            #print(safedata)
            self.store.set(self.name, json.dumps(safedata),ex=timeout) # datetime.timedelta(seconds=timeout))
        except Exception as e:
            print('RedisJSON.SetAll', e)

    def Delete(self):
        self.store.delete(self.name)
