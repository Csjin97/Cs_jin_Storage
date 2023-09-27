class ServerIf {
    constructor() {

    }

    GetFileExt(filename) {
        var tmp = filename.split('.');
        if (tmp.length > 1)
            return tmp[tmp.length - 1].toLowerCase();
        else
            return filename;
    }

    // Post Method
    Create(url, json_formdata) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("POST", '/' + url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function() {
                // Complete
                if (this.readyState == 4) {
                    console.log('Create', url, this.readyState, this.status );
                    if (this.status == 200) {
                        // console.log(JSON.(this.responseText));
                        resolve(JSON.parse(this.responseText));
                    } else {
                        reject(this.status);
                    }
                }
            }
            xhr.send(JSON.stringify(json_formdata));
        });
    }

    // Get Method
    Read(url, json_formdata=null) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            var url2 = '/' + url;
            if (json_formdata != null) {
                console.log('Read', json_formdata);
                url2 += '?';
                var keys = Object.keys(json_formdata);
                for(var i=0; i<keys.length; ++i) {
                    var key = keys[i];
                    //console.log(key, json_formdata[key]);
                    if (i > 0)
                        url2 += '&';
                    url2 += key + '=' + json_formdata[key];
                }
            }
            console.log(url2);
            xhr.open("GET", url2, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function() {
                // Complete
                if (this.readyState == 4) {
                    //console.log('Read', url, this.readyState, this.status );
                    if (this.status == 200) {
                        //console.log(this.responseText);
                        resolve(JSON.parse(this.responseText));
                    } else {
                        reject(this.status);
                    }
                }
            }
            xhr.send();
        });
    }

    // Put Method
    Update(url, json_formdata) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("PUT", '/' + url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function() {
                // Complete
                if (this.readyState == 4) {
                    console.log('Update', url, this.readyState, this.status );
                    if (this.status == 200)
                        resolve(JSON.parse(this.responseText));
                    else {
                        reject(this.status);
                    }
                }
            }
            xhr.send(JSON.stringify(json_formdata));
        });
    }

    // Delete Method
    Delete(url, json_formdata) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open("DELETE", '/' + url, true);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onreadystatechange = function() {
                // Complete
                if (this.readyState == 4) {
                    // console.log('Delete', url, this.readyState, this.status );
                    if (this.status == 200)
                        resolve(JSON.parse(this.responseText));
                    else {
                        reject();
                    }
                }
            }
            xhr.send(JSON.stringify(json_formdata));
        });
    }

    ResponseAlert(code) {
        if (code == 401) {
            alert('아이디 또는 암호가 맞지 않습니다.');
        } else if (code == 502) {
            alert('서버가 응답하지 않습니다.');
        }
    }
}