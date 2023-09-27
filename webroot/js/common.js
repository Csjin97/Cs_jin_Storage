/////////////////////////////////////////
///   Button Enable / Disable
function ToggleEnableButton(id) {
    if (IsEnable(id)) {
        console.log(id, 'disable');
        $('#' + id).css('color', "gray");
        $('#' + id + ' span').css('color', "gray");
        $('#' + id + ' img').css('fill', "gray");
    } else {
        console.log(id, 'enable');
        $('#' + id).css('color', "black");
        $('#' + id + ' span').css('color', "black");
        $('#' + id + ' img').css('fill', "black");
    }
}
function IsEnable(key) {
    // console.log('IsEnable', key);
    var element = document.getElementById(key);
    return element.style.color == "black";
}
///   Button Enable / Disable
/////////////////////////////////////////

/////////////////////////////////////////
///   Select Button : Multiple button
function SelectButton(sender, callback=null) {
    // Find sender parent group
    var parent = $(sender).parent(); // button group
    var children = parent.children(); // buttons
    for(idx = 0; idx < children.length; ++idx) {
        $(children[idx]).removeClass('btn-default btn-primary');
        $(children[idx]).addClass('btn-default');
    }
    $(sender).removeClass('btn-default');
    $(sender).addClass('btn-primary');
    if (callback != null)
        callback(sender);
}
///   Select Button : Multiple button
/////////////////////////////////////////


/////////////////////////////////////////
///   Toggle Button : Switch
function ToggleButton(sender) {
    $(sender).find('.btn').toggleClass('active');  
    
    if ($(sender).find('.btn-primary').size()>0) {
        $(sender).find('.btn').toggleClass('btn-primary');
    }
    if ($(sender).find('.btn-danger').size()>0) {
        $(sender).find('.btn').toggleClass('btn-danger');
    }
    if ($(sender).find('.btn-success').size()>0) {
        $(sender).find('.btn').toggleClass('btn-success');
    }
    if ($(sender).find('.btn-info').size()>0) {
        $(sender).find('.btn').toggleClass('btn-info');
    }
    $(sender).find('.btn').toggleClass('btn-default');
}

function ToggleButtonState(id) {
    var btns = $(id).children()
    return $(btns[0]).hasClass('active');
}

function ToggleButtonSet(id, isBool) {
    var btns = $(id).children()
    $(btns[0]).removeClass('active btn-default btn-primary');
    $(btns[1]).removeClass('active btn-default btn-primary');

    if (isBool) {
        $(btns[0]).addClass('active btn-primary');
        $(btns[1]).addClass('btn-default');
    } else {
        $(btns[1]).addClass('active btn-primary');
        $(btns[0]).addClass('btn-default');
    }
}
///   Toggle Button : Switch
/////////////////////////////////////////


function LoadHTML() {
    return new Promise(function(resolve, reject) {
        var elem = $('#workpanel').find('div'); // .attr('w3-include-html');
        var chain = Promise.resolve();
        $.each(elem, function(index, item) {
            var file = $(item).attr('w3-include-html');
            if (file) {
                chain = chain.then( () => {
                    return new Promise(function(resolve, reject) {
                        var xhttp = new XMLHttpRequest();
                        // console.log(file, item);
                        xhttp.onreadystatechange = function() {
                            if (this.readyState == 4) {
                                if (this.status == 200) {
                                    item.innerHTML = this.responseText;
                                }
                                if (this.status == 404) {
                                    item.innerHTML = "Page not found.";
                                }
                                /* Remove the attribute, and call this function once more: */
                                item.removeAttribute("w3-include-html");
                                // console.log('complete');
                                resolve();
                            }
                        }
                        xhttp.open("GET", file, true);
                        xhttp.send();
                    });
                })
            }
        });
        chain.then( () => {
            console.log('Load Complete');
            resolve();
        });
    });
}

function Logout() {
    hLogin.LogOut().then( (result) => {
        window.location.href = 'index.html';
    });
}
function LastActiveTime() {
    if (hLogin != null)
        hLogin.RefreshAutoLogout();
}
function AutoLogout(minutes, seconds) {
    if ((minutes <= 0) && (seconds <= 0))
        Logout();
    else
        $('#loginUser').text(getCookie('name') + '(' + pad(minutes,2) + ':' + pad(seconds,2) + ')');
}

Date.prototype.DateString = function() {
    var mm = this.getMonth() + 1; // getMonth() is zero-based
    var dd = this.getDate();

    return [this.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd
        ].join('.');
};
Date.prototype.TimeString = function() {
    var hh = this.getHours();
    var mm = this.getMinutes();
    var ss = this.getSeconds();

    return [(hh>9 ? '' : '0') + hh,
            (mm>9 ? '' : '0') + mm,
            (ss>9 ? '' : '0') + ss
        ].join(':');
};

/**
 * byte 용량을 환산하여 반환
 * 용량의 크기에 따라 MB, KB, byte 단위로 환산함
 * @param fileSize  byte 값
 * @param fixed     환산된 용량의 소수점 자릿수
 * @returns {String}
 */
 function byte(fileSize, fixed) {
    var str
    //MB 단위 이상일때 MB 단위로 환산
    if (fileSize >= 1024 * 1024 * 1024) {
        fileSize = fileSize / (1024 * 1024 * 1024);
        fileSize = (fixed === undefined) ? fileSize : fileSize.toFixed(fixed);
        str = String(fileSize) + ' GB';
    }
    //MB 단위 이상일때 MB 단위로 환산
    else if (fileSize >= 1024 * 1024) {
        fileSize = fileSize / (1024 * 1024);
        fileSize = (fixed === undefined) ? fileSize : fileSize.toFixed(fixed);
        str = String(fileSize) + ' MB';
    }
    //KB 단위 이상일때 KB 단위로 환산
    else if (fileSize >= 1024) {
        fileSize = fileSize / 1024;
        fileSize = (fixed === undefined) ? fileSize : fileSize.toFixed(fixed);
        str = String(fileSize) + ' KB';
    }
    //KB 단위보다 작을때 byte 단위로 환산
    else {
        fileSize = (fixed === undefined) ? fileSize : fileSize.toFixed(fixed);
        str = String(fileSize) + ' byte';
    }
    return str;
}

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

function SetBackColor(elementID, color) {
    var element = document.getElementById(elementID);
    element.style.backgroundColor=color;
}

// 다음 tr header까지 접거나 열기
function CollapseRows(sender) {
    // console.log('CollapseLog', sender);
    document.body.style.cursor = 'progress'
    setTimeout(() => {
        $(sender).nextUntil('tr.header').slideToggle( 5 ); // 100);
        document.body.style.cursor = 'default';
    }, 300);

    //console.log('Complete');
}

function HideRows(classname) {
    var elems = $('#tblFile tbody').find('.' + classname);
    $.each(elems, function(index, element) {
        //console.log(element);
        $(element).hide();
    });
}
function ShowRows(classname) {
    var elems = $('#tblFile tbody').find('.' + classname);
    $.each(elems, function(index, element) {
        //console.log(element);
        $(element).show();
    });
}

function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}