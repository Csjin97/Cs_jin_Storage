var lastTime = Date.now;
var hLogin = null;
var hServer = null;
var hModel = null;
var hBaseModel = null;
var hRule = null;
var hHistory = null;
var hTrain = null;

var hLog = null;

function start() {
    console.log('start');

    hLogin = new CLogin();
    var chain = Promise.resolve();

    // Check Login
    chain = chain.then( () => {
        return hLogin.IsLogin();
    });
    chain = chain.then( (result) => {
        // console.log('IsLogin', result);
        return new Promise(function(resolve, reject) {
            if (result['success']) {
                LoadHTML().then( () => {
                    resolve();
                })
            } else {
                Logout();
                reject();
            }
        });
    });

    chain.then( () => {
        // console.log('Load HTML');
        hServer = new CServer();
        hServer.Start(Logout, ServerList);
        hBaseModel= new CBaseModel();
        hModel = new CModel();
        hRule = new CRule();
        hHistory = new CHistory();
        hTrain = new CTrain();
        hLog = new CLog();
        var mode = getCookie('mode').toLowerCase();
        if (mode == 'production')
            $('#loginMode').hide();
        $('#loginUser').text(getCookie('name'));

        //로그인하면 첫 화면
        $('#Server').click();
        // $('#Model').click();

        // 바로하면 include가 안되어서 동작을 안한다.
        var dt = new Date(); // Date.now();
        var dt2 = new Date();
        dt2.setDate(dt.getDate() - 7);
        $('#dtStart').datetimepicker({
            format : "YYYY/MM/DD",
            defaultDate: dt2
        });
        $('#dtEnd').datetimepicker({
            format : "YYYY/MM/DD",
            defaultDate: dt
        });

        $('#logStart').datetimepicker({
            format : "YYYY/MM/DD HH:mm",
            defaultDate: dt2
        });
        $('#logEnd').datetimepicker({
            format : "YYYY/MM/DD HH:mm",
            defaultDate: dt
        });

        $('#historyStart').datetimepicker({
            format : "YYYY/MM/DD HH:mm",
            defaultDate: dt2
        });

        $('#historyEnd').datetimepicker({
            format : "YYYY/MM/DD HH:mm",
            defaultDate: dt
        });

        $('#img_serch_area_right_date_start').datetimepicker({
            format : "YYYY/MM/DD",
            defaultDate: dt2
        });

        $('#img_serch_area_right_date_end').datetimepicker({
            format : "YYYY/MM/DD",
            defaultDate: dt
        });
        
        try {
            hLogin.StartAutoLogout(AutoLogout);
        } catch (e) {
            console.log(e);
        }

        ServerInitial();
    });
}

/////////////////////////////////////////
// Server

// var stopSvrEvent = false;
function ServerInitial() {
    console.log('ServerInitial')
    $('#svrIP').inputmask({
        alias: "ip",
        greedy: false //The initial mask shown will be "" instead of "-____".
    });
    $('#tblServer tbody').empty();
}

function ServerProcStatus(service) {
    var result = 'process_notused';
    if (service == 0)
        result = 'process_stop';
    else if (service == 1)
        result = 'process_run';
    return result;
}
function ServerDownStatus(service){
    var result = 'process_notused';
    if (service == 'process_run')
        result = 'process_stop';
    else if (service == 'process_stop')
        result = 'process_stop';
    return result;
}

var dictionary = {};
function ServerList(data) {
    // client_dropdown-menu 
    // client_drop = data;
    // Add or Update Server

    var currentIP = [];
    for (key in data) {
        if (key != 'history') {

            var item = data[key];
            //key = ip, item = data 이전과 동일 할 경우 패스
            var ip = item['ip'].replace(/\./gi, '_');
            //server
            var prc_client = ServerProcStatus(item['isClient']);
            var prc_mvsvc = ServerProcStatus(item['ismlSvc']);
            var prc_mleng = ServerProcStatus(item['ismlEng']);
            var prc_storage = ServerProcStatus(item['isStorage']);
            // hw
            var cpu = item['cpu'];
            var mem = item['mem'];
            var disk = item['disk'];
            var net = item['net'];

            currentIP.push(ip);
            var tr = $('#tblServer tbody #' + ip);
            if (tr.length == 0) {
                // Append Server
                // 원본 <td onclick="ServerSelect();"><input type="radio" name="serverip" value="${item['ip']}" onclick="ServerSelect();"></td>
                $('#tblServer > tbody').append(
                    `<tr id="${ip}" onclick="ServerView(this);">
                        <td onclick="event.cancelBubble=true"><input type="radio" name="serverip" value="${item['ip']}" onclick="ServerSelect();"></td>
                        <td>${item['name']}</td>
                        <td>${item['ip']}</td>
                        <td class="${prc_client}"></td>
                        <td class="${prc_mvsvc}"></td>
                        <td class="${prc_mleng}"></td>
                        <td class="${prc_storage}"></td>
                        <td>${cpu}</td>
                        <td>${mem}</td>
                        <td>${disk}</td>
                        <td>${net}</td>
                    </tr>`
                );
            } else {
                // Update Server
                var isEqual = true;
                for (var prop in item) {
                    if (item[prop] !== dictionary[key][prop]) {
                        isEqual = false;
                        break;
                    }
                }
                if (isEqual) {
                    //console.log("값이 같습니다:", item);
                    var cllist = [ServerDownStatus(prc_client), ServerDownStatus(prc_mvsvc), ServerDownStatus(prc_mleng),ServerDownStatus(prc_storage)];
                    cpu = 0;
                    mem = 0;
                    disk = 0;
                    net = 0;
                } else {
                    //console.log("값이 다릅니다:", item, dictionary[key]);
                    var cllist = [prc_client, prc_mvsvc, prc_mleng, prc_storage];
                }
                // update
                var tdlist = $(tr).children('td');
                // 
                $(tdlist[1]).text(item['name']);
                for(i=0; i<4; ++i) {
                    if ($(tdlist[i+3]).attr('class') != cllist[i]) {
                        $(tdlist[i+3]).removeClass();
                        $(tdlist[i+3]).addClass(cllist[i]);
                    }
                }
                $(tdlist[7]).text(cpu);
                $(tdlist[8]).text(mem);
                $(tdlist[9]).text(disk);
                $(tdlist[10]).text(net);
            }
        }
    //test
    dictionary[key] = item;
    }
    // Remove Not Used IP
    var tmp = $('#tblServer tbody').children('tr');
    var count = tmp.length;
    for(i = 0; i < count; ++i) {
        var id = $(tmp[i]).attr('id');
        if (currentIP.indexOf(id) < 0) {
            $(tmp[i]).remove();
        }
    }
    
    // Default Graph Object
    if ($("input:radio[name='serverip']:checked").val() === undefined ) {
        $("input:radio[name='serverip']:first").attr('checked', true);
        ServerSelect();
    }
}

function ServerView(row) {
    // if (stopSvrEvent) {
    //     stopSvrEvent = false;
    //     return;
    // }

    console.log('ServerView');
    if (row == '') {
        $('#svrAdd').show();
        $('#svrUpdate').hide();
        $('#svrDelete').hide();
        $('#mdServer .modal-title').text("Add Server");
        $('#svrIP').attr('readonly', false);
        $('#svrIP').val('');
        $('#svrName').val(''),
        $('#chkClient').prop('checked', false);
        $('#chkmlSvc').prop('checked', false);
        $('#chkmlEng').prop('checked', false);
        $('#chkStorage').prop('checked', false);
    } else {
        var tdlist = $(row).children('td');
        $('#svrAdd').hide();
        $('#svrUpdate').show();
        $('#svrDelete').show();
        $('#mdServer .modal-title').text("Edit Server");
        $('#svrIP').attr('readonly', true);
        $('#svrIP').val($(tdlist[2]).text());
        $('#svrName').val($(tdlist[1]).text()),
        $('#chkClient').prop('checked', !$(tdlist[3]).hasClass('process_notused'));
        $('#chkmlSvc').prop('checked', !$(tdlist[4]).hasClass('process_notused'));
        $('#chkmlEng').prop('checked', !$(tdlist[5]).hasClass('process_notused'));
        $('#chkStorage').prop('checked', !$(tdlist[6]).hasClass('process_notused'));
    }
    $('#mdServer').modal();
}

function ServerAdd() {
    if($('#svrIP').val() == undefined || $('#svrIP').val() == null || $('#svrIP').val() == ''){
        alert("IP 입력란을 확인해주세요");
        $('#svrIP').focus();
        return false;
    }

    hServer.Add(
        $('#svrIP').val(),
        $('#svrName').val(),
        $('#chkClient').is(':checked'),
        $('#chkmlSvc').is(':checked'),
        $('#chkmlEng').is(':checked'),
        $('#chkStorage').is(':checked')
    );

    $('#mdServer').modal('hide');
}

function ServerUpdate() {
    hServer.Modify(
        $('#svrIP').val(),
        $('#svrName').val(),
        $('#chkClient').is(':checked'),
        $('#chkmlSvc').is(':checked'),
        $('#chkmlEng').is(':checked'),
        $('#chkStorage').is(':checked')
    );
}

function ServerDelete() {
    hServer.Remove( $('#svrIP').val() );
}

function ServerSelect() {
    console.log('ServerSelect');
    var serverip = $("input:radio[name='serverip']:checked").val();
    hServer.Select(serverip);
    // stopSvrEvent = true;
}
// Server
/////////////////////////////////////////

/////////////////////////////////////////
// Model
var BaseModel = {};
// 공통 옵션 ,전처리, 후처리 목록
var keysOption = ['Common', 'Crop_And_Resize'];
var keysPreProcess = ['Noise_Remove', 'Mask_Dot_Splitter', 'Mask_Dot_Splitter2_Rotated_Dot'];
var keysPostProcess = ['Find_Black_Dot', 'Is_Dark', 'Vertex_Crack', 'Pass_Dot'];

function ModelInitial(){
    console.log('Model Initial');

// Model,BaseModel list
    BaseModelList();
    ModelList();

    $('.underline').inputmask("numeric", {
        placeholder: ' ',
        showMaskOnFocus: false,
        showMaskOnHover: false,
        autoGroup: true,
        digits: 2,
        repeat: 12,
    });
    $('.textline').inputmask("a{1,5}",{
        placeholder: ' ',
        showMaskOnFocus: false,
        showMaskOnHover: false,
    });
}

function BaseModelList(){
    hBaseModel.Get('').then( (result) => {
        $("#cboBaseModel").children().remove();
        if(result['success']) {
            BaseModel = result['data'];
            var key = Object.keys(BaseModel);
            for(i= 0; i< key.length; ++i){
                var baseModelkey = key[i];
                var items = BaseModel[baseModelkey];
                $("#cboBaseModel").append(`<option value="${baseModelkey}">${items}</option>`);
            }
        }
    });
}

// 모델 페이지 클릭 시 모델 테이블 생성
function ModelList() {
    hModel.Get('').then( (result) => {
        $('#tblModel tbody').empty();
        if(result['success']) {
            var data = result['data'];
            var key = Object.keys(data);
            for(i = 0; i < key.length; ++i) {
                var keys = key[i];
                var items = data[keys];
                //console.log(items);
                let baseName = (BaseModel[items['uuid']]);
                optlist = table_opt_item_text(items['options']);
                prelist = table_opt_item_text(items['pre_process']);
                postlist = table_opt_item_text(items['post_process']);
                $('#tblModel tbody').append(
                    `<tr id=${keys} onclick="ModelView(this);">
                    <td>${items['name']}</td>
                    <td>${baseName}</td>
                    <td style="text-align:left;">${optlist}</td>
                    <td style="text-align:left;">${prelist}</td>
                    <td style="text-align:left;">${postlist}</td>
                    <td style="text-align:left;">${items['desc']}</td>
                    </tr>`
                )
            }
        }
    });
}

// Options, Pre, Post-Processing 사용하는 목록 테이블에 맞게 변형
function table_opt_item_text(item) {
    items = Object.keys(item);
    //console.log(items);
    item_text = "";
    for (let i = 0; i < items.length; i++) {
        // 밑줄로 문자열을 나누고 각 단어의 첫 글자를 대문자로 변환
        let words = items[i].split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1));
        //test
        if(items[i] == "model"){
            continue;
        }
        else{
            item_text += words.join(' '); // 변환된 단어들을 공백으로 연결
            if (i !== items.length - 1)
                item_text += "/";
            }           
    }
    // console.log(item_text);
    return item_text;
}

// 값 유무 확인, 이전에 사용 
function tableList(item){
    let keyList='';
    var test = Object.keys(item);
    for(let i= 0; i<test.length; ++i){
        // 알고리즘 목록
        var items = (item[test[i]]);
        var key= Object.keys(items);
        //내용물 값 확인
        var keys = false;
        for(let j=0; j<key.length; ++j){
            //console.log(i,items[key[i]]);
            var valueTF = items[key[j]];
            //ture 값 o false 값 x
            keys =  keys || ((valueTF !== '')&& (valueTF !== 0) && (valueTF !== undefined)&& (valueTF !== null));
        }
        if(keys == true){
            //keys 횟수 1번인 경우 / 제외 
                keyList += test[i]+'/';
        }
    }
    keyList = keyList.replace(/\/$/,'');
    if(keyList===''){
        keyList='-';
    }
    return keyList
}

/////////////////////////////////////////
var modalFilter;
function ModelView(row){
    console.log('ModelView');
    //초기화
    var butShowHide  = document.getElementsByName('butShowHide');
    $(butShowHide).hide();
    var butShowHide  = document.getElementsByName('group');
    $(butShowHide).hide();
    $('#model_md').find("input, button, label, select ").prop('disabled',false);
    modalReset();
    $('#modeldesc').val('');
    $('#mdlName').val('');
    $('#mdljson_edit').hide();
    if (row == 'add') {
        $('#mdModel .modal-title').text("Add Model");
        $('#mdlAdd').show();
        $('#model_md_name_area').show();
        $('#model_md_basemodel_description').show();
        $('#model_md_basemodel_area').show();
        $('#model_md_description_area').show();

        $('#cboBaseModel').val($('#cboBaseModel').find("option:first-child").val()).change();
        $('#mdlName').attr('disabled', false);
    }
    //BaseModel Add Modal
    else if(row=='baseAdd'){
        // document.getElementById("model_modal_body").style.height = "704px";
        $('#mdModel .modal-title').text("Add Base Model");
        $('#BasemdlAdd').show();
        $('#uploadfile').val('');
        $('#model_md_upload_area').show();
        $('#model_md_description_area').show();
        $('#modeldesc').val('');
    }

    //BaseModel Delete Modal
    else if(row=='baseDelete'){
        // document.getElementById("model_modal_body").style.height = "704px";
        $('#mdModel .modal-title').text("Delete Base Model");
        $('#BasemdlDelete').show();
        $('#model_md_basemodel_area').show();
        $('#cboBaseModel').val($('#cboBaseModel').find("option:first-child").val()).change();
        $('#model_md_basemodel_description').hide();
        $('#model_md_description_area').show();
    }

    //Model Edit Modal
    else{
        $('#mdljson_edit').show();
        modalFilter = "Edit";
        tdlist = $(row).children('td');
        $('#mdModel .modal-title').text("Edit Model");

        $('#mdlDelete').show();
        $('#mdlUpdate').show();
        $('#model_md_name_area').show();
        $('#model_md_basemodel_area').show();
        $('#model_md_basemodel_description').show();

        $('#model_md_description_area').show();

        $('#mdlName').val($(tdlist[0]).text()).change();

        let tableBaseModel = getKeyByValue(BaseModel,$(tdlist[1]).text());
        $('#cboBaseModel').val(tableBaseModel).change();
        $('#mdlName').attr('disabled', true);
        $('#modeldesc').val($(tdlist[5]).text()).change();

        hModel.Get($('#mdlName').val()).then( (result) => {
            if(result['success']){
                var data = result['data'];
                var key = Object.keys(data);
                var item = data[key];
                tab_input_data(item['options']);
                tab_input_data(item['pre_process']);
                tab_input_data(item['post_process']);
                //desc
                $('#modeldesc').val(item['desc']);

                test_jsen_edit(data);
            }
        });
    }
    $('#mdModel').modal();
}

function test_jsen_edit(data) {
    var editor = document.getElementById("editor");

    // 객체의 첫 번째 키값 추출
    var firstKey = Object.keys(data)[0];

    // 첫 번째 키값에 해당하는 데이터 추출
    var targetData = data[firstKey];

    // 데이터 객체를 JSON 문자열로 직렬화
    var dataString = JSON.stringify(targetData, null, 4); // null, 4는 들여쓰기 설정

    // HTML 문자열로 데이터 포맷팅
    var formattedData = `<pre>${dataString}</pre>`;

    // editor 요소에 데이터 설정
    editor.innerHTML = formattedData;
}


function modalView(open_modal_id){
    $(`#${open_modal_id}`).modal();
}

function textClick(set){
    $('#model_md fieldset').hide();
    let chkid = set.split('_')
    if($(`#chk${chkid[0]}`).is(':checked')){
        $(`#${set}`).show();
        $(`#${set}`).prop('disabled', false);
    }
    else{
        $(`#${set}`).show();
        $(`#${set}`).prop('disabled', true);
    }
}

function chkClick(set){
    $('#model_md fieldset').hide();
    let chkid = set.split('_')
        if($(`#chk${chkid[0]}`).is(':checked')){
            $(`#${set}`).show();
            $(`#${set}`).prop('disabled', false);
        }
        else{
            $('#model_md fieldset').hide();
            $(`#${set} input`).val('');
        }
}
// 체크한 값 가져오기
function checkData(id){
    let valueId= id.substr(3);
    let Data={};
    for(let i = 0; i < $(`#${valueId}_group .control-label`).length; i++){
        Data[$(`#${valueId}_group .control-label:eq(${i})`).text().replace(':','').trim()] = $(`#${valueId}_group input:eq(${i})`).val();
    }
    Data = cleanData(Data);
    return Data;
}

// 빈값 제거
function cleanData(obj){
    for (var propName in obj) {
        if (obj[propName] === null || obj[propName] === undefined||obj[propName]==''||Object.keys(obj[propName]).length==0) {
            delete obj[propName];
        }
    }
    return obj
}

//선택한 항목의 input만 가져오기
function select_items_data() {
    // 선택한 항목
    var selectedSelect = document.getElementById('availableItems');
    var options = selectedSelect.getElementsByTagName('option');
    var resultObject = {};

    // 모든 옵션 요소의 텍스트 값을 확인하고 처리합니다.
    for (var i = 0; i < options.length; i++) {
        var optionText = options[i].textContent;
        var modifiedOptionText = optionText.replace(/ /g, '_');
        var tabAreaElement = document.querySelector(`#${modifiedOptionText}_area`);

        // 탭 영역 라벨과 입력 값을 객체에 추가
        if (tabAreaElement) {
            var labelElements = tabAreaElement.querySelectorAll('label.control-label');
            var inputElements = tabAreaElement.querySelectorAll('input[type="text"]');

            // 라벨과 입력 값 요소
            var itemObject = {};
            for (var j = 0; j < labelElements.length; j++) {
                var labelText = labelElements[j].textContent.trim();
                var inputValue = inputElements[j].value.trim();
                itemObject[labelText] = inputValue;
            }
            // modifiedOptionText를 키로 사용하여 객체를 저장
            resultObject[modifiedOptionText] = itemObject;
        }
    }
    // 결과
    console.log(resultObject);

    return(resultObject);
}

function extractData(input_data, keys) {
    var data = {};

    keys.forEach(function(key) {
        if (key in input_data) {
            data[key] = input_data[key];
        }
    });

    return data;
}


function ModelAdd(){
    if($('#mdlName').val() == undefined || $('#mdlName').val() == null || $('#mdlName').val() == ''){
        alert("Name 입력란을 확인해주세요");
        $('#mdlName').focus();
        return false;
    }

    var input_data = select_items_data();
    var option = extractData(input_data, keysOption);
    var pre_process = extractData(input_data, keysPreProcess);
    var post_process = extractData(input_data, keysPostProcess);

    hModel.Add(
    $('#mdlName').val(),
    $("#cboBaseModel option:selected").val(),
    option,
    pre_process,
    post_process,
    $('#modeldesc').val(),
    ModelList
    );
    $('#mdModel').modal('hide');
}

function ModelUpdate(){
    
    var input_data = select_items_data();
    var option = extractData(input_data, keysOption);
    var pre_process = extractData(input_data, keysPreProcess);
    var post_process = extractData(input_data, keysPostProcess);
    console.log(option);
    console.log(pre_process);
    console.log(post_process);
    
    hModel.Modify(
    $('#mdlName').val(),
    $("#cboBaseModel option:selected").val(),
    option,
    pre_process,
    post_process,
    $('#modeldesc').val(),
    ModelList
    );
}

function ModelDelete(){
    hModel.Remove(
    $('#mdlName').val(),
    ModelList
    );
}


var selectkey;
function baseModelSelect(row){
    modalReset();
    hBaseModel.Get(row).then( (result) => {
        //console.log(result);
        if(result['success']){
            var data = result['data'][row]; 
            if(modalFilter !== "Edit"){         

                //option
                tab_input_data(data['options']);
                chkOptList = table_opt_item_text(data['options']).split('/');

                //preProcessing
                tab_input_data(data['pre_process']);
                chkPreList = table_opt_item_text(data['pre_process']).split('/');

                //postProcessing
                tab_input_data(data['post_process']);
                chkPostList = table_opt_item_text(data['post_process']).split('/');

            }
            modalFilter = '';
            //Delete Base Model 
            if($('#mdModel .modal-title').text()=="Delete Base Model"){
                //base model을 선택하여 옵션 확인 후 삭제 
                $('#modeldesc').val(data['desc']);
                $('#model_md').find("input, label").prop('disabled',true);
            }
            else{
                $('#model_md_basemodel_description').text(data['desc']);
            }
        }
    });
}

// 탭 영역에 값 넣기
function tab_input_data(data) {
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        //test
        if(keys == "model"){
            continue;
        }
        else{
            let formattedKey = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_');
            let tabContent = document.querySelector(`#${formattedKey}_area`);
            if (tabContent) {
                let labels = tabContent.querySelectorAll('.control-label');
                let inputElements = tabContent.querySelectorAll('input[type="text"]');
                
                for (let j = 0; j < labels.length; j++) {
                    let label = labels[j];
                    let input = inputElements[j];
                    let labelText = label.textContent.trim();
                    
                    // 데이터 객체에서 라벨 텍스트와 일치하는 값을 찾아 input 요소에 할당
                    if (data[key][labelText.toLowerCase()]) {
                        input.value = data[key][labelText.toLowerCase()];
                    }
                }
            } else {
                console.log(`Tab content not found for key: ${formattedKey}`);
            }
        }
    }
}

function modalReset(){
    //tdRight 초기화
    $('#model_md fieldset').hide();
    $('.underline').val('');

    //desc 초기화
    $('#model_md_basemodel_description').text('');    
    // chk 초기화
    $('#checkboxes input').prop("checked", false);
    // 탭 초기화
    //clear_select_Tab();
}

function showTab(tabLink) {
    //console.log(tabLink);
    var tabId = tabLink.getAttribute('href').substring(1); // 탭 ID 추출
    var tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(function (content) {
        content.style.display = 'none';
    });

    var selectedTabContent = document.getElementById(tabId);
    if (selectedTabContent) {
        selectedTabContent.style.display = 'block';
    }
}

function model_opt_click(selectElement) {
    // 선택한 옵션의 텍스트 추출
    var selectedText = selectElement.options[selectElement.selectedIndex].text;
    
    var tabContents = document.querySelectorAll(".tab-content");

    // 모든 tab-content를 숨깁니다.
    tabContents.forEach(function (content) {
        content.style.display = "none";
    });

    // 선택한 tab-content를 보이게 합니다.
    var tabContent = document.getElementById(selectedText.replace(/ /g, "_") + "_area");
    if (tabContent) {
        tabContent.style.display = "block";
    }
}
/////////////////////////////////////////
//BaseModel

function ModelUpload() {
    return;

    var files = $('#uploadfile').prop('files');
    console.log(files);
    var optCAR  = document.getElementsByName('optModelValue');
    console.log(optCAR);
    hBaseModel.Upload(
        files[0],
    );
}

//base model uplode file 체크
function checkFile(check){
    if( $("#uploadfile").val() != "" ){

        var ext = $('#uploadfile').val().split('.').pop().toLowerCase();
        var fileSize = document.getElementById("uploadfile").files[0].size;
        //nginx 설정 50M 이상일 경우 에러 발생
        var maxSize = 50 * 1024 * 1024;

        // 확장자 체크
        if($.inArray(ext, ['vrws','vwsa']) == -1){
            alert('vrws, vwsa 확장자만 업로드가 가능합니다.');
            $("#uploadfile").val(""); 
            return;
        }
        // 사이즈 체크
        else if(fileSize > maxSize){
            alert(`50MB 이하의 파일만 업로드가 가능합니다.\n현재 파일 용량: ${Math.floor((check.files[0].size/1024)/1024)}MB`);
            $("#uploadfile").val(""); 
            return;
        };
    }
}

function BaseModelAdd(){
    //Base Model Add에서 Upload는 입력 필수
    if($('#uploadfile').val() == undefined || $('#uploadfile').val() == null || $('#uploadfile').val() == ''){
        alert("Upload 입력란을 확인해주세요");
        $('#uploadfile').focus();
        return;
    }
    // 업로드 중 다른 동작 금지
    $('#mdModel .modal-title').text("추가 중입니다.");
    $('#model_md').find("input, button, label, select ").prop('disabled',true);
    $('#model_md fieldset').hide();

    var input_data = select_items_data();
    var option = extractData(input_data, keysOption);
    var pre_process = extractData(input_data, keysPreProcess);
    var post_process = extractData(input_data, keysPostProcess);

    var files = $('#uploadfile').prop('files');
    hBaseModel.Upload(
        files[0],
    ).then( (result) => {
        hBaseModel.Add(
            result['uuid'],
            result['name'],
            option,
            pre_process,
            post_process,
            $('#modeldesc').val(),
            BaseModelList
            )
    }).then( () => {
        alert(`${files[0].name} 추가 되었습니다`);
        $('#mdModel').modal('hide');
        $('#model_md').find("input, button, label, select ").prop('disabled',false);
    });
}

function BaseModelDelete(){
    hBaseModel.Remove(
        $('#cboBaseModel  option:selected').val(),
        BaseModelList
        );
}

//value로 key 찾기
function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}

function isOptionInTarget(targetSelect, option) {
    for (var i = 0; i < targetSelect.options.length; i++) {
        if (targetSelect.options[i].value === option.value) {
            return true;
        }
    }
    return false;
}

function isOptionInTarget(targetSelect, option) {
    for (var i = 0; i < targetSelect.options.length; i++) {
        if (targetSelect.options[i].value === option.value) {
            return true;
        }
    }
    return false;
}

// 선택한 항목에 있는 목록 확인
function check_selected_data() {
    var selectedItemsSelect = document.getElementById('selectedItems');
    var selectedValues = [];
    for (var i = 0; i < selectedItemsSelect.options.length; i++) {
        selectedValues.push(selectedItemsSelect.options[i].value);
    }
    // 선택한 항목에 있는 값들을 배열로 반환합니다.
    return selectedValues;
}

// json editor
let storedText = '';
function json_save(){
    const text = $('#editor').text();
    storedText = text;
    hModel.Test_Add(storedText,ModelList);
    $('#model_json_modal').modal('hide');
    $('#mdModel').modal('hide');
}


// Model
/////////////////////////////////////////


/////////////////////////////////////////
// Rule
var ruleModelDesc = {};
function RuleInitial() {
    //Threshold 0 ~ 10 입력가능
    $('#rulThreshold').inputmask(
        "(9)|(10)",
        {
        placeholder: ' ', 
        showMaskOnHover: false,
        showMaskOnFocus: false,
        }
    );

    //Recipe,FileName의 위치는 -9 ~ 9까지 입력가능 
    $('#rulRecipeLocation,#rulFileNameLocation').inputmask(
        "(9)|(-9)",
        {
        placeholder: ' ', 
        showMaskOnHover: false,
        showMaskOnFocus: false,
        }
    );

    // Get All Client & Model List
    //server client 중 검사 pc 목록
    console.log('Rule Initial')
    hServer.Get().then( (result) => {
        if (result['success']) {
            //client dropdown
            $('#clientMenu').empty();
            //modal
            $('#cboRuleClient').empty();
            $('#clientMenu').append(
                `<li><a href="#" onclick="RuleSelectClient(this.textContent);">All</a></li>`);
                data = result['data'];
                //console.log(data);
                delete data.history;
                key = Object.keys(data);
                //console.log(key);
                for(i=0; i<key.length; ++i) {
                    var keys = data[key[i]];
                    //console.log(keys);
                    if(keys['isClient'] == 1||keys['isClient'] == 0){
                        $('#clientMenu').append(
                            `<li><a href="#" onclick="RuleSelectClient(this.textContent);">${keys['name']}</a></li>`);
                        $('#cboRuleClient').append(
                            `<option value="${keys['name']}">${keys['name']}</option>`);
                    }
                }
        }
    });

    // modal model 목록
    hRule.GetRuleModelList().then( (result) => {
        if (result['success']) {
            $('#cboRuleModel').empty();
            // { uuid1 : { 'name': name, 'desc': desc}, uuid2 : { 'name': name, 'desc': desc},  }
            ruleModelDesc = result['data'];
            var keys = Object.keys(ruleModelDesc);
            for(i=0; i<keys.length; ++i) {
                key = keys[i]
                //
                if('MODEL' == key.substr(0,5)){
                    var name = ruleModelDesc[key]['name'];
                    var desc = ruleModelDesc[key]['desc'];
                    ruleModelDesc[name] = desc;
                    $('#cboRuleModel').append(
                        `<option value="${name}">${name}</option>`);
                }
            }
        }
        $("#cboRuleModel option:eq(0)").prop("selected", true);
    });
    RuleList(); 
}

// model 목록 선택시 textarea 작성
function RuleShowModelDesc(object) {
    var key = $('#cboRuleModel').find(":selected").val();
    $('#rulModelDesc').text(ruleModelDesc[key]);
}

function RuleAdd() {
    hRule.Add(
        $('#cboRuleClient').val(),
        $('#cboRuleModel').val(),
        $('#rulThreshold').val(),
        RuleGetFilter('Recipe'),
        RuleGetFilter('FileName'),
        RuleList
    );
}

function RuleUpdate() {
    hRule.Modify(
        $('#cboRuleClient').val(),
        $('#cboRuleModel').val(),
        $('#rulThreshold').val(),
        RuleGetFilter('Recipe'),
        RuleGetFilter('FileName'),
        jskey,
        RuleList
    );
}

function RuleDelete(){
    hRule.Remove(
        $('#cboRuleClient').val(),
        jskey,
        RuleList
    );
}

//Get Data From Server
function RuleList() {
    hRule.Get('').then( (result) => {
        $('#tblRule tbody').empty();
        if (result['success']) {
            //var cnt = 0;
            var data = result['data'];
            //console.log('Rule List data',data);
            var keys = Object.keys(data);
            for(let i = 0; i < keys.length; i++) {
                var client_name = keys[i];
                var items = data[client_name];
                var itemkeys = Object.keys(items);
                for(let j = 0; j < itemkeys.length; ++j) {
                    item = items[itemkeys[j]];
                    //console.log(client_name, item);
                    filter = item['filter'];
                    var rec = example(filter['recipe'][0],filter['recipe'][1]);
                    var fil = example(filter['filename'][0],filter['filename'][1]);

                    $('#tblRule tbody').append(
                        `<tr id="${itemkeys[j]}"onclick="RuleView(this);">
                        <td>${client_name}</td>
                        <td>${item['model']}</td>
                        <td>${item['option']['threshold']}</td>
                        <td class="${filter['recipe']}">${rec}</td>
                        <td class="${filter['filename']}">${fil}</td>
                        </tr>`
                    )
                };
            }
        }
    });
}

//dropdown filter
function RuleSelectClient(val) {
    console.log('Select:', val);

    hRule.Get(val).then((result) => {
        if (!result['success']) {
            return;
        }
        var data = result['data'];
        var keys = Object.keys(data);
        var tbody = $('#tblRule tbody');
        tbody.empty();

        function addRow(client_name, itemkeys) {
        for (let j = 0; j < itemkeys.length; ++j) {
            var item = items[itemkeys[j]];
            var filter = item['filter'];
            var rec = example(filter['recipe'][0], filter['recipe'][1]);
            var fil = example(filter['filename'][0], filter['filename'][1]);

            var row = `
            <tr id="${itemkeys[j]}" onclick="RuleView(this);">
                <td>${client_name}</td>
                <td>${item['model']}</td>
                <td>${item['option']['threshold']}</td>
                <td class="${filter['recipe']}">${rec}</td>
                <td class="${filter['filename']}">${fil}</td>
            </tr>
            `;
            tbody.append(row);
            }
        }

        if (val == 'All') {
        for (let i = 0; i < keys.length; ++i) {
            var client_name = keys[i];
            var items = data[client_name];
            var itemkeys = Object.keys(items);
            addRow(client_name, itemkeys);
            }
        } 
        else {
            var items = data[val];
            if (items) {
                var itemkeys = Object.keys(items);
                addRow(val, itemkeys);
            }
        }
    });
}

function RuleGetFilter(itemkey) {
    var isOn = $(`#chk${itemkey}`).is(':checked')
    //var vType = $(`#cboRule${itemkey}`).val();
    var vKeyword = $(`#rul${itemkey}Keyword`).val();
    var vLocation = $(`#rul${itemkey}Location`).val();
    if (isOn)
        return [ vKeyword, vLocation];
    else
        return '';
}

function RuleFilterChecked(itemkey) {
    //체크 확인 후 활성화,비활성화
    var isOn = $(`#chk${itemkey}`).is(':checked')
    if(itemkey =='Threshold'){
        $(`#rul${itemkey}`).prop("readonly", !isOn);
    }
    else{
    $(`#rul${itemkey}Keyword`).prop("readonly", !isOn);
    $(`#rul${itemkey}Location`).prop("readonly", !isOn);
    }
}

function inputexample(key){
    //키워드,위치 값 변경시 
    var Keyword = $( `#rul${key}Keyword` ).val();
    var Location = $( `#rul${key}Location`).val();
    var text = example(Keyword,Location);
    $(`#ex${key}`).val(text.replace('-',''));
}

function example(val, mark){
// 예시 표현
    // console.log(val,mark);
    var isEnabled = ((val != '')&& (val != '-') && (val !== undefined)&& (val !== null));
    var absMark = Math.abs(mark);
    var markLC="";
    var text="";
    if(isEnabled){
        for(i = 0; i<absMark; i++){
            markLC = markLC + '$';
        }
        //위치 : 음수
        if(parseInt(mark) < 0){
            //키워드 == 위치
            text = (' * . . . * ' + val)
            //키워드 > 위치
            if(val.length > absMark){
                text= (' * . . . * ' + val.substr(0, absMark));
            }
            //키워드 < 위치
            else if(val.length < absMark){
                text= (' * . . . * ' + val + markLC.substring(0,absMark - val.length));
            }
        }
        //위치 : 양수
        else if (parseInt(mark) > 0){
            text = ( markLC + ' ' + val +  ' * . . . * ');
        }
        //위치 : 0
        else if(parseInt(mark) == 0){
            text = (val +  ' * . . . * ');
        }
        //위치 : x 
        else{
            text = val;
        }
    }
    //키워드 : x 
    else{
        text="-";
    }
    return text;
}

// recipe, filename 값이 있을 때, 모달창 keyword, Location 체크, 활성화, value 값 넣어주기
function RuleShowFilter(itemkey, value) {
    //console.log(value);
    var isEnabled = ((value != '') && (value != '-')&& (value != ','));
    //console.log(isEnabled);
    if (isEnabled) {
        $(`#chk${itemkey}`).prop("checked", isEnabled);
        var tmp = (value.split(','));
        $(`#rul${itemkey}Keyword`).val(tmp[0]);
        $(`#rul${itemkey}Location`).val(tmp[1]);
        //console.log(tmp[0],tmp[1]);
        var vlauetext = example(tmp[0],tmp[1]);
        $(`#ex${itemkey}`).val(vlauetext);
    } else {
        $(`#chk${itemkey}`).prop("checked", isEnabled);
        $(`#rul${itemkey}Keyword`).val('');
        $(`#rul${itemkey}Location`).val('');
    }
    RuleFilterChecked(itemkey);
}

// Threshold 값이 있을 때, 모달창 Threshold 체크, 활성화, value 값 넣어주기
function RuleThresholdFilter(itemkey, value) {
    var isEnabled = ((value != '')&& (value != '-'));
    //console.log(isEnabled);
    $(`#chk${itemkey}`).prop("checked", isEnabled);
    RuleFilterChecked(itemkey);
    if (isEnabled) {
        $(`#rul${itemkey}`).val(value);
    } else {
        $(`#rul${itemkey}`).val('');
    }
}

var tdlist;
var jskey;
function RuleView(row) {
    console.log('RuleView');
    $('#exRecipe').val("");
    $('#exFileName').val("");
    $('#rulModelDesc').text("");
        if (row == '') {
        $('#mdRule .modal-title').text("Add Rule");
        $('#cboRuleClient').attr('disabled', false);
        $('#rulAdd').show();
        $('#rulUpdate').hide();
        $('#rulDelete').hide();

        $('#cboRuleClient').val($('#cboRuleClient').find("option:first-child").val()).change();
        $('#cboRuleModel').val($('#cboRuleModel').find("option:first-child").val()).change();
        //keys = Object.keys(ruleModelDesc);
        $('#rulThreshold').val('');
        $(`#chkThreshold`).prop("checked", false);
        RuleShowFilter('Threshold','');
        RuleShowFilter('Recipe','');
        RuleShowFilter('FileName','');
    
    } else {
        jskey = row.id;
        $('#mdRule .modal-title').text("Edit Rule");
        $('#cboRuleClient').attr('disabled', true);
        tdlist = $(row).children('td');
        $('#rulAdd').hide();
        $('#rulUpdate').show();
        $('#rulDelete').show();
        $('#cboRuleClient').val($(tdlist[0]).text()).change();
        $('#cboRuleModel').val($(tdlist[1]).text()).change();
        RuleThresholdFilter('Threshold', $(tdlist[2]).text());

        RuleShowFilter('Recipe', $(tdlist[3]).attr( 'class' ));
        RuleShowFilter('FileName', $(tdlist[4]).attr( 'class' ));
    }
    $('#mdRule').modal();
}

// contentEditable 숫자만 입력 가능 
function inputNumber(input) {
    let redata = $(input).text().replace(/[^0-9 | ^\.|^-]/g,'');
    input.innerText = redata;
    // 포커스시 커서 뒤로 이동
    let selection = document.getSelection()
    let newRange = document.createRange();
    newRange.selectNodeContents(input);
    newRange.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(newRange);
}

// Rule
/////////////////////////////////////////

/////////////////////////////////////////
// History

function HistoryInitial() {
    console.log('History Initial')
    clientdropdown();
    resetbtn();
}

//client dropdown
//sever 에서 get client
var ipList = {};
function clientdropdown(){
    hServer.Get().then( (result) => {
        if (result['success']) {
            $('#history_select_client_sub').empty();
                data = result['data'];
                delete data.history;
                keys = Object.keys(data);
                for(let i=0; i<keys.length; i++) {
                    var name = data[keys[i]];
                    if(name['isClient'] == 1||name['isClient'] == 0){
                        $('#history_select_client_sub').append(
                            `<li><a aria-label="submenu" value="${name['ip']}" onclick="SubMenuClick(this)" >${name['name']}</a></li>`
                        );
                        ipList[name['ip']] = name['name'];
                    }
                }
        }
    });
}

let currentPage = 1; // 현재 페이지 번호
let itemsPerPage = calculateItemsPerPage(); // 페이지당 테이블 수
let storedSortData = []; // 저장된 정렬 데이터
let storedData = {}; // 저장된 데이터
let filterState = {};
let filterLabel = {};
let filterData = {}; // 필터링 데이터
let filterSortData =[];// 필터링 정렬 데이터
let filterTF = false;
// modal 창
var imgResult;
var trIndex;
var img_wh;

// 페이지 높이에 따라 한 페이지에 보여줄 데이터 개수 계산
function calculateItemsPerPage() {
    return Math.floor(window.innerHeight / 40);
}

// 창 크기 변경 이벤트 
window.addEventListener('resize', function () {
    itemsPerPage = calculateItemsPerPage();
});

// 찾기 버튼 클릭
function SearchHistory() {
    // 요소를 가져올 때 변수명을 올바르게 수정합니다.
    var historySelectClientSub = document.getElementById('history_select_client_sub');
    var client_value = historySelectClientSub.getAttribute('value');
    if (client_value === "All," || client_value === "All") {
        client_value = ""; // 공백으로 변경
    }
    var historySelectStateSub = document.getElementById('history_select_state_sub');
    var state_value = historySelectStateSub.getAttribute('value').split(',');
    
    // 찾기 버튼 클릭 금지
    $('#searchHistory').prop("disabled", true);
    currentPage = 1;
    hHistory.Get(
        client_value,
        state_value[0],
        state_value[1],
        tdate($('#historyStart').val()),
        tdate($('#historyEnd').val()),
        $('#Recipe').val(),
        $('#Lot').val(),
        $('#Imgname').val()
    ).then(result => {
        HistorySearchResult(result);
    }).finally(() => {
        $('#searchHistory').prop("disabled", false);
    });
}

function HistorySearchResult(result) {
    if (result['success']) {
        const data = result['data'];
        storedData = data; // 데이터 저장
        updateTable(data);
    }filteringData
}

// 테이블 업데이트
function updateTable(data) {
    const sortData = []; // 정렬된 데이터 배열 생성

    // 데이터를 정렬된 형태로 sortData에 추가
    for (const uuid in data) {
        sortData.push([Tdel(data[uuid]['last_access_time']), uuid]);
    }
    sortData.sort((a, b) => b[0].localeCompare(a[0])); // 시간 역순 정렬

    storedSortData = sortData; // 정렬 데이터 저장
    // 데이터를 페이징 처리하여 테이블에 추가
    paginateAndAppendData(data, sortData);

    updatePagination(sortData.length);
}

// 데이터를 페이징 처리하여 테이블에 추가
function paginateAndAppendData(data, sortData) {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = Math.min(startIdx + itemsPerPage, sortData.length);
    const tblHistoryBody = $('#tblHistory tbody');
    
    tblHistoryBody.empty();
    for (let i = startIdx; i < endIdx; i++) {
        const items = data[sortData[i][1]];
        const label = toUpperCase(convert_null_todot (items['label']));
        const state = stateKo(items['state']);
        const last = Tdel(items['last_access_time']);
        const clientId = ipList[items['client_id']];
        const row = `
            <tr id="${sortData[i][1]}" onclick="HistoryView(this.id);">
              <td>${clientId}</td>
              <td>${last}</td>
              <td>${items['recipe']}</td>
              <td>${items['lot']}</td>
              <td>${items['name']}</td>
              <td>${state}</td>
              <td>${label}</td>
            </tr>`;
        tblHistoryBody.append(row);
    }
}

// 페이징 버튼 업데이트
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    let paginationHTML = '';

    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `<button class="active" onclick="gotoPage(${i})">${i}</button>`;
        } else {
            paginationHTML += `<button onclick="gotoPage(${i})">${i}</button>`;
        }
    }

    $('#pagination').html(paginationHTML);
}

// 페이지 번호로 이동
function gotoPage(pageNumber) {
    currentPage = pageNumber;
    if(filterTF){
        paginateAndAppendData(filterData, filterSortData);
        updatePagination(filterSortData.length);
    }
    else{
        paginateAndAppendData(storedData, storedSortData);
        updatePagination(storedSortData.length);
    }
}

function SubMenuClick(clickedElement) {
    // 클릭한 항목의 value 값
    var clickedValue = clickedElement.getAttribute('value');

    // 클릭한 항목이 속한 서브 메뉴(<ul> 요소) 찾기
    var parentSubMenu = clickedElement.closest('.sub-menu');

    if (parentSubMenu) {
        // 현재 클릭한 항목의 li
        var clickedLi = clickedElement.closest('li');

        // 현재 목록 중 선택된 li
        var currentSelectedLi = parentSubMenu.querySelector('li.selected');

        // 클릭한 li가 이미 선택된 상태이면 'selected' 클래스 제거 및 배경색 초기화
        if (clickedLi.classList.contains('selected')) {
            clickedLi.classList.remove('selected');
            clickedLi.style.backgroundColor = "";
            parentSubMenu.setAttribute('value', "All,");
            
        } else {
            // 'selected' 클래스 추가, 배경색 변경
            clickedLi.classList.add('selected');
            clickedLi.style.backgroundColor = "#ccc";

            // 현재 목록 중의 li에 'selected' 클래스가 있으면 제거 및 배경색 초기화
            if (currentSelectedLi) {
                currentSelectedLi.classList.remove('selected');
                currentSelectedLi.style.backgroundColor = "";
            }

            // 클릭한 항목의 value 설정
            parentSubMenu.setAttribute('value', clickedValue);
        }
    }
}


//state dropdown
function statedropdown(sta){
    if(sta=='All'){
        $("#cboHistorySelectlabel").removeAttr("disabled");
        $('#historylabelIcon').removeAttr("disabled");
    }

    else if(sta=='insp_end'){
        $("#cboHistorySelectlabel").removeAttr("disabled");
        $('#historylabelIcon').removeAttr("disabled");
    }

    else if(sta=='complete'){
        $("#cboHistorySelectlabel").removeAttr("disabled");
        $('#historylabelIcon').removeAttr("disabled");
    }

    else{
        $("#cboHistorySelectlabel").val("").prop("selected", true);
        $('#cboHistorySelectlabel').attr("disabled", true);
        $('#historylabelIcon').attr("disabled", true);
    }
}

// 필터링
function filteringData(state, label='') {
    if (state === 'All') {
        filterTF = false;
    } else {
        filterTF = true;
    }
    currentPage = 1;
    filterData = {};

    for (const id in storedData) {
        const items = storedData[id];
        if ((state === 'All' || state === items['state']) && (label === '' || label === items['label'])) {
            filterData[id] = items;
        }
    }
    console.log(filterData);
    // 시간 역순으로 정렬
    filterSortData = Object.entries(filterData)
        .map(([id, items]) => [Tdel(items['last_access_time']), id])
        .sort((a, b) => b[0].localeCompare(a[0]));

    // 필터링된 데이터를 페이징 처리하여 테이블에 추가
    paginateAndAppendData(filterData, filterSortData);

    // 페이징 버튼 업데이트
    updatePagination(filterSortData.length);
}

function showResultsDropdown(event) {
    event.currentTarget.querySelector(".sub-dropdown").style.display = "block";
}

function hideResultsDropdown(event) {
    event.currentTarget.querySelector(".sub-dropdown").style.display = "none";
}

// 리셋 버튼
function resetbtn(){
    $('#tblHistory tbody').empty();
    var historySelectClientSub = document.getElementById('history_select_client_sub');
    historySelectClientSub.setAttribute('value', "");
    var historySelectStateSub = document.getElementById('history_select_state_sub');
    historySelectStateSub.setAttribute('value', "All,");
    //
    let dt = new Date();
    let dt2 = new Date();
    dt2.setDate(dt.getDate() - 7);
    $('#historyStart').val(moment(dt2).format('YYYY/MM/DD HH:mm'));
    $('#historyEnd').val(moment(dt).format('YYYY/MM/DD HH:mm'));

    $("#Recipe").val("");
    $("#Lot").val("");
    $("#Imgname").val("");
    SearchHistory();
}
function history_modal_reset(){
    // modal 창 열릴 때 초기화
    $("#chk").prop("checked", false);
    $('#mdHistory1').find("input,select,textarea").prop("disabled",false);
    $('#mdHistoryBody .form-control').val('');
    $('#modaltbl tbody').empty();
    $('#mdHistory1 .modal-title').text('');
    $('#Recipebox').val('');
    $('#Lotbox').val('');
    $('#Modelbox').val('');
    $('#Result').val('');

    // 선 그리기 초기화
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function toUpperCase(text){
    return text.toUpperCase();
}
function toLowerCase(text){
    return text.toLowerCase();
}

function HistoryView(trThis) {
    console.log('HistoryView');
    trIndex = $(`#${trThis}`).parent().find("tr").index($(`#${trThis}`));
    history_modal_reset();
    hHistory.GetView(trThis).then((result) =>{
        $('#modaltbl tbody').empty();
        var image_data = '';
        if (result['success']) {
            var data = result['data'];
            var keys = Object.keys(data);
            for(i=0; i<keys.length; ++i) {
                var items = data[keys[i]];
                // null값 확인,시간T제거
                // 검사이력
                var ready = Tdel(convert_null_todot (items['ready_time']));
                var req = Tdel(convert_null_todot (items['req_time']));
                var complete = Tdel(convert_null_todot (items['complete_time']));
                var end = Tdel(convert_null_todot (items['end_time']));
                var name = convert_null_todot (items['name']);
                var lab = toUpperCase(convert_null_todot (items['label']));
                //test
                img_wh = items['wh'];
                imgResult = items['result'];
                var model1 = convert_null_todot (items['model_id']);
                var rec = convert_null_todot (items['recipe']);
                var lot = convert_null_todot (items['lot']);
                image_data = items['image'];
                console.log("data",data);
                console.log("open result",items['result']);
                // modal 검사이력 
                    $('#modaltbl tbody').append(
                        `<tr id='ready'>
                        <td>검사 준비</td>
                        <td>${ready}</td>
                        </tr>
                        <tr id='request'>
                        <td>검사 요청</td>
                        <td>${req}</td>
                        </tr>
                        <tr id='insp_end'>
                        <td>검사 진행</td>
                        <td>${end}</td>
                        </tr>
                        <tr id='complete'>
                        <td>검사 완료</td>
                        <td>${complete}</td>
                        </tr>`
                    )
                //진행중인 검사 이력
                cssbold(items['state'],lab);

                $('#mdHistory1 .modal-title').text(name);
                $('#Recipebox').val(rec);
                $('#Lotbox').val(lot);
                $('#Modelbox').val(model1);               
                $('#Result').val(lab);
            }
                drawimg(image_data);
        }
        else{
            $('#mdHistory1 .modal-title').text('문제가 발생했습니다.');
            // $('.modal-body').append(`<div class="loader"></div>`);
            $('#mdHistoryBody').find("input,select,button,textarea").prop("disabled",true);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

        }
    })
    $('#mdHistory1').modal();
}

//modal 창 < >
function after(){
    $('#modalafter').prop("disabled",true);
    trIndex = trIndex - 1;
    let be = ($(`#tblHistory tbody tr:eq(${trIndex})`));
    if (trIndex <= -1){
        trIndex = 0;
        alert("다음이 없습니다.");
        return
    }
    HistoryView(be.attr("id"));

}

function before(){
    $('#modalbefore').prop("disabled",true);
    trIndex = trIndex + 1;
    let be = ($(`#tblHistory tbody tr:eq(${trIndex})`));
    var trlist = ($('#tblHistory tbody').children('tr').length -1);
    if (trIndex > trlist){
        trIndex = trlist;
        alert("이전이 없습니다.");
        return
    }
    HistoryView(be.attr("id"));

}

function handleKeyDown(event) {
    // 키보드 이벤트 처리
    if (event.key === 'ArrowLeft') {
        before();
    }
    else if (event.key === 'ArrowRight') {
        after();
    }
}

//modal창 상태 확인 후 bold, 검사 완료만 검사 결과 확인 가능
function cssbold(a, b) {
    let target = document.getElementById('chk');
    $('#ready, #request, #insp_end, #complete').css('font-weight', 'normal');
    target.disabled = false;
    if (a == 'ready' || a == 'request' || a == 'insp_end' || a == 'complete') {
        $(`#${a}`).css('font-weight', 'bold');
    }
    if (a == 'insp_end' || a == 'complete') {
        if (b == 'NG') {
            target.checked = true;
            target.disabled = false;
        } else {
            target.checked = false;
            target.disabled = true;
        }
    }
    else{
        target.disabled = true;
    }

    // onchange 이벤트를 발동
    var event = new Event('change');
    target.dispatchEvent(event)
}

// 체크박스 체크 시 canvas 그리기
function CanvasShow(){
    if($('#chk').is(':checked')){
        draw_NGArea(imgResult);
    }
    //현재 canvas 초기화후 이미지를 다시 그림 
    else{
        let canvas = document.getElementById('myCanvas');
        let ctx = canvas.getContext("2d");
        //canvas 지우기
        ctx.clearRect(0, 0, canvas.width, canvas.width);
    }
}

function canvas_img_xy(cenxy){
    //500,450 리사이징
    var val_w = 500 / (cenxy[0] * 2);
    var val_h = 450 / (cenxy[1] * 2);
    return [val_w, val_h]
}

//imgCanvas 이미지 그리기
var img_resize_wh;
function drawimg(image_data){
    // img
    let canvas = document.getElementById('imgCanvas');
    let ctx = canvas.getContext("2d");
    // 이미지 데이터가 유효한 JSON 형식인지 확인
    try {
        var key = JSON.parse(imgResult);
    } catch (error) {
        console.lof("ng draw data ",imgResult);
        console.log("imgResult is not valid JSON:", error);
        var jsonString = imgResult.replace(/'/g, '"'); // 작은 따옴표를 큰 따옴표로 바꿈
        var key = JSON.parse(jsonString);
        //console.log(imgResult);
        //console.log(key);
    }

    if (key && key.hasOwnProperty('center')) {
        // 'center' 속성이 있는 경우의 처리
        try{
            var centerxy = key['center'];
            // 축소 비율
            img_resize_wh = canvas_img_xy(centerxy);
            canvas.width = (centerxy[0] * 2) * img_resize_wh[0];
            canvas.height = (centerxy[1] * 2) * img_resize_wh[1];

        }catch (e) {
            //center가 없는 경우 (검사 준비,요청)에 대한 처리
            if (e instanceof TypeError) {
                canvas.width = 500;
                canvas.height = 450;
            }
        }finally {
            let img = new Image();
            img.onload = function () {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = image_data;
        }
    } else {
        // 'center' 속성이 없거나 key가 없는 경우의 처리
        img_resize_wh = canvas_img_xy([img_wh[0]/2, img_wh[1]/2]);

        canvas.width = (img_wh[0]) * img_resize_wh[0];
        canvas.height = (img_wh[1]) * img_resize_wh[1];
        let img = new Image();
        img.onload = function () {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = image_data;
    }
    if($('#modalafter').attr("disabled")||$('#modalbefore').attr("disabled")){
        $('#modalafter').prop("disabled",false);
        $('#modalbefore').prop("disabled",false);
    }

}

//결과가 NG의 경우 좌표값으로 선 그리기
function draw_NGArea(data){
    //console.log("draw_NGArea", data);
    try {
        var key = JSON.parse(data);
    } catch (error) {
        var jsonString = data.replace(/'/g, '"');
        var key = JSON.parse(jsonString);
    }
    // canvas 설정
    let canvas = document.getElementById('myCanvas');
    let ctx = canvas.getContext("2d");

    // center가 있는 경우
    if (key && key.hasOwnProperty('center')) {
        //img 중심점 centerxy
        var centerxy = key['center'];

        img_resize_wh = canvas_img_xy(centerxy);
        delete key.center;

        var keys = Object.keys(key);
        canvas.width = (centerxy[0] * 2) * img_resize_wh[0];
        canvas.height = (centerxy[1] * 2) * img_resize_wh[1];

        for(l = 0; l<keys.length; l++) {
            var item = key[keys[l]];
            var items = item['point'];
            //ng 영역 선그리기 옵션
            ctx.lineCap = 'square';
            ctx.lineJoin = 'round';
            ctx.fillStyle = "red";
            ctx.lineWidth = 1;

            //시작
            ctx.moveTo(items[0][0] * img_resize_wh[0], items[0][1] * img_resize_wh[1]);
            //시작 -> 다음 좌표
            for(i=0; i<items.length; ++i) {
                    ctx.lineTo(items[i][0] * img_resize_wh[0] ,  items[i][1] * img_resize_wh[1]);  
            }
            //마지막 좌표 시작 연결
            ctx.lineTo(items[0][0] * img_resize_wh[0] , items[0][1] * img_resize_wh[1]);
            //선 그리기 
            ctx.stroke();
        }
    }
    else if(key.clipXYWH){
        // center가 없는 경우
        var ng_area = key.clipXYWH;

        img_resize_wh = canvas_img_xy([img_wh[0]/2, img_wh[1]/2]);
        canvas.width = (img_wh[0]) * img_resize_wh[0];
        canvas.height = (img_wh[1]) * img_resize_wh[1];
        
        for (var i = 0; i < ng_area.length; i++) {
            var ng_item = ng_area[i];
            draw_square(ctx, ng_item)
        }

    }

    else if(key.clip_list){

        var new_result = key.clip_list;
        console.log("new_result", new_result);

        img_resize_wh = canvas_img_xy([img_wh[0]/2, img_wh[1]/2]);
        canvas.width = (img_wh[0]) * img_resize_wh[0];
        canvas.height = (img_wh[1]) * img_resize_wh[1];

        var label_xywh = {};
        for (var i = 0; i < new_result.length; i++) {
            var item = new_result[i];
            if (item.xywh && item.label && item.label !== -1) {
                if (!label_xywh[item.label]) {
                    label_xywh[item.label] = [];
                }
                label_xywh[item.label].push(item.xywh);
            }
        }
        var labels = Object.keys(label_xywh);
        for (var i = 0; i < labels.length; i++) {
            var label = labels[i];
            var labelInfo = label_xywh[label];
            for (var j = 0; j < labelInfo.length; j++) {
                var xywh = labelInfo[j];
                draw_square(ctx, label, xywh);
            }
        }
    }
}

function draw_square(ctx, label= -1, xywh){
    // ng 영역 그리기 사각형 옵션
    ctx.strokeStyle = "red";
    ctx.lineWidth = 1;

    console.log(ctx, label, xywh);
    var x = (xywh[0]) * img_resize_wh[0];
    var y = (xywh[1]) * img_resize_wh[1];
    var square_w = (xywh[2]) * img_resize_wh[0];
    var square_h = (xywh[3]) * img_resize_wh[1];

    ctx.strokeRect(x, y, square_w, square_h);
    if(label !== "-1"){
        draw_label(ctx, label, x, y, square_w);
    }
}

function draw_label(ctx, label=-1, x, y, w){
    // 라벨 텍스트 그리기 옵션
    ctx.fillStyle  = "red";
    ctx.lineWidth = 2;
    ctx.fillText(label, x, y, w);
}

//기간 start ~ end  형식 변경
function tdate(t){
    var time = (moment(t,'YYYY/MM/DD HH:mm').format('YYYYMMDDHHmmss'));
    return time
}

//시간에 T 제거
function Tdel(Td){
    Td = Td.replace('T',' ');
    return Td
}

// NULL값 .으로 변환
function convert_null_todot(fnull){
    fnull =(fnull ?? '.');
    return fnull
}

// state 한글로 변환
function stateKo(text){
    if (text == 'ready')
        text='검사 준비';
    else if (text == 'request')
        text='검사 요청';
    else if (text == 'insp_end')
        text='검사 진행';
    else
        text='검사 완료';
    return text
}
/*
// 스크롤 맨 위 위치로 이동
function Btngotop(){
    window.scrollTo({top:0, left:0, behavior:'smooth'});
    return false;
}

// 스크롤 맨 아래 위치로 이동
function Btngobottom(){
    var whi=$(document).height();
    window.scrollTo({top:whi, left:0, behavior:'smooth'});
    return false;
}
*/
// excel 
var excelData = [];
function excelEdit(data){
    excelData.push({
        "client":ipList[data.client_id],
        "날짜":data.last_access_time,
        "모델":data.model_id,
        "상태":stateKo(data.state),
        "결과":data.label,
        "Recipe":data.recipe,
        "Lot":data.lot,
        "Image Name":data.name,
    });

}
// test 용
function excelDownLoad(){ 
    const workbook = new ExcelJS.Workbook();
    // sheet 생성
    const worksheet = workbook.addWorksheet('Sheet1');
    const worksheet2 = workbook.addWorksheet('Sheet2');
    worksheet.columns = [
        {header: 'client', key: 'client', width: 10, style: { alignment : { vertical: 'middle', horizontal: 'center' } }},
        {header: '날짜', key: '날짜', width: 20, style: { alignment : { vertical: 'middle', horizontal: 'center' } }},
        {header: '모델', key: '모델', width: 22, style: { alignment : { vertical: 'middle', horizontal: 'center' } }},
        {header: '상태', key: '상태', width: 10, style: { alignment : { vertical: 'middle', horizontal: 'center' } }},
        {header: '결과', key: '결과', width: 5, style: { alignment : { vertical: 'middle', horizontal: 'center' } }},
        {header: 'Recipe', key: 'Recipe', width: 10, style: { alignment : { vertical: 'middle', horizontal: 'center' } }},
        {header: 'Lot', key: 'Lot', width: 10, style: { alignment : { vertical: 'middle', horizontal: 'center' } }},
        {header: 'Image Name', key: 'Image Name', width: 15, style: { alignment : { vertical: 'middle', horizontal: 'center' } } }
    ];
    worksheet2.colums=[]
    excelData.map((item, index) => {
        worksheet.addRow(item);
      });

    workbook.xlsx.writeBuffer().then((data) => {
        const blob = new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        // 파일명
        anchor.download = `TEST.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    })
}

function imgDownLoad(){
    //canvas 이미지와 NG영역 canvas를 합쳐서 하나의 canvas
    let canvas = document.getElementById('downloadCanvas');
    let ctx = canvas.getContext("2d");
    canvas.width = 500;
    canvas.height = 450;
    var image = new Image();
    let canvas1 = document.getElementById('imgCanvas');
    let canvas2 = document.getElementById('myCanvas');
    ctx.drawImage(canvas1, 0, 0, canvas.width,  canvas.height);
    ctx.drawImage(canvas2, 0, 0, canvas.width,  canvas.height);

    // download
    var image = canvas.toDataURL();
    var link = document.createElement("a");
    link.href = image;
    link.download = `${$('#mdHistory1 .modal-title').text()}`;
    link.click();
    $('#imgdown').blur();
}

// History
/////////////////////////////////////////

//Train
/////////////////////////////////////////
//모달 창 열기
// 학습, 학습 모달
// 데이터셋모달 , sub 데이터셋 모달
// 학습 옵션 모달 , sub json 학습 옵션 모달
// 학습 조건 모달 , sub 학습 조건 모달

function TrainInitial(){
    console.log("Train Initial");
    train_Update();
}
function Train_start(){
// 학습 시작
    console.log("start");
}
function TrainAdd(data){
    hTrain.Add(data);
    // 차후 업데이트 분리 수정 예정
    train_Update();
}
function TrainUpdate(data) {
    hTrain.Modify(data);
    // 차후 업데이트 분리 수정 예정
    train_Update();
}
function Train_Delete(element){
    //임시
    var train_td = element.closest('.train_td');

    var parent_div = element.parentElement.parentElement;
    var text_value = parent_div.textContent.trim();
    var lines = text_value.split('\n');
    var data_object = {};
    var name = lines[1].trim();

    console.log(name);

    var data = {
        'work': 'train',
        'type': {
            'train': {
                [name]: {
                }
            }
        }
    };
    hTrain.Remove(data);
    // 차후 업데이트 분리 수정 예정
    train_Update();
}

function TrainList(){
    hTrain.Get('').then( (result) => {
        console.log(result)
        /*
        $('.train_td').empty();

        if (result['success']) {
            var data = result['data'];

            // 테이블 생성
            $('.train-container').append(`
            <div class="train_td">
                <div class="train-cell">${}</div>
                <div class="train-cell">${}</div>
                <div class="train-cell">${}</div>
                <div class="train-cell">${}</div>
                <div class="train-cell">${}</div>
                <div class="train-cell">${}</div>
                <div class="train-cell">
                    <button type="button" class="btn btn-default" onclick="Train_start();">
                        <span class="glyphicon glyphicon-triangle-right"></span>
                    </button>
                    <button type="button" class="btn btn-default" onclick="train_View('edit', this);">
                        <span class="glyphicon glyphicon-pencil"></span>
                    </button>
                    <button type="button" class="btn btn-default" onclick="Train_Delete(this);">
                        <span class="glyphicon glyphicon-trash"></span>
                    </button>
                </div>
            </div>
            `)
        }
        */
    });
}

function train_View(name, button_element){
    console.log("학습 모달창", name, button_element)
    // 학습 목록 추가 , 편집
    var md_name = name.toLowerCase();
    if(md_name === 'add'){
        // + 버튼 클릭 시 모달 초기화
        $('#mdTrain .modal-title').text("add Train");
        class_Area_Input_Reset();
    }

    else if(md_name === 'edit'){
        // 편집 버튼 클릭 시 모달 초기화
        $('#mdTrain .modal-title').text("Edit Train");
        var parent_div = button_element.parentElement.parentElement;
        var text_value = parent_div.textContent.trim();
        var lines = text_value.split('\n');
        var data_object = {};
        if (lines.length >= 6) {
            data_object.date = lines[0].trim();
            data_object.name = lines[1].trim();
            data_object.data_set = lines[2].trim();
            data_object.train_options = lines[3].trim();
            data_object.train_conditions = lines[4].trim();
            data_object.description = lines[5].trim();
        }
        class_Area_Input_Data(data_object);
    }
    $('#mdTrain').modal();
}

///// 학습 페이지 업데이트 /////
function processProperty(propertyData, updateFunction) {
    if (propertyData.length != 0) {
      updateFunction(propertyData);
    }
}
function train_Container_Update(data){
    console.log(data);
    var keys =Object.key(data);
    for(let i = 0; i< keys.length; i++){
        var items = data[keys];
        var key = Object.key(items);
        for(let i = 0; i < key.length; i++){
            console.log(items[key]);
        }
    }
    /*
        {?: 
            {
                'name': 'tet', 
                'training_options': '', 
                'training_conditions': '', 
                'description': 'easta', 
                'creat_date': '2023/09/27 14:12'
                'data_set: {'Count': {'data_set': '11111'}}
            }
        }
    */

    /*
    $('.train-container').append(`
            <div class="train_td">
                <div class="train-cell">${train[?][creat_date]}</div>
                <div class="train-cell">${train[?][name]}</div>
                <div class="train-cell">${train[?][data_set]}</div>
                <div class="train-cell">${train[?][training_options]}</div>
                <div class="train-cell">${train[?][training_conditions]}</div>
                <div class="train-cell">${train[?][description]}</div>
                <div class="train-cell">
                    <button type="button" class="btn btn-default" onclick="Train_start();">
                        <span class="glyphicon glyphicon-triangle-right"></span>
                    </button>
                    <button type="button" class="btn btn-default" onclick="train_View('edit', this);">
                        <span class="glyphicon glyphicon-pencil"></span>
                    </button>
                    <button type="button" class="btn btn-default" onclick="Train_Delete(this);">
                        <span class="glyphicon glyphicon-trash"></span>
                    </button>
                </div>
            </div>
            `)
    */
}
function data_Set_Update(data){
    console.log("data set update", data);
    for (let i = 0; i < data.length; i++) {
        const obj = data[i];
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const item = obj[key];
                const itemName = Object.keys(item)[0];
                const itemValue = item[itemName];
                // 테이블
                $(`.train_md_set_list`).append(`
                    <tr onclick="train_Dataset_Sub_View(this);" data-name="${key}" data-value="${itemValue}">
                        <td>${key}</td>
                        <td>${itemValue}</td>
                    </tr>
                `);
                //드랍 다운
                $(`#train_data_set_dropdown`).append(`
                    <option value="${itemValue}">${key}</option>
                `)

            }
        }
    }
}
function train_Options_Update(data){
    console.log("train options update",data);
    for (let i = 0; i < data.length; i++) {
        const obj = data[i];
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const item = obj[key];
                const itemName = Object.keys(item)[0];
                const itemValue = item[itemName];
                // 테이블
                $('.train_md_rule_list').append(`
                <tr onclick="train_options_sub_view(this); "data-value='${itemValue}' data-name='${key}'>
                    <td>${key}</td>
                    <td>${itemValue}</td>
                </tr>
                `);
                // 드롭다운
                $(`#train_options_dropdown`).append(`
                    <option value="${itemValue}">${key}</option>
                `)
            }
        }
    }
}
function train_Conditions_Update(data){
    console.log("train conditions update", data);
    for (let i = 0; i < data.length; i++) {
        const obj = data[i];
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const item = obj[key];
                const itemName = Object.keys(item)[0];
                const itemValue = item[itemName];
                // 테이블
                $('.train_md_order_list').append(`
                <tr onclick="Train_Conditions_Sub_View(this); "data-value='${itemValue}' data-name='${key}'>
                    <td>${key}</td>
                    <td>${itemValue}</td>
                </tr>
                `);
                // 드롭다운
                $(`#train_conditions_dropdown`).append(`
                    <option value="${itemValue}">${key}</option>
                `)
            }
        }
    }
}
function train_Update(){
    var data = {
        'work': 'train',
        'type': 'all'
    }; 

    hTrain.Get(data).then( (result) => {
        //업데이트시 기존 지워야 되는것들

        //학습 테이블 tr
        $('.train-container .train_td').remove();
        //학습 모달 드랍 다운들
        $('#train_data_set_dropdown').empty();
        $('#train_options_dropdown').empty();
        $('#train_conditions_dropdown').empty();
        //데이터셋 모달
        $('.train_md_set_list').empty();
        //학습 옵션 모달
        $('.train_md_rule_list').empty();
        //학습 조건 모달
        $('.train_md_order_list').empty();

        const dataContent = result['data'];
        console.log("get data", dataContent);
        // 'train' 속성 처리
        processProperty(dataContent['train'], train_Container_Update);
        // 'data_set' 속성 처리
        processProperty(dataContent['data_set'], data_Set_Update);
        // 'train_options' 속성 처리
        processProperty(dataContent['train_options'], train_Options_Update);
        // 'train_conditions' 속성 처리
        processProperty(dataContent['train_conditions'], train_Conditions_Update);
    });
}
/////

function class_Area_Input_Data(data){
    //태그에 알맞는 데이터 넣기
    console.log(data)
}
function class_Area_Input_Reset(){
    //class area_input
    var areaInputs = document.querySelectorAll('.area_input');
    // 학습 조건 추가 예정
    areaInputs.forEach(function (areaInput) {
        // <input> 요소 초기화 (빈 문자열로 설정)
        var inputElement = areaInput.querySelector('input');
        if (inputElement) {
            inputElement.value = '';
        }
    
        // <select> 요소 초기화 (첫 번째 옵션 선택)
        var selectElement = areaInput.querySelector('select');
        if (selectElement) {
            selectElement.selectedIndex = 0;
        }
    });

}

///// 모달 창 열기 /////
function Train_Dataset_Main_View(){
    console.log("Img set");
    $('#mdDataset').modal();
}
function train_Dataset_Sub_View(element) {
    console.log("Data set sub View");
    // 요소의 태그 이름을 가져옴
    var tagName = element.tagName.toLowerCase();
    if (tagName === 'button') {
        // 버튼으로 호출된 경우
        train_Modal_Data_Input__Area_Reset();
        train_Md_Data_Input_Area_Show_Button('train_md_path');
    } else if (tagName === 'tr') {
        // <tr>로 호출된 경우
        var dataValue = element.getAttribute('data-value');
        var dataName = element.getAttribute('data-name');
        modal_tab_Select_Input_Data(dataName, dataValue)
    }
    $(`#mdDataset_sub`).modal();
}
function Train_Options_Main_View(){
    console.log("Train rule");
    $('#mdTrainoptions').modal();
}
var train_md_json_add_edit;
function train_options_sub_view(element){
    train_md_json_add_edit = element;
    var tagName = element.tagName.toLowerCase();
    var editor = document.getElementById("train_editor");

    if(tagName === 'button'){
        // + 버튼
        // edit 영역 초기화
        //editor.innerText = "";
        editor.innerText = jsonString;
    }

    else if(tagName === 'tr'){
        // 편집(tr 버튼)
        var dataValue = element.getAttribute('data-value');
        editor.innerText =  dataValue;
    }
    $('#md_trainoptions_sub').modal();
}
function Train_Conditions_Main_View(){
    console.log("train order");
    $('#mdTrainconditions').modal();
}
function Train_Conditions_Sub_View(element){
    console.log("train order input");

    var tagName = element.tagName.toLowerCase();

    //+ 버튼
    if(tagName === 'button'){
        train_Md_Data_Input_Area_Show_Button('train_md_error_rate');
        train_Modal_Data_Input__Area_Reset();
    }
    // edit 버튼 
    else if(tagName === 'tr'){
    }

    $('#mdTrainconditions_sub').modal();

}
/////

function tabel_List_Append(button_id, append_list, type_name) {
    console.log("데이터셋 테이블 추가", button_id, append_list);

    // 선택된 input 요소의 id를 가져오기
    var selectElement = document.getElementById(button_id);

    var id = selectElement.value;

    // 선택된 id에 해당하는 input 요소의 값을 가져오기
    var inputValue = document.getElementById(id).querySelector('input').value;
    var name = document.getElementById(id).querySelector('label').textContent;
 
    $('#mdTrainconditions_sub').modal('hide');
    $('#mdDataset_sub').modal('hide');

    var data = {
        'work': 'train',
        'type': {
            [type_name]: {
                [name]: {
                    'data_set': inputValue,
                }
            }
        }
    }; 
    TrainAdd(data);
}

// 데이터 셋 입력 모달차의 버튼을 클릭하면 해당 하는 div 영역 보여주기 또는 숨기기
function train_Md_Data_Input_Area_Show_Button(id) {
    // 모든 영역을 숨깁니다.
    console.log("sub modal open",id);
    var allAreas = document.querySelectorAll('.form-group');
    allAreas.forEach(function (area) {
        area.style.display = "none";
    });

    // 해당 div_id 요소를 선택합니다.
    var div_id = "#" + id;
    var element = document.querySelector(div_id);

    // 선택한 요소를 보이도록 설정합니다.
    if (element) {
        element.style.display = "block";
        document.getElementById(id).disabled = true; // 해당 버튼 비활성화

        element.style.display = "flex";
    }
    var parentElement = element.parentElement.parentElement;
        if (parentElement && parentElement.children.length > 0) {
            var firstChild = parentElement.children[0];
            firstChild.value = id;
        }
}

// 임시 json 데이터
var jsonData = {
    "lot": "/data1-ai/datasets/raleigh/D3/test/good",
    "model_id": "MODEL_DRAEM_D3_230801",
    "recipe": "test_recipe"
};
var jsonString = JSON.stringify(jsonData, null, 4);

// train_editor json 편집기 텍스트를 새로 저장 or 업데이트
function json_Edit_Apply(){
    var tagName = train_md_json_add_edit.tagName.toLowerCase();
    var editor = document.getElementById('train_editor');
    var jsonText = editor.textContent;
    var formattedDate = moment().format('YYYY/MM/DD_HH:mm');
    try {
        var jsonData = JSON.parse(jsonText);
    } catch (error) {
        console.error("Error parsing JSON:", error);
    }

    if(tagName === 'button'){
        var data = {
            'work': 'train',
            'type': {
                'train_options': {
                    [formattedDate]: {
                        'training_options': jsonText,
                    }
                }
            }
        }; 
        TrainAdd(data);
    }
    else if(tagName === 'tr'){
        formattedDate = train_md_json_add_edit.querySelector('td:nth-child(1)');
        jsonText = train_md_json_add_edit.querySelector('td:nth-child(2)');
        second.innerText = editor.innerText;
        var data = {
            'work': 'train',
            'type': {
                'train_options': {
                    [formattedDate]: {
                        'training_options': jsonText,
                    }
                }
            }
        }; 
        TrainUpdate(data);
    }
    $('#md_trainoptions_sub').modal('hide');
}
function train_Modal_Reset(){
    // 데이터 셋 입력 탭 버튼 ,영역
    $('.train_md_set_list').empty();
    // "Path" 버튼 클릭
    train_Md_Data_Input_Area_Show_Button('train_md_path');

    train_Modal_Data_Input__Area_Reset();
    // 학습 옵션 입력 json edit 
    // 학습 조건 입력
    // 학습 지시
}

//
function modal_tab_Select_Input_Data(name, value) {
    console.log("데이터 셋 추가",name,value);
    // id, name 변경 필요 
    var button_name = name.toLowerCase();

    if(button_name =='과검률'){
        button_name == 'error_rate';
    }
    try {
        train_Md_Data_Input_Area_Show_Button('train_md_' + button_name);
    } catch (e) {
        console.log(e);
        button_name = 'path'; // 예외 발생 시 'path'로 설정
        train_Md_Data_Input_Area_Show_Button('train_md_' + button_name); // 'path'로 다시 시도
    }

    // 해당 input 요소 선택
    var inputSelector = '#train_md_' + button_name + ' input';
    var inputElement = document.querySelectorAll(inputSelector);

    // 모든 선택된 input 요소에 값을 설정
    inputElement.forEach(function (input) {
        input.value = value;
    });
}

function train_Modal_Data_Input__Area_Reset(){
    //data set 조건 선택, 입력값 제거
    var inputElements = document.querySelectorAll('.md_data_input_area input');
    inputElements.forEach(function (inputElement) {
        inputElement.value = ''; // 값 초기화
    });
}

const replacementRules = {
    'Name': 'Name',
    'Data Set': 'Data_set',
    '학습 옵션': 'Training_Options',
    '학습 조건': 'Trauning_Conditions',
    'Description': 'Description',
    '생성 날짜': 'Creat_Date'
};

function train_Modal_Open_Table_Append() {
    var formattedDate = moment().format('YYYY/MM/DD HH:mm');

    var formData = {};
    // 'mdTrain' 요소 내부에서 '.md_line' 클래스 요소들을 선택
    var mdLineElements = document.querySelectorAll('#mdTrain .md_line');

    mdLineElements.forEach(function (mdLineElement) {
        // 'label' 요소를 이름으로 사용 
        var labelElement = mdLineElement.querySelector('.area_name label');
        var originalFieldName = labelElement.textContent.trim();
        var fieldName = replacementRules[originalFieldName] || originalFieldName;
    
        // 'input' 또는 'select' 요소를 선택하여 값 추출
        var inputElement = mdLineElement.querySelector('.area_input input');
        var selectElement = mdLineElement.querySelector('.area_input select');
        var fieldValue = inputElement ? inputElement.value : selectElement.value;
    
        formData[fieldName] = fieldValue;
        //console.log(fieldName, fieldValue);
    });
    formData['Creat_Date'] = formattedDate;

    $('#mdTrain').modal('hide');
    console.log("add table" , formData);
    var data = {
        'work': 'train',
        'type': {
            'train': {
                [formData['Name']]: {
                    'name':formData['Name'],
                    'data_set': formData['Data_set'],
                    'training_options': formData['Training_Options'],
                    'training_conditions': formData['Trauning_Conditions'],
                    'description': formData['Description'],
                    'creat_date': formData['Creat_Date'],
                }
            }
        }
    };

    TrainAdd(data);
}

/////////////////////////////////////////
//Train


/////////////////////////////////////////
//Log
function LogInitial(){
    LogReset();
}

function LogReset() {
    $('#chkInfo').css('color', 'black');
    $('#chkDebug').css('color', 'black');
    $('#chkWarning').css('color', 'black');
    $('#chkError').css('color', 'black');
    $('#tbxLogKeyword').val('');

    let dt = new Date();
    let dt2 = new Date();
    dt2.setDate(dt.getDate() - 7);
    $('#logStart').val(moment(dt2).format('YYYY/MM/DD HH:mm'));
    $('#logEnd').val(moment(dt).format('YYYY/MM/DD HH:mm'));

    $('.dropdown-menu li input').prop("checked", true);
    SearchLog();
}

function SearchLog(pageno=0) {
    // Search Transaction Log
    $('#searchLog').prop("disabled",true);
    // 특수 문자 제외
    let pattern = /[`~!@#$%^&*|\[\]\\\'\";:\/?]/gi;
    if(pattern.test($('#tbxLogKeyword').val())){
        alert("특수문자는 검색 할 수 없습니다");
        $('#tbxLogKeyword').val("");
        $('#searchLog').prop("disabled",false);
        return;
    }

    var state = '';
    if ( $('#chkInfo').is(':checked') ) state += 'I';
    if ( $('#chkDebug').is(':checked') ) state += 'D';
    if ( $('#chkWarning').is(':checked') ) state += 'W';
    if ( $('#chkError').is(':checked') ) state += 'E';
    var s = $('#logStart').val().replaceAll('/', '').replaceAll(':', '').replaceAll(' ', '');
    var e = $('#logEnd').val().replaceAll('/', '').replaceAll(':', '').replaceAll(' ', '');
    var keyword = $('#tbxLogKeyword').val();
    var param = {
        'pageno': pageno,
        'state': state,
        'keyword': keyword,
        'period': s + '-' + e
    }
    //console.log(param);
    $('#logdata').empty();
    hLog.GetList(param)
    .then( (result) => {
        hLog.ShowList('tblLog', result['data'], keyword);
    }).catch( (result) => {
        if (result == 401) Logout();
    });
}

/////////////////////////////////////////
//Log 

function SetupMenu(sender) {
    var menu = document.getElementById("mnuMain");
    SetBackColor("Server", "")
    SetBackColor("Model", "")
    SetBackColor("Rule", "")
    SetBackColor("History", "")
    SetBackColor("Train","")
    SetBackColor("Log", "")
    SetBackColor(sender.id, "aliceblue")

    $('#pnlServer').hide()
    $('#pnlModel').hide()
    $('#pnlHistory').hide()
    $('#pnlRule').hide()
    $('#pnlLog').hide()
    $('#pnlTrain').hide()
    $('#pnl' + sender.id).show()
    if(sender.id == "Model") {
        ModelInitial();
    }
    else if (sender.id == "Rule") {
        RuleInitial();
    }
    else if (sender.id == "History"){
        HistoryInitial();
    }
    else if (sender.id == "Imgset"){
        ImgsetInitial();
    }
    else if (sender.id == "Train"){
        TrainInitial();
    }
    else if (sender.id == "Log"){
        LogInitial();
    }
}