/*************************************************************
  system.js    : Show System Resource
*************************************************************/
var _model = null;

class CModel extends ServerIf {
    constructor () {
        super();
        _model = this;
    }
/*
    AddBaseModel(file) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var data = new FormData();
            var request = new XMLHttpRequest();
            // Set the response type
            request.responseType = "json";
            // Append the file to the FormData instance
            data.append("work", 'basemodel');
            data.append("file", file);

            // request load handler (transfer complete)
            request.onload = function() {
                console.log('onload', file.name)
                if ((request.readyState == 4) && (request.status == 200)) {
                    console.log('Upload', request.response);
                    if (request.response.success) {
                        resolve();
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
            request.open("post", '/model');
            request.send(data);
        });

    }
    */


Get(name) {
    var self = this;
    return new Promise(function(resolve, reject) {
        _model.Read('model', {'work': 'model','name': name}, false)
        .then( (result ) => {
            resolve(result);
        }).catch( (result) => {
            reject(result);
        });
    });
}

    // model add 
    Add(name,base_model_id, options, pre_process, post_process, desc, model_get) {
        var data = {
            'name': name,
            'uuid': base_model_id,
            'options': options,
            'ppconfig':{
                'pre_process': pre_process,
                'post_process': post_process,
            },
            'desc': desc
        };
        //console.log('model add',data);
        _model.Create('model', data)
            .then( (result) => {
                model_get();
            }).catch( (result) => {
                if (result == 401) {
                }
            });
    }
    Test_Add(data, model_get) {
        console.log('test model edit',data);
        _model.Update('model', data)
            .then( (result) => {
                model_get();
            }).catch( (result) => {
                if (result == 401) {
                }
            });
    }

    Modify(name, base_model_id,options,pre_process,post_process,desc, model_get) {
        var data = {
            'name': name,
            'uuid': base_model_id,
            'options': options,
            'ppconfig':{
                'pre_process': pre_process,
                'post_process': post_process,
            },
            'desc': desc
        };
        _model.Update('model', data)
        .then( (result) => {
            model_get();
        }).catch( (result) => {
            if (result == 401) {
            }
        });
    }
// model delete 
    Remove(name,model_get) {
        var data = {
            'name': name
        };
        _model.Delete('model', data)
        .then( (result) => {
            model_get();
        }).catch( (result) => {
            if (result == 401) {
            }
        });
    }

}
