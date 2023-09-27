/*************************************************************
  system.js    : Show System Resource
*************************************************************/
var _rule = null;

class CRule extends ServerIf {
    constructor () {
        super();
        _rule = this;
    }

//modellist
    GetRuleModelList() {
        // 정상  동작  (2022.11.17)
        var self = this;
        return new Promise(function(resolve, reject) {
            _rule.Read('rule', {'work': 'model'}, false)
            .then( (result ) => {
                resolve(result);
            }).catch( (result) => {
                reject(result);
            });
        });
    }

//rule

Get(client_name) {
    var self = this;
    return new Promise(function(resolve, reject) {
        _rule.Read('rule', {'work': 'rule', 'client': client_name}, false)
        .then( (result ) => {
            resolve(result);
        }).catch( (result) => {
            reject(result);
        });
    });
}

    Add(client_name, model_name, threshold, recipe, filename,rule_get) {
        // recipe = [ type, key, index ], lot = [ type, key, index ], filename = [ type, key, index ]
        var data = {
            'work': 'rule',
            'client_name': client_name,
            'model_name': model_name,
            'threshold': threshold,
            'recipe': recipe,
            'filename': filename
        };
        _rule.Create('rule', data)
            .then( (result) => {
                rule_get();
            }).catch( (result) => {
                if (result == 401) {
                }
            });
    }

    Modify(client_name, model_name, threshold, recipe, filename,rule_key, rule_get) {
        // recipe = [ type, key, index ], filename = [ type, key, index ]
        var data = {
            'work': 'rule',
            'client_name': client_name,
            'model_name': model_name,
            'threshold': threshold,
            'recipe': recipe,
            'filename': filename,
            'rule_key': rule_key
        };
        _rule.Update('rule', data)
        .then( (result) => {
            rule_get();
        }).catch( (result) => {
            if (result == 401) {
            }
        });
    }

    Remove(client_name, rule_key, rule_get) {
        var data = {
            'work': 'rule',
            'client_name': client_name,
            'rule_key': rule_key
        };
        _rule.Delete('rule', data)
        .then( (result) => {
            rule_get();
        }).catch( (result) => {
            if (result == 401) {
            }
        });
    }
}