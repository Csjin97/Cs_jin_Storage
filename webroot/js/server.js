/*************************************************************
  system.js    : Show System Resource
*************************************************************/
var _server = null;
var interval = 1000;
var _callback_logout = null;
var _callback_list = null;
var _serverip = '-';

class CServer extends ServerIf {
    constructor () {
        super();
        _server = this;
        _server.totalPoints = 600; // 5 minutes
        _server.DrawInitial();
    }

    // Start Process. Get System Data
    Start(cb_logout, cb_list) {
        console.log('Start System Resource');
        _callback_logout = cb_logout;
        _callback_list = cb_list;
        _server.GetData(this);
    }

    Get(ip) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self.Read('server', {'ip': ip}, false)
            .then( (result ) => {
                resolve(result);
            }).catch( (result) => {
                reject(result);
            });
        });
    }

    Add(ip, name, isClient, ismlSvc, ismlEng, isStorage) {
        console.log('Add Server', name, ip, isClient, ismlSvc, ismlEng, isStorage);
        var data = {
            'ip': ip,
            'name': name,
            'isClient': isClient,
            'ismlSvc': ismlSvc,
            'ismlEng': ismlEng,
            'isStorage': isStorage
        };
        _server.Create('server', data)
            .then( (result) => {

            }).catch( (result) => {
                if (result == 401) {
                }
            });
    }
    Modify(ip, name, isClient, ismlSvc, ismlEng, isStorage) {
        console.log('Modify Server', name, ip, isClient, ismlSvc, ismlEng, isStorage);
        var data = {
            'ip': ip,
            'name': name,
            'isClient': isClient,
            'ismlSvc': ismlSvc,
            'ismlEng': ismlEng,
            'isStorage': isStorage
        };
        _server.Update('server', data)
        .then( (result) => {

        }).catch( (result) => {
            if (result == 401) {
            }
        });
    }
    Remove(ip) {
        console.log('Remove Server', ip);
        var data = { 'ip': ip }
        _server.Delete('server', data)
        .then( (result) => {

        }).catch( (result) => {
            if (result == 401) {
            }
        });
    }

    // Current Select Server IP
    Select(ip) {
        _serverip = ip;
    }

    GetData(test = 0) {
        if ($('#pnlServer').css('display') == 'none') {
            setTimeout(_server.GetData, 500); // 대기 상태에서는 빨리 실행한다.
        } else {
            _server.Get(_serverip)
            .then( (result) => {
                // Update Server List
                if (_callback_list != null) {
                    _callback_list(result['data']);
                }
                if (_serverip != '-'){
                    _server.DrawGraph(result['data']['history']);
                }
                else{
                    setTimeout(_server.GetData, interval);
                }
            }).catch( (result) => {
                if (result == 401) {
                    if (_callback_logout != null)
                        _callback_logout();
                }
                var dummy = _server.CreateDummyGraph()
                _server.DrawGraph(dummy);
                
            });
        }
    }
    CreateDummyGraph() {
        var result = {
            'cpu': [],
            'mem': [],
            'disk': [],
            'net': [],
            'send': [],
            'recv': []
        };
        var date = Date.now();
        for(var i = 0; i <  _server.totalPoints; ++i) {
            var d = date - ( _server.totalPoints-i) * 1000; // date.setMilliseconds(date.getMilliseconds() - (totalPoints-i) * updateInterval);
            result["cpu"].push([d, 0]);
            result["mem"].push([d, 0]);
            result["disk"].push([d, 0]);
            result["net"].push([d, 0]);
            result["send"].push([d, 0]);
            result["recv"].push([d, 0]);
        }
        return result;
    }
    DrawInitial() {
        _server.options = {
            series: { curvedLines: { active: true } },
            legend: {
                show: true,
                position: "ne"
            },
            yaxis: {
                min: 0,
                max: 100.01,
                autoScale: "none",
                font: {
                    size: 12
                }
            },
            xaxis: {
                mode: "time",
                minTickSize: [30, "second"],
                //min: (new Date(2022, 3, 1)).getTime(),
                //max: (new Date(2022, 3, 3)).getTime(),
                twelveHourClock: false,
                timezone: "browser",
                timeBase: "milliseconds",
                font: {
                    size: 12
                }
            },
            xaxes: [
                {
                    position: 'bottom',
                    axisLabel: '',
                    show: true,
                    // showTickLabels: 'none',
                    showTicks: true,
                    gridLines: true
                },
                {
                    position: 'top',
                    axisLabel: 'Server',
                    show: true,
                    showTickLabels: 'none',
                    showTicks: false,
                    gridLines: false
                }
            ]
        };
    }
    DrawGraph(sysdata) {
        console.log(sysdata);
        _server.options.xaxes[1].axisLabel = 'Server (' + _serverip + ')';
        var datasets = [
            {
                label : "CPU",
                data: sysdata["cpu"],
                color: "blue",
                lines: {show: true},
                curvedLines: {apply: true}
            },
            {
                label : "Memory",
                data: sysdata["mem"],
                color: "red",
                lines: {show: true},
                curvedLines: {apply: true}
            },
            {
                label : "Disk",
                data: sysdata["disk"],
                color: "green",
                lines: {show: true},
                curvedLines: {apply: true}
            },
            {
                label : "Network",
                data: sysdata["net"],
                color: "orange",
                lines: {show: true},
                curvedLines: {apply: true}
            },
            {
                label : "Send",
                data: sysdata["send"],
                color: "red",
                lines: {show: true},
                curvedLines: {apply: true}
            },
            {
                label : "Receive",
                data: sysdata["recv"],
                color: "violet",
                lines: {show: true},
                curvedLines: {apply: true}
            }
        ];
        // console.log(datasets[0].data)
        var outputdata = [];
        //if (IsEnable("cpu"))
            outputdata.push(datasets[0]);
        //if (IsEnable("mem"))
            outputdata.push(datasets[1]);
        //if (IsEnable("disk"))
            outputdata.push(datasets[2]);
        //if (IsEnable("net"))
            outputdata.push(datasets[3]);
        $.plot("#systemplot", outputdata, _server.options);

        //$.plot("#systemplot",  [ datasets[0] ], _server.options);

        //$.plot("#systemplot0", [ datasets[0] ], _server.options);
        //$.plot("#systemplot1", [ datasets[1] ], _server.options);
        //$.plot("#systemplot2", [ datasets[2] ], _server.options);
        //$.plot("#systemplot3", [ datasets[3] ], _server.options);
        // $.plot("#systemplot4", [ datasets[4] ], _server.options);
        // $.plot("#systemplot5", [ datasets[5] ], _server.options);

        setTimeout(_server.GetData, interval);
    }
}
