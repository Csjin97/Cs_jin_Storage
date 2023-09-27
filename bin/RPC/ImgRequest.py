import json
import grpc
import RPC.himsai_pb2 as himsai
import RPC.himsai_pb2_grpc as himsai_grpc
import base64
import cv2
import numpy as np

## pip install grpcio
# pip install grpcio-tools (protobuf==3.19.0)


max_msg_size = 4000000 #4194304, for storage transmit

class ImgRequest():
    def __init__(self):
        self.load_config(config_file='/opt/hims/ml-websvc/etc/ImgRequest_config.json')
    def load_config(self, config_file):
        with open(config_file, 'r') as cfg:
            self.config = json.load(cfg)
    
    def get_image_from_storage(self, img_id) -> bytearray:
        storage_addr = self.config['storage_service_address']
        storage_ch = grpc.insecure_channel(storage_addr)
        storage_stub = himsai_grpc.StorageStub(storage_ch)
        
        img_data = bytearray(b'')
        for img_iter in storage_stub.GetImage(himsai.MessageString(value=img_id)):
            if img_iter.img_id != '':
                img_data.extend(img_iter.data)
        
        if len(img_data) == 0:
            print('[ERR] not found img id : ' + img_id) # err log
            encoded_string = ""
            width = None
            height = None 
        else:
            enc_img_data = np.frombuffer(img_data, dtype=np.uint8)
            mat = cv2.imdecode(enc_img_data, cv2.IMREAD_ANYCOLOR)
            
            # 이미지의 채널 수 확인
            if len(mat.shape) == 3:
                height, width, channels = mat.shape
            else:
                height, width, channels = mat.shape[0], mat.shape[1], 1
            
            encoded_string = 'data:image/png;base64,' + base64.b64encode(img_data).decode('utf-8')

        return encoded_string, width, height

# working test
'''
id = '1707e741462811ed8cfb04d9f581c73b'
bimg = ImgRequest().get_image_from_storage(img_id=id)
if len(bimg) > 0:
    with open('test.png', 'wb') as f:
        f.write(bimg)
'''