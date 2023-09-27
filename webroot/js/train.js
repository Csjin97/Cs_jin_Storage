/*************************************************************
  system.js    : Show System Resource
*************************************************************/
var _train = null;

class CTrain extends ServerIf {
    constructor () {
        super();
        _train = this;
    }

    Get(data) {
        var self = this;
        return new Promise(function(resolve, reject) {
            _train.Read('train', data, false)
            .then( (result ) => {
                resolve(result);
            }).catch( (result) => {
                reject(result);
            });
        });
    }

    Add(data) {
        _train.Create('train', data)
            .then( (result) => {
                console.log('train', result);
            }).catch( (result) => {
                if (result == 401) {
                }
            });
    }

    Modify(data) {
        _train.Update('train', data)
        .then( (result) => {

        }).catch( (result) => {
            if (result == 401) {
            }
        });
    }

    Remove(data) {
        _train.Delete('train', data)
        .then( (result) => {
        }).catch( (result) => {
            if (result == 401) {
            }
        });
    }
}