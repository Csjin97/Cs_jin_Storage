/*************************************************************
  system.js    : Show System Resource
*************************************************************/
var _history = null;

class CHistory extends ServerIf {
    constructor () {
        super();
        _history = this;
    } 
    GetView(juuid){
        var self = this;
        return new Promise(function(resolve, reject) {
            self.Read('history', {'work':'Read','uuid':juuid},false)
            .then( (result) => {
                resolve(result);
            }).catch( (result) => {
                reject(result);
            });
        });
    }

    //찾기
    //날짜 형식
    Get(client,state,label,start,end,rec,lot,name) {
        var self = this;
        if (!client)
            client="";
        return new Promise(function(resolve, reject) {
            self.Read('history', {'work':'Read','client_id':client,'state':state,'label':label,'start_date':start,'end_date':end,'recipe':rec,'lot':lot,'name':name}, false)
            .then( (result ) => {
                resolve(result);
            }).catch( (result) => {
                reject(result);
            });
        });
    }
}
