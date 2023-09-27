/*************************************************************
  system.js    : Show System Resource
*************************************************************/
var _basemodel = null;

class CBaseModel extends ServerIf {
    constructor () {
        super();
        _basemodel = this;
    }

    Upload(file) {
        var self = this;
        // console.log('Upload', file);
        return new Promise(function(resolve, reject) {
            var data = new FormData();
            var request = new XMLHttpRequest();
            // Set the response type
            request.responseType = "json";
            // Append the file to the FormData instance
            data.append("file", file);

            // request load handler (transfer complete)
            request.onload = function() {
                // console.log('onload', file.name)
                if ((request.readyState == 4) && (request.status == 200)) {
                    console.log('Upload', request.response);
                    if (request.response.success) {
                        resolve(request.response.data);
                    } else {
                        reject();
                    }
                }
                else {
                    console.log('Upload Fail', request.readyState, request.status, request.response);
                    reject();
                }
            };
            // request error handler
            request.addEventListener("error", function (e) {
                console.log('Upload Error', e)
                reject();
            });
            // request abort handler
            request.addEventListener("abort", function (e) {
                console.log('Upload Abort', e)
                reject();
            });
            // Open and send the request
            request.open("post", '/basemodel');
            request.send(data);
        });

    }
//현재 name: uuid 사용 차후 uuid:uuid 
Get(base_model_id) {
    var self = this;
    return new Promise(function(resolve, reject) {
        _basemodel.Read('basemodel', {'work': 'basemodel','uuid': base_model_id}, false)
        .then( (result ) => {
            resolve(result);
        }).catch( (result) => {
            reject(result);
        });
    });
}


    Add(base_model_id, base_model_name, options, pre_process, post_process, desc, BaseModelList) {
        var data = {
            'uuid': base_model_id,
            'name': base_model_name,
            'options': options,
            'ppconfig':{
                'pre_process': pre_process,
                'post_process': post_process,
            },
            'desc': desc
        };
        console.log('Base Model Add', data);
        // not used Add, must use Update
        _basemodel.Update('basemodel', data)
            .then( (result) => {
                BaseModelList();
            }).catch( (result) => {
                if (result == 401) {
                }
            });
    }

    Modify(base_model_id, base_model_name, options, pre_process, post_process, desc) {
        var data = {
            'uuid': base_model_id,
            'name': base_model_name,
            'options': options,
            'ppconfig':{
                'pre_process': pre_process,
                'post_process': post_process,
            },
            'desc': desc
        };
        _basemodel.Update('basemodel', data)
        .then( (result) => {
        }).catch( (result) => {
            if (result == 401) {
            }
        });
    }

    Remove(uuid,BaseModelList) {
        var data = {
            'uuid': uuid
        };
        _basemodel.Delete('basemodel', data)
        .then( (result) => {
            BaseModelList();
        }).catch( (result) => {
            if (result == 401) {
            }
        });
    }
}