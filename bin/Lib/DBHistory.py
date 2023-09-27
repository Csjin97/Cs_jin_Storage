import datetime, enum
import json, uuid
from os import stat

from sqlalchemy import SmallInteger, Table, Column, MetaData, create_engine
from sqlalchemy import Integer, BigInteger, String, Boolean, DateTime, Sequence, Enum, Float, or_, and_
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects import mysql

from Lib.revUtility2 import RevDict
Base = declarative_base()

# pip install pymysql

db = {
    'user': 'root',
    'password': 'hims1111',
    'host': '127.0.0.1',
    'port': '3306',
    'database': 'hims'
}

# Pythn3
#SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{db['user']}:{db['password']}@{db['host']}:{db['port']}/{db['database']}?charset=utf8"
# Python2
SQLALCHEMY_DATABASE_URI = "mysql+pymysql://%s:%s@%s:%s/%s?charset=utf8" % (db['user'], db['password'], db['host'], db['port'], db['database'])
SQLALCHEMY_TRACK_MODIFICATIONS = False
# print(SQLALCHEMY_DATABASE_URI)

'''
+---------------+-------------------------------------------------------+------+-----+---------+-------+
| Field         | Type                                                  | Null | Key | Default | Extra |
+---------------+-------------------------------------------------------+------+-----+---------+-------+
| id            | varchar(50)                                           | NO   | PRI | NULL    |       |
| name          | varchar(200)                                          | NO   |     | NULL    |       |
| client_id     | varchar(50)                                           | YES  |     | NULL    |       |
| recipe        | varchar(50)                                           | NO   |     | NULL    |       |
| lot           | varchar(50)                                           | YES  |     | NULL    |       |
| zone          | varchar(50)                                           | YES  |     | NULL    |       |
| x             | bigint(20)                                            | YES  |     | NULL    |       |
| y             | bigint(20)                                            | YES  |     | NULL    |       |
| state         | enum('ready','request','insp_end','complete','error') | NO   |     | ready   |       |
| ready_time    | datetime                                              | YES  |     | NULL    |       |
| req_time      | datetime                                              | YES  |     | NULL    |       |
| end_time      | datetime                                              | YES  |     | NULL    |       |
| complete_time | datetime                                              | YES  |     | NULL    |       |
| model_id      | varchar(50)                                           | YES  |     | NULL    |       |
| label         | varchar(20)                                           | YES  |     | NULL    |       |
| score         | double                                                | YES  |     | NULL    |       |
| result        | longtext                                              | YES  |     | NULL    |       |
+---------------+-------------------------------------------------------+------+-----+---------+-------+
'''

class StateType(enum.Enum):
    ready = 0     # Create request : approver. same new for approver
    request = 1    # Approve or Reject
    insp_end = 2    # 망을 넘어와서 다운로드 할 수 있는 상태이다.
    complete = 3
    error = 4

class ImageInfo(Base):
    __tablename__ = 'imageInfo'

    # Transaction Key (UUID)
    id = Column(String(50), nullable=False, primary_key=True, autoincrement=False)
    name = Column(String(200), nullable=False)
    client_id = Column(String(50), nullable=True)
    recipe = Column(String(50), nullable=False)
    lot = Column(String(50), nullable=False)
    zone = Column(String(50), nullable=False)

    x = Column(BigInteger, default=False)
    y = Column(BigInteger, default=False)

    state = Column(Enum(StateType))

    ready_time = Column(DateTime, default=datetime.datetime.now())
    req_time = Column(DateTime, default=datetime.datetime.now())
    end_time = Column(DateTime, default=datetime.datetime.now())
    complete_time = Column(DateTime, default=datetime.datetime.now())
    last_access_time = Column(DateTime, default=datetime.datetime.now())

    model_id = Column(String(50), nullable=False)
    label = Column(String(50), nullable=False)

    score = Column(Float)
    result = Column(mysql.LONGTEXT)

    def __init__(self, json_data):
        self.id = uuid.uuid4()

    #def IsValid(self):
    #    return (self.state != 0) and (self.userid != '')

    def __repr__(self):
        return "<User('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s')>" % \
            (self.id, self.name, self.client_id, \
             self.recipe, self.lot, self.zone, self.x, self.y, \
             self.state, self.ready_time, self.req_time, self.end_time, \
             self.complete_time, self.last_access_time, \
             self.model_id, self.label, self.score, self.result)

class DBHistory():
    def __init__(self):
        self.TableName = ''
        self.engine = create_engine(SQLALCHEMY_DATABASE_URI, echo = False)
        Session = sessionmaker(bind=self.engine)
        self.session = Session()
        self.metadata = MetaData(self.engine)
        #if not self.engine.has_table(ImageInfo.__tablename__):
        #    print('Create ImageInfo Table')
        #    ImageInfo.__table__.create(self.engine)

    def Read(self, uuid):
        # tmp1 = RevDict.diffTime()
        uuid = uuid.strip()
        if (uuid == ''):
            return 'Fail', {}

        dict = self.session.query(ImageInfo)
        dict = dict.filter(ImageInfo.id == uuid)
        dict = dict.order_by(ImageInfo.last_access_time.desc()).all()

        result = {}
        if (len(dict) > 0):
            id, result = self.__Raw2Data__(dict[0].__dict__, '')
            result = { id: result }
        # tmp2 = RevDict.diffTime(tmp1)
        # RevDict.timeList('Read',tmp2)
        return '', result

    def Search(self, client_id, start_date, end_date, recipe, lot, name, state, label):
        # tmp1 = RevDict.diffTime()
        find = False

        # tmp1 = RevDict.diffTime()
        dict = self.session.query(ImageInfo)
        if (client_id != ''):
            dict = dict.filter(ImageInfo.client_id == client_id)
            find = True
        if (recipe != ''):
            dict = dict.filter(ImageInfo.recipe.like("%"+recipe+"%"))
            find = True
        if (lot != ''):
            dict = dict.filter(ImageInfo.lot.like("%"+lot+"%"))
            find = True
        if (name != ''):
            dict = dict.filter(ImageInfo.name.like("%"+name+"%"))
            find = True
        if (start_date != '') and (end_date != ''):
            dict = dict.filter(self.__filterDate__(start_date, end_date))
            find = True
        if (label != ''):
            dict = dict.filter(ImageInfo.label == label)
            find = True
        if (state != ''):
            skey = -1
            if (state == 'ready'):
                skey = StateType.ready
            elif (state == 'request'):
                skey = StateType.request
            elif (state == 'insp_end'):
                skey = StateType.insp_end
            elif (state == 'complete'):
                skey = StateType.complete
            elif (state == 'error'):
                skey = StateType.error
            if (skey != -1):
                dict = dict.filter(ImageInfo.state == skey)
                find = True

        dict = dict.order_by(ImageInfo.last_access_time.desc())
        dict = dict.limit(100)
        # tmp2 = RevDict.diffTime(tmp1)
        # RevDict.timeList('filter',tmp2)

        result = {}
        msg = ''
        #if find:
        dict = dict.all()
        for index in range(len(dict)):
            id, data = self.__Raw2Data__(dict[index].__dict__, '')
            result[id] = data
        msg = ''
        # tmp2 = RevDict.diffTime(tmp1)
        # RevDict.timeList('Search',tmp2)
        return msg, result

    def __filterDate__(self, start, end):
        qSt = datetime.datetime.strptime(start, '%Y%m%d%H%M%S')
        qEd = datetime.datetime.strptime(end, '%Y%m%d%H%M%S')
        result = and_( ImageInfo.last_access_time >= qSt, ImageInfo.last_access_time < qEd )
        # print(qSt, qEd, result)
        return result

    def __Raw2Data__(self, data, fileKey='process'):
        # tmp1 = RevDict.diffTime()
        result = data
        id = result['id']
        result.pop('_sa_instance_state', None)
        result.pop('id', None)
        
        if (result['ready_time'] != None):
            result['ready_time'] = result['ready_time'].isoformat()
        if (result['req_time'] != None):
            result['req_time'] = result['req_time'].isoformat()
        if (result['end_time'] != None):
            result['end_time'] = result['end_time'].isoformat()
        if (result['complete_time'] != None):
            result['complete_time'] = result['complete_time'].isoformat()
        if (result['last_access_time'] != None):
            result['last_access_time'] = result['last_access_time'].isoformat()

        if result['state'] == StateType.ready:
            result['state'] = 'ready'
        elif result['state'] == StateType.request:
            result['state'] = 'request'
        elif result['state'] == StateType.insp_end:
            result['state'] = 'insp_end'
        elif result['state'] == StateType.complete:
            result['state'] = 'complete'
        elif result['state'] == StateType.error:
            result['state'] = 'error'
        # tmp2 = RevDict.diffTime(tmp1)
        # RevDict.timeList('value', tmp2)
        return id, result

    def Close(self):
        self.session.close()
        self.engine.dispose()



if __name__ == "__main__":
    #d = k.__dict__
    #d.pop('_sa_instance_state', None)
    #print(d)
    d = DBHistory()
    # d.Read('224174443EFB11EDBF5304D9F581C73B')

    r = d.Search('21370B5A3AED11ED88A204D9F581C73B', '', '', 'LT_TOP', '', '', '')
    print(r)


