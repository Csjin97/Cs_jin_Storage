/*************************************************************
  log.js    : Manage Policy
    Parameter:  files (File Object)
                Approver ID
                comment
*************************************************************/
var _log = null;

class CLog extends ServerIf {
    constructor () {
        super();
        _log = this;
    }

    GetList(json_data) {
        var self = this;
        // console.log('Get Log List', json_data)
        return new Promise(function(resolve, reject) {
            self.Read('log', json_data)
            .then( (result) => {
                resolve(result);
            }).catch( (result) => {
                reject(result);
            });
        });
    }

    ShowList(tblname, data, keyword='') {
        var tblId = '#' + tblname + ' tbody'
        var currentDate = '';
        var logList = data;
        $(tblId).empty();

        var lenKeyword = keyword.length;
        $.each(logList, function(dtkey, itemList) {
            if (currentDate != dtkey) {
                var tag = `<tr class="header" onclick="CollapseRows(this);">
                            <td class="list_date" colspan="3" >&nbsp;${dtkey}`;
                if (itemList.length > 0) {
                    if ( (itemList[0][0] == '-1') || (itemList[itemList.length - 1][0] == '-1') )
                        tag += ` (${itemList.length-1}건, 로그가 너무 많음`;
                    else
                        tag += ` (${itemList.length}건`;
                    tag += `)`;
                } else {
                    tag += ` (0건)`;
                }
                $(tblId).append( tag + `</td></tr>`);
                currentDate = dtkey
            }
            $.each(itemList, function(index, item) {
                var co = '';
                /*
                if (item[1] == 'debug')
                    co = 'info';
                else if (item[1] == 'error')
                    co = 'danger';
                else if (item[1] == 'warning')
                    co = 'warning';
                */
                var tag = `<tr class="${co}" style="display:none">
                            <td class="list_time">${item[0]}</td>
                            <td title="${item[1]}" class="icon bi log_${item[1]}"></td>`;
                            // <td></td>`;
                // tag = tag + `<td>${item[2]}</td>`;

                var msg = item[3];
                if (lenKeyword > 0) {
                    //대소문자 구분x
                    //var idx = msg.toLowerCase().indexOf(keyword);
                    //대소문자 구분o
                    var idx = msg.indexOf(keyword);
                    msg = msg.slice(0, idx + lenKeyword) + '</b>' + msg.slice(idx + lenKeyword);
                    msg = msg.slice(0, idx) + '<b style="color:red">' + msg.slice(idx);
                }

                tag = tag + `<td style="text-align:left;">${msg}</td>`;
                $(tblId).append(tag + '</tr>')
            });
        });
        $('#searchLog').prop("disabled",false);
    }
}
