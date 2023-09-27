import json
import grpc
import uuid, os
from typing import AsyncIterable
import RPC.himsai_pb2 as himsai
import RPC.himsai_pb2_grpc as himsai_grpc

max_msg_size = 4000000 #4194304, for storage transmit

class BaseModelUploader(object):
    def __init__(self):
        self.load_config(config_file='/opt/hims/ml-websvc/etc/ImgRequest_config.json')
        
    def load_config(self, config_file):
        with open(config_file, 'r') as cfg:
            self.config = json.load(cfg)
            #print('init : ' + config_file)

    def get_iterable(self, model_path, id)->AsyncIterable[himsai.ProfileFile]:
        data = bytearray(b'')
        with open(model_path, 'rb') as f:
            data = f.read()
            #print('data',str(data))
        for i in range(0, len(data), max_msg_size):
            idx = i + max_msg_size
            #print('idx',str(idx))
            if idx > len(data):
                idx = len(data)
            _data = data[i:idx]
            yield himsai.ProfileFile(profile_id=id, data=bytes(_data))

    def send_model_to_storage(self, model_path, model_id):
        if not os.path.exists(model_path):
            print('not found model path : ' + model_path)
            return False
        
        try:
            storage_ch = grpc.insecure_channel(self.config['storage_service_address'])
            storage_stub = himsai_grpc.StorageStub(storage_ch)
            
            if model_id == '':
                model_id = uuid.uuid1().hex.upper()
            
            prof_iter = self.get_iterable(model_path=model_path, id=model_id)
            pFuture = storage_stub.CreateProfile.future(prof_iter)
            res = pFuture.result()
            #print('res: ' + str(res))
        except Exception as e:
            print('Error occured :', str(e))
            return False
        
        return True