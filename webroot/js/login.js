var lastTime = Date.now();
var _callback = null;
var _login = null;
var timeout = 10;
class CLogin extends ServerIf {
    constructor() {
        super();
        _login = this;
    }
    LogIn(id, pw) {
        var self = this;
        return new Promise(function(resolve, reject) {
            var param = { 'id': id, 'pw': pw };
            self.Create('login', param)
            .then( (result ) => {
                console.log(result)
                if (result['success']) {
                    if (result['msg'] != '') {
                        window.location.href = result['msg'];
                        resolve();
                    } else
                        reject();
                }
            }).catch( ( code ) => {
                console.log('fail to login', code);
                self.ResponseAlert(code);
                reject();
            });
        });
    }
    LogOut() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.Delete('login')
            .then( (result ) => {
                console.log(result);
                resolve(result);
            }).catch( () => {
                resolve({ 'success': false });
            });
        });
    }

    IsLogin() {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.Read('login')
            .then( (result ) => {
                resolve(result);
            }).catch( (code) => {
                self.ResponseAlert(code);
                reject();
            });
        });
    }
    StartAutoLogout(callback=null) {
        _callback = callback;
        lastTime = Date.now();
        _login.CheckAutoLogout();
    }
    CheckAutoLogout() {
        // console.log('CheckAutoLogout');
        var diff = Date.now() - lastTime;
        var seconds = (60 * timeout) - Math.floor(diff / 1000);
        var minutes = Math.floor(seconds / 60);
        seconds = seconds - (minutes * 60);
        if (_callback != null)
            _callback(minutes, seconds);
        // $('#loginUser').text(getCookie('name') + '(' + pad(minutes,2) + ':' + pad(seconds,2) + ')');
        setTimeout(_login.CheckAutoLogout, 1000);
    }
    RefreshAutoLogout() {
        lastTime = Date.now();
    }
}