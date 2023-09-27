#########################################################################################
#   Policy Management (Use Redis)
#   Data format : JSON 
import sys
import redis

#########################################################################################
class CRedis():
    #====================================================================================
    # Init connection
    def __init__(self, host='localhost', port=6379, db=1, timeout=3600):
        self.store = redis.StrictRedis(host=host, port=port, db=db)
        self.proplist = {}

    #====================================================================================
    def _GetKeyList(self):
        keys = self.store.keys()
        result = []
        for key in keys:
            if (sys.version_info.major < 3):
                result.append(str(key))
            else:
                result.append(str(key, 'utf-8'))

        #print('GetKeyList', result)
        return result

    #====================================================================================
    def _Delete(self, key):
        self.store.delete(key)

    def _KeyInitial(self, key, value):
        result = self.store.get(key)
        #print(key, value, result, type(value))
        if result == None:
            self._Set(key, value)

    def _Set(self, key, value):
        if (type(value) == type(True)):
            if value:
                value = 1
            else:
                value = 0
        self.store.set(key, value)
    
    def _GetString(self, key, default=''):
        #if (type(key) == 'str'):
        #    key = bytes(key)
        #print('aaa', sys.version_info)
        result = self.store.get(key)
        if result == None:
            return default
        else:
            if (sys.version_info.major < 3):
                return str(result)
            else:
                return str(result, 'utf-8')

    def _GetInt(self, key, default=0):
        #if (type(key) == 'str'):
        #    key = bytes(key)
        result = self.store.get(key)
        if result == None:
            return default
        else:
            return int(result)

    def _GetBool(self, key, default=False):
        #if (type(key) == 'str'):
        #    key = bytes(key)
        result = self._GetInt(key, -1)
        if result == -1:
            return default
        else:
            return result != 0

    def Write(self, key, value):
        print('Write', key, value)
        if (key in self.proplist):
            if type(value) == type(True):
                if (value):
                    self._Set(key, 1)
                else:
                    self._Set(key, 0) 
            else:
                self._Set(key, value)
        #self.Backup()

    def Read(self, key):
        if (key in self.proplist.keys()):
            t = type(self.proplist[key])
            if (t == type(1)):
                return self._GetInt(key, self.proplist[key])
            elif (t == type(True)):
                return self._GetBool(key, self.proplist[key])
            else:
                return self._GetString(key, self.proplist[key])
        return None
        
    def Backup(self, key, value):
        self.store.bgsave()
    
    def _Copy(self, refDict, dstDict):
        result = refDict.copy()
        for key in dstDict:
            if key in result:
                result[key] = dstDict[key]
        return result
