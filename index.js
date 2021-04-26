//
// 自动化从 PeopleSoft - Wistron HR Online 截取请假资讯，并制作报表。
// 我想知道谁请了多少假？还剩多少假？這群懶散的東西！
//

'use strict';	// Whole-script strict mode applied.

const request0 = require('request');
//require('request-debug')(request0);
//require('request').debug = false;
const FileCookieStore = require('tough-cookie-filestore');
var j0;
var request;
const fs = require('fs');

(function() {
    fs.mkdir("./tmp", ()=>{
        fs.createWriteStream("./tmp/cookies.json").end("", ()=>{
            console.log("Rock and Roll");
            j0 = request0.jar(new FileCookieStore('tmp/cookies.json'));
            request = request0.defaults({
                jar : j0,
                forever: true,  //NOTE: Take effect?
                gzip: true,
                headers: {
                // NOTE: User-Agent must be specified or the following message responded.
                // Failed processing Browscap file. as it could be missing. Please contact your system adminstrator.
                'User-Agent': 'Alexander the great.'
                //'Accept-Encoding': 'gzip, deflate, br'
                }
            });
            //require('request-debug')(request);
            //require('request').debug = true;
            req1();
        });
    })
})();

// Get initial page
function req1() {
    request("https://hr.wistron.com/psp/PRD/?&cmd=login&languageCd=ZHS&", (error, response, body)=>{
        if (error) {
            console.error('r1 error:', error);
        } else {
            //bytesGot += body.length;
            // Buffer.byteLength(body) === response.headers['content-length']
            fs.createWriteStream('tmp/r1.html').end(body); //DEBUG
            dumpHeader(response, 'tmp/r1.txt');  //DEBUG
            req2(procR1(body));
        }
    })
}

//const http = require('http');
//const https = require('https');
//const querystring = require('querystring');

var bytesGot = 0;   // Statistics only for body
//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;  // May be latter.
//var baseUrl = "https://hr.wistron.com";

// DEBUG
function dumpHeader(rsp, fn) {
    let fo = fs.createWriteStream(fn);
    fo.write(`HTTP/${rsp.httpVersion} ${rsp.statusCode} ${rsp.statusMessage}\r\n`);
    let hdr = rsp.rawHeaders;
    for (let i=0; i < hdr.length; i+=2) {
        fo.write(`${hdr[i]}: ${hdr[i+1]}\r\n`);
    }
    fo.end();
}

// Process values from req1
function procR1(html) {
    let fi1 = { // form hidden input values
        "lcsrf_token": "",
        "timezoneOffset": "",
        "ptmode": "",
        "ptlangcd": "",
        "ptinstalledlang": ""
    };
    let fx1 = { // form fixed values
        "userid": "8106062", //NOTE: user input?
        "pwd": "2211indePp", //NOTE: user input?
        "ptlangsel": "ZHS",
        "Submit": "登录"
    };
    for (let key in fi1) {
        let pat = new RegExp(`<input .*?name="${key}".*?value="(.*?)"`);
        let m = pat.exec(html);
        if (m) {
            fi1[key] = m[1];
        }
    }
    const fv1 = Object.assign({}, fi1, fx1);
    return fv1;
}

// Process values from req7
function procR7(html) {
    let fi1 = { // form hidden/text input values
        "ICType": "",
        "ICElementNum": "",
        "ICStateNum": "",
        "ICAction": "",
        "ICModelCancel": "",
        "ICXPos": "",
        "ICYPos": "",
        "ResponsetoDiffFrame": "",
        "TargetFrameName": "",
        "FacetPath": "",
        "ICFocus": "",
        "ICSaveWarningFilter": "",
        "ICChanged": "",
        "ICSkipPending": "",
        "ICAutoSave": "",
        "ICResubmit": "",
        "ICSID": "",
        "ICActionPrompt": "",
        "ICTypeAheadID": "",
        "ICBcDomData": "",  // ????
        "ICPanelName": "",
        "ICFind": "",
        "ICAddCount": "",
        "ICAppClsData": "",
        //"HR_DR_GROUP_VW$hnewpers$0": "",
        "DERIVED_HR_DR_ASOFDATE": ""    // type='text' value="..."
    };
    let fx1 = { // form fixed values
        "ICAJAX": "1",
        "ICNAVTYPEDROPDOWN": "1",   //NOTE: sometimes 0
        "DERIVED_HR_DR_EMPL_RCD": "0"   // <select name='DERIVED_HR_DR_EMPL_RCD' ...>
    };
    for (let key in fi1) {
        let pat = new RegExp(`<input.*?name='${key}'.*?value=['|"](.*?)['|"]`);
        let m = pat.exec(html);
        if (m) {
            fi1[key] = m[1];
        }
    }
    // Annoying $
    let pat = /<input.*?name='HR_DR_GROUP_VW\$hnewpers\$0'.*?value='(.*?)'/;
    let m = pat.exec(html);
    if (m) {
        fi1["HR_DR_GROUP_VW$hnewpers$0"] = m[1];
    }
    //console.log(fi1);
    // ICBcDomData 没有也可以 ?
    fi1["ICBcDomData"] = "C~HC_GP_ABS_MGRSS_HIST_GBL~EMPLOYEE~HRMS~ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL~UnknownValue~请假记录查询~UnknownValue~UnknownValue~https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL~UnknownValue*F~HC_VIEW_TIME_MGR~EMPLOYEE~HRMS~UnknownValue~UnknownValue~部属申请记录查询~UnknownValue~UnknownValue~https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/s/WEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME?pt_fname=HC_VIEW_TIME_MGR&c=nT2qZk55zeTkVdGCn7%2fwqZ7uQ1R71R0f&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR&IsFolder=true~UnknownValue*F~HC_TIME_MANAGEMENT~EMPLOYEE~HRMS~UnknownValue~UnknownValue~考勤管理~UnknownValue~UnknownValue~https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/s/WEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME?pt_fname=HC_TIME_MANAGEMENT&c=nT2qZk55zeTkVdGCn7%2fwqZ7uQ1R71R0f&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT&IsFolder=true~UnknownValue*F~CO_MANAGER_SELF_SERVICE~EMPLOYEE~HRMS~UnknownValue~UnknownValue~经理自助服务~UnknownValue~UnknownValue~https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/s/WEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME?pt_fname=CO_MANAGER_SELF_SERVICE&c=nT2qZk55zeTkVdGCn7%2fwqZ7uQ1R71R0f&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE&IsFolder=true~UnknownValue";
    const fv1 = Object.assign({}, fi1, fx1);
    return fv1;
}

// HTTP POST to login
function req2(fv) {
    request.post("https://hr.wistron.com/psp/PRD/?&cmd=login&languageCd=ZHS&", {followAllRedirects:true, form:fv}, (error, response, body)=>{
        if (error) {
            console.error('r2 error:', error); // Print the error if one occurred
        } else {
            fs.createWriteStream('tmp/r2.html').end(body); //DEBUG
            dumpHeader(response, 'tmp/r2.txt');  //DEBUG
            //req3();
            req5();
            //req7();
        }
    });
}

function parseForm(body) {
    let fv = {};
    let html = body;
    while (true) {
        let rxp = /<input type='(hidden|text)' name='(.*?)' .*?value=['|"](.*?)['|"]/sg;
        let m = rxp.exec(html);
        if (m) {
            fv[m[2]] = m[3];
            html = html.substr(rxp.lastIndex);
        } else {
            break;
        }
    }
    //console.log("parseForm before", fv);
    fv["ICAJAX"] = "1";
    fv["ICNAVTYPEDROPDOWN"] = "1";   //NOTE: sometimes 0
    fv["ICBcDomData"] = "C~HC_GP_ABS_MGRSS_HIST_GBL~EMPLOYEE~HRMS~ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL~UnknownValue~请假记录查询~UnknownValue~UnknownValue~https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL~UnknownValue*F~HC_VIEW_TIME_MGR~EMPLOYEE~HRMS~UnknownValue~UnknownValue~部属申请记录查询~UnknownValue~UnknownValue~https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/s/WEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME?pt_fname=HC_VIEW_TIME_MGR&c=nT2qZk55zeTkVdGCn7%2fwqZ7uQ1R71R0f&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR&IsFolder=true~UnknownValue*F~HC_TIME_MANAGEMENT~EMPLOYEE~HRMS~UnknownValue~UnknownValue~考勤管理~UnknownValue~UnknownValue~https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/s/WEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME?pt_fname=HC_TIME_MANAGEMENT&c=nT2qZk55zeTkVdGCn7%2fwqZ7uQ1R71R0f&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT&IsFolder=true~UnknownValue*F~CO_MANAGER_SELF_SERVICE~EMPLOYEE~HRMS~UnknownValue~UnknownValue~经理自助服务~UnknownValue~UnknownValue~https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/s/WEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME?pt_fname=CO_MANAGER_SELF_SERVICE&c=nT2qZk55zeTkVdGCn7%2fwqZ7uQ1R71R0f&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE&IsFolder=true~UnknownValue";
    //console.log("parseForm after", fv);
    return fv;
}

// 下一项
//NOTE: should share code with getLeaveHistory
function nextLeaveHistory(fv, id, name, seq) {
    return new Promise((resolve, reject) => {
        fv["ICAction"] = "GP_ABSHISTSS_VW$hdown$0";
        console.log("nextLeaveHistory: ICStateNum", fv["ICStateNum"]);    //DEBUG
        request.post("https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL", {form:fv}, (error, response, body)=>{
            if (error) {
                console.error('r11 error:', error);
                reject(error);
            } else {
                fs.createWriteStream(`tmp/leave-${id}_${name}${seq}.html`).end(body); //DEBUG
                dumpHeader(response, `tmp/leave-${id}_${name}${seq}.txt`);  //DEBUG
                const fv1 = parseForm(body);
                let rxp = RegExp("<span class='PSGRIDCOUNTER' >(.*?)-(.*?)/(.*?)</span>");
                let m = rxp.exec(body);
                if (m) {
                    if ( m[2] === m[3] ) {
                        resolve({next: false, fv:fv1});  // finished!
                    } else {
                        resolve({next: true, fv:fv1});
                    }
                } else {
                    console.error("Counters not found.");
                    resolve({next: false, fv:fv1});  // finished!
                }
            }
        });
    });
}

// HTTP POST to get leave history since 2020
function getLeaveHistory(fv, id, name) {
    return new Promise((resolve, reject) => {
        fv["ICAction"] = "DERIVED_ABS_SS_SRCH_BTN";
        fv["DERIVED_ABS_SS_BGN_DT"] = "01/01/2020";
        //fv["DERIVED_ABS_SS_END_DT"] = "12/31/2021";
        console.log("getLeaveHistory: ICStateNum", fv["ICStateNum"]);    //DEBUG
        request.post("https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL", {form:fv}, (error, response, body)=>{
            if (error) {
                console.error('r10 error:', error);
                reject(error);
            } else {
                fs.createWriteStream(`tmp/leave-${id}_${name}0.html`).end(body); //DEBUG
                dumpHeader(response, `tmp/leave-${id}_${name}0.txt`);  //DEBUG
                const fv1 = parseForm(body);
                let rxp = RegExp("<span class='PSGRIDCOUNTER' >(.*?)-(.*?)/(.*?)</span>");
                let m = rxp.exec(body);
                if (m) {
                    if ( m[2] === m[3] ) {
                        resolve({next: false, fv:fv1});  // finished!
                    } else {
                        resolve({next: true, fv:fv1});
                    }
                } else {
                    console.error("Counters not found.");
                    resolve({next: false, fv:fv1});  // finished!
                }
            }
        });
    });
}

// HTTP POST to get leave history
function InitLeaveHistory(fv, id, name) {
    return new Promise((resolve, reject) => {
        console.log(`get leave history of ${id}_${name}`);  //DEBUG
        console.log("InitLeaveHistory: ICStateNum", fv["ICStateNum"]);    //DEBUG
        fv["ICAction"] = "SELECT_EMPLOYEE$" + id;
        //fv["DERIVED_ABS_SS_BGN_DT"] = "01/01/2020"; // useless
        //require('request-debug')(request);
        //require('request').debug = true;
        if (name === "刘诗倩 (ANNE SQ LIU)") {
            console.log("刘诗倩 (ANNE SQ LIU)", fv);
        }
        request.post("https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL", {form:fv}, (error, response, body)=>{
            if (error) {
                console.error('r9 error:', error);
                reject(error);
            } else {
                fs.createWriteStream(`tmp/leave-${id}_${name}.html`).end(body); //DEBUG
                dumpHeader(response, `tmp/leave-${id}_${name}.txt`);  //DEBUG
                resolve(parseForm(body));
            }
        });
    });
}

function refreshReq7(id) {
    return new Promise((resolve, reject) => {
        request(urlReq7, (error, response, body)=>{
            if (error) {
                console.error('r7 error:', error);
                reject(error);
            } else {
                dumpHeader(response, `tmp/r7-${id}.txt`);
                fs.createWriteStream(`tmp/r7-${id}.html`).end(body);
                resolve(procR7(body));
            }
        });
    })
}

function getSubSub(fv, lid, cnt) {
    return new Promise((resolve, reject) => {
        console.log(`getSubs of ${lid}`);  //DEBUG
        console.log("getSubs: ICStateNum", fv["ICStateNum"]);    //DEBUG
        fv["ICAction"] = `#ICSetFieldHR_DR_DIRECTREPORT.EXPCOLLCONTROL.${lid}`;
        // referer: "https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PORTALPARAM_PTCNAV=HC_GP_ABS_MGRSS_HIST_GBL&EOPP.SCNode=HRMS&EOPP.SCPortal=EMPLOYEE&EOPP.SCName=ADMN_MANAGER_REVIEWS&EOPP.SCLabel=部属申请记录查询&EOPP.SCFName=ADMN_F201512302128141443830683&EOPP.SCSecondary=true&EOPP.SCPTcname=PT_PTPP_SCFNAV_BASEPAGE_SCR&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR.HC_GP_ABS_MGRSS_HIST_GBL&IsFolder=false&PortalActualURL=https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PortalContentURL=https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PortalContentProvider=HRMS&PortalCRefLabel=请假记录查询&PortalRegistryName=EMPLOYEE&PortalServletURI=https://hr.wistron.com/psp/PRD/&PortalURI=https://hr.wistron.com/psc/PRD/&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes"
        request.post("https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL", {form:fv}, (error, response, body)=>{
            if (error) {
                console.error('getSubs error:', error);
                reject(error);
            } else {
                fs.createWriteStream(`tmp/subs-${lid}_${cnt}.html`).end(body); //DEBUG
                dumpHeader(response, `tmp/subs-${lid}_${cnt}.txt`);  //DEBUG
                resolve(body);
            }
        });
    })
}

async function getSubSubLeaveHistory(fv, fv2, lid) {
    let cnt = 1;
    let html = await getSubSub(fv2, lid, cnt);
    let subsubs = parseSubSub(html);
    console.log(subsubs);
    fv2 = procR7(html);
    for (let i = 0; i < subsubs.length; i++) {
        if (cnt>1) {
            let html = await getSubSub(fv2, lid, cnt);
            //let subsubs2 = parseSubSub(html);
            // compare subsubs2 and subsubs. Should be identical.
            fv2 = procR7(html);
        }
        if ( fv2["ICStateNum"] ) {
            console.log("WTF! yes ICStateNum", fv2);
        } else {
            Object.assign(fv2, fv);
            let rxp = /oDoc.win0.ICStateNum.value=(.*?);/;
            let m = rxp.exec(html);
            if (m) {
                fv2["ICStateNum"] = m[1];
            }
            //console.log("WTF!", fv2);
            //process.exit(1);
        }
        const fv23 = await InitLeaveHistory(fv2, subsubs[i].id, subsubs[i].name);
        fv2 = await goBack(fv23);
        if (subsubs[i].name==="胡栩搴 (XUQIAN HU)") {
            console.log("After subsub", fv2);
        }
        cnt++;
    }
    return fv2;
}

// Get leave history of all members
async function req8(fv, members) {
    let fv2 = Object.assign({}, fv);
    for (let i=0; i < members.length; i++) { // members.length
        fv2 = await InitLeaveHistory(fv2, members[i].id, members[i].name);
        //console.log(fv2);
        /**
        let rst = await getLeaveHistory(fv2, members[i].id, members[i].name);
        if (rst.next) {
            let seq = 1;
            while (true) {
                rst = await nextLeaveHistory(rst.fv, members[i].id, members[i].name, seq);
                if (rst.next) {
                    seq ++;
                } else {
                    break;
                }
            }
        }
        */
        /*
        for (const k in fv) {
            if ( rst.fv[k] ) {
                fv[k] = rst.fv[k];
            }
        }
        */
        //const fv7 = await refreshReq7(members[i].id);
        fv2 = await goBack(fv2);
    }
    for (let i=0; i < members.length; i++) {
        if ( members[i].leader ) {
            fv2 = getSubSubLeaveHistory(fv, fv2, members[i].leader);
        }
    }
    return fv;
}

async function getAllMembers(fv, members) {
    for (let i=0; i < members.length; i++) {
        if ( members[i].type === "Leader" ) {
            const fv2 = await getSubs(fv, members[i].id, members[i].name);
            //fv = fv2;
            const fv7 = await refreshReq7(parseInt(members[i].id)+10);
            fv = fv7;
        }
    }
}

function getSubs(fv, id, name) {
    return new Promise((resolve, reject) => {
        console.log(`get subs of ${id}_${name}`);  //DEBUG
        console.log("getSubs: ICStateNum", fv["ICStateNum"]);    //DEBUG
        fv["ICAction"] = `#ICSetFieldHR_DR_DIRECTREPORT.EXPCOLLCONTROL.${parseInt(id)+1}`;    // Leader's id + 1
        // referer: "https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PORTALPARAM_PTCNAV=HC_GP_ABS_MGRSS_HIST_GBL&EOPP.SCNode=HRMS&EOPP.SCPortal=EMPLOYEE&EOPP.SCName=ADMN_MANAGER_REVIEWS&EOPP.SCLabel=部属申请记录查询&EOPP.SCFName=ADMN_F201512302128141443830683&EOPP.SCSecondary=true&EOPP.SCPTcname=PT_PTPP_SCFNAV_BASEPAGE_SCR&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR.HC_GP_ABS_MGRSS_HIST_GBL&IsFolder=false&PortalActualURL=https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PortalContentURL=https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PortalContentProvider=HRMS&PortalCRefLabel=请假记录查询&PortalRegistryName=EMPLOYEE&PortalServletURI=https://hr.wistron.com/psp/PRD/&PortalURI=https://hr.wistron.com/psc/PRD/&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes"
        request.post("https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL", {form:fv}, (error, response, body)=>{
            if (error) {
                console.error('getSubs error:', error);
                reject(error);
            } else {
                fs.createWriteStream(`tmp/subs${id}.html`).end(body); //DEBUG
                dumpHeader(response, `tmp/subs${id}.txt`);  //DEBUG
                let html = body;
                // Assumption: they don't have sub leaders.
                while (true) {
                    let rxp = /<tr id='trSINGLE_SELECT_GRID.*?<\/tr>/sg;
                    // action name eid role did
                    // action 名称 员工ID 职务 部门ID
                    let m0 = rxp.exec(html);
                    if (m0) {
                        let rxp2 = /<input type='button' .*?id='(.*?)'.*?<div style='margin-left:49px;padding-top:2px;padding-left:0'><span class='PSEDITBOX_DISPONLY' >(.*?)<\/span><\/div>.*?<span    class='PSEDITBOX_DISPONLY'.*?>(.*?)<\/span>.*?<span    class='PSEDITBOX_DISPONLY'.*?>(.*?)<\/span>.*?<span    class='PSEDITBOX_DISPONLY'.*?>(.*?)<\/span>/s;
                        let m = rxp2.exec(m0[0]);
                        if (m) {
                            console.log(`${m[1]} ${m[2]} ${m[3]} ${m[4]} ${m[5]}`);
                        }
                        html = html.substr(rxp.lastIndex);
                    } else {
                        break;
                    }
                }
                resolve(procR7(body));
            }
        });
    })
}

function goBack(fv) {
    return new Promise((resolve, reject) => {
        console.log("goBack: ICStateNum", fv["ICStateNum"]);    //DEBUG
        fv["ICAction"] = "DERIVED_ABS_SS_BACK";
        // referer:  "https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PORTALPARAM_PTCNAV=HC_GP_ABS_MGRSS_HIST_GBL&EOPP.SCNode=HRMS&EOPP.SCPortal=EMPLOYEE&EOPP.SCName=ADMN_MANAGER_REVIEWS&EOPP.SCLabel=部属申请记录查询&EOPP.SCFName=ADMN_F201512302128141443830683&EOPP.SCSecondary=true&EOPP.SCPTcname=PT_PTPP_SCFNAV_BASEPAGE_SCR&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR.HC_GP_ABS_MGRSS_HIST_GBL&IsFolder=false&PortalActualURL=https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PortalContentURL=https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PortalContentProvider=HRMS&PortalCRefLabel=请假记录查询&PortalRegistryName=EMPLOYEE&PortalServletURI=https://hr.wistron.com/psp/PRD/&PortalURI=https://hr.wistron.com/psc/PRD/&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes"
        request.post("https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL", {form:fv}, (error, response, body)=>{
            if (error) {
                console.error('goBack error:', error);
                reject(error);
            } else {
                fs.createWriteStream(`tmp/goBack${fv["ICStateNum"]}.xml`).end(body); //DEBUG
                dumpHeader(response, `tmp/goBack${fv["ICStateNum"]}.txt`);  //DEBUG
                let rxp = /\<\!\[CDATA\[document.location='(.*?)'/;
                let m = rxp.exec(body);
                if (m) {
                    // Should be 'https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?Page=GP_ABS_SSCREQHIST&Action=A'
                    request(m[1], (error, response, body) => {
                        if (error) {
                            reject(error);
                        } else {
                            fs.createWriteStream(`tmp/goBack${fv["ICStateNum"]}.html`).end(body); //DEBUG
                            resolve(procR7(body));
                        }
                    });
                } else {
                    reject("shit!");
                }
            }
        });
    })
}

function parseSub(html) {
    let sub = [];
    while (true) {
        let rxp = /<tr id='trSINGLE_SELECT_GRID.*?<\/tr>/sg;
        let m = rxp.exec(html);
        if (m) {
            // ID LeaderID 名称 员工ID 职务(seems useless) 部门ID
            let rxpL = new RegExp("<DIV    id='win0divSELECT_EMPLOYEE\\$(.*?)'>.*?'#ICSetFieldHR_DR_DIRECTREPORT.EXPCOLLCONTROL.(.*?)'.*?<span class='PABOLDTEXT' >(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>", "s");
            let z = rxpL.exec(m[0]);
            if (z) {
                sub.push({leader:z[2], id:z[1], name:z[3], eid:z[4], did:z[6]});
            } else {
                // ID 名称 员工ID 职务(seems useless) 部门ID
                let rxpM = new RegExp("<DIV    id='win0divSELECT_EMPLOYEE\\$(.*?)'>.*?<span class='PSEDITBOX_DISPONLY' >(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>", "s");
                let z = rxpM.exec(m[0]);
                if (z) {
                    sub.push({id:z[1], name:z[2], eid:z[3], did:z[5]});
                }
            }
            html = html.substr(rxp.lastIndex);
        } else {
            break;
        }
    }
    return sub;
}

function parseSubSub(html) {
    let sub = [];
    // Assumption: my direct subs don't have sub leaders.
    while (true) {
        let rxp = /<tr id='trSINGLE_SELECT_GRID.*?<\/tr>/sg;
        let m = rxp.exec(html);
        if (m) {
            // ID 名称 员工ID 职务(seems useless) 部门ID
            let rxp2 = /<input type='button' .*?id='SELECT_EMPLOYEE\$(.*?)'.*?<div style='margin-left:49px;padding-top:2px;padding-left:0'><span class='PSEDITBOX_DISPONLY' >(.*?)<\/span><\/div>.*?<span    class='PSEDITBOX_DISPONLY'.*?>(.*?)<\/span>.*?<span    class='PSEDITBOX_DISPONLY'.*?>(.*?)<\/span>.*?<span    class='PSEDITBOX_DISPONLY'.*?>(.*?)<\/span>/s;
            let z = rxp2.exec(m[0]);
            if (z) {
                sub.push({id:z[1], name:z[2], eid:z[3], did:z[5]});
            }
            html = html.substr(rxp.lastIndex);
        } else {
            break;
        }
    }
    return sub;
}

//const urlReq7  = "https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PORTALPARAM_PTCNAV=HC_GP_ABS_MGRSS_HIST_GBL&EOPP.SCNode=HRMS&EOPP.SCPortal=EMPLOYEE&EOPP.SCName=ADMN_MANAGER_REVIEWS&EOPP.SCLabel=%e9%83%a8%e5%b1%9e%e7%94%b3%e8%af%b7%e8%ae%b0%e5%bd%95%e6%9f%a5%e8%af%a2&EOPP.SCFName=ADMN_F201512302128141443830683&EOPP.SCSecondary=true&EOPP.SCPTcname=PT_PTPP_SCFNAV_BASEPAGE_SCR&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR.HC_GP_ABS_MGRSS_HIST_GBL&IsFolder=false";
const urlReq7 =    "https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PORTALPARAM_PTCNAV=HC_GP_ABS_MGRSS_HIST_GBL&EOPP.SCNode=HRMS&EOPP.SCPortal=EMPLOYEE&EOPP.SCName=ADMN_MANAGER_REVIEWS&EOPP.SCLabel=%e9%83%a8%e5%b1%9e%e7%94%b3%e8%af%b7%e8%ae%b0%e5%bd%95%e6%9f%a5%e8%af%a2&EOPP.SCFName=ADMN_F201512302128141443830683&EOPP.SCSecondary=true&EOPP.SCPTcname=PT_PTPP_SCFNAV_BASEPAGE_SCR&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR.HC_GP_ABS_MGRSS_HIST_GBL&IsFolder=false&PortalActualURL=https%3a%2f%2fhr.wistron.com%2fpsc%2fPRD%2fEMPLOYEE%2fHRMS%2fc%2fROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL%3fNAVSTACK%3dClear&PortalContentURL=https%3a%2f%2fhr.wistron.com%2fpsc%2fPRD%2fEMPLOYEE%2fHRMS%2fc%2fROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL%3fNAVSTACK%3dClear&PortalContentProvider=HRMS&PortalCRefLabel=%e8%af%b7%e5%81%87%e8%ae%b0%e5%bd%95%e6%9f%a5%e8%af%a2&PortalRegistryName=EMPLOYEE&PortalServletURI=https%3a%2f%2fhr.wistron.com%2fpsp%2fPRD%2f&PortalURI=https%3a%2f%2fhr.wistron.com%2fpsc%2fPRD%2f&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes";
//              = "https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PORTALPARAM_PTCNAV=HC_GP_ABS_MGRSS_HIST_GBL&EOPP.SCNode=HRMS&EOPP.SCPortal=EMPLOYEE&EOPP.SCName=ADMN_MANAGER_REVIEWS&EOPP.SCLabel=部属申请记录查询&EOPP.SCFName=ADMN_F201512302128141443830683&EOPP.SCSecondary=true&EOPP.SCPTcname=PT_PTPP_SCFNAV_BASEPAGE_SCR&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR.HC_GP_ABS_MGRSS_HIST_GBL&IsFolder=false&PortalActualURL=https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PortalContentURL=https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PortalContentProvider=HRMS&PortalCRefLabel=请假记录查询&PortalRegistryName=EMPLOYEE&PortalServletURI=https://hr.wistron.com/psp/PRD/&PortalURI=https://hr.wistron.com/psc/PRD/&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes";

// 主管自助服务 - 部属申请记录查询 - 请假记录查询 - 直接报告者用户界面
function req7() {
    request(urlReq7, async (error, response, body) => {
        if (error) {
            console.error('r7 error:', error);
        } else {
            fs.createWriteStream('tmp/r7.html').end(body);
            dumpHeader(response, 'tmp/r7.txt');
            let 直接报告者 = parseSub(body);
            console.log("黃世勇 (ALEX HUANG) 的员工: ", 直接报告者);
            let fv = procR7(body);
            fv = await req8(fv, 直接报告者);
            //await getAllMembers(fv, 直接报告者);
            console.log("All done.");
        }
    });
}


// Got to 主管自助服务
function req3() {
    request("https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/h/?tab=Z_RC_TAB_MSS", (error, response, body)=>{
        if (error) {
            console.error('r3 error:', error); // Print the error if one occurred
        } else {
            fs.createWriteStream('tmp/r3.html').end(body); //DEBUG
            dumpHeader(response, 'tmp/r3-hdr.txt');  //DEBUG
            req4();
        }
    });
}

// 主管自助服务 - 部属申请记录查询
function req4() {
    request("https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/s/WEBLIB_PTPP_SC.HOMEPAGE.FieldFormula.IScript_AppHP?scname=ADMN_MANAGER_REVIEWS&secondary=true&fname=ADMN_F201512302128141443830683&FolderPath=PORTAL_ROOT_OBJECT.PORTAL_BASE_DATA.CO_NAVIGATION_COLLECTIONS.ADMN_MANAGER_REVIEWS.ADMN_F201512302127315039216284.ADMN_F201512302128141443830683&IsFolder=true&PORTALPARAM_PTCNAV=PT_PTPP_SCFNAV_BASEPAGE_SCR", (error, response, body)=>{
        if (error) {
            console.error('r4 error:', error); // Print the error if one occurred
        } else {
            fs.createWriteStream('tmp/r4.html').end(body); //DEBUG
            dumpHeader(response, 'tmp/r4-hdr.txt');  //DEBUG
            //req5();
            //req6();
        }
    });
}

// 主管自助服务 - 部属申请记录查询 - 请假记录查询
// seems to be intermediate
function req5() {
    request("https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PORTALPARAM_PTCNAV=HC_GP_ABS_MGRSS_HIST_GBL&EOPP.SCNode=HRMS&EOPP.SCPortal=EMPLOYEE&EOPP.SCName=ADMN_MANAGER_REVIEWS&EOPP.SCLabel=%e9%83%a8%e5%b1%9e%e7%94%b3%e8%af%b7%e8%ae%b0%e5%bd%95%e6%9f%a5%e8%af%a2&EOPP.SCFName=ADMN_F201512302128141443830683&EOPP.SCSecondary=true&EOPP.SCPTcname=PT_PTPP_SCFNAV_BASEPAGE_SCR&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR.HC_GP_ABS_MGRSS_HIST_GBL&IsFolder=false", (error, response, body)=>{
        if (error) {
            console.error('r5 error:', error); // Print the error if one occurred
        } else {
            dumpHeader(response, 'tmp/r5.txt');  //DEBUG
            fs.createWriteStream('tmp/r5.html').end(body); //DEBUG
            let rxp = new RegExp('<iframe id="ptifrmtgtframe".*? src="(.*?)"></iframe>');
            let m = rxp.exec(body);
            if (m) {
                //console.log('直接报告者用户界面 iframe', m[1]);   //DEBUG
                req7(m[1]);
            }
        }
    });
}

// 主管自助服务 - 部属申请记录查询 - 假勤结余查询
function req6() {
    request("https://hr.wistron.com/psp/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_BAL.GBL?NAVSTACK=Clear&PORTALPARAM_PTCNAV=HC_GP_ABS_MGRSS_BAL_GBL&EOPP.SCNode=HRMS&EOPP.SCPortal=EMPLOYEE&EOPP.SCName=ADMN_MANAGER_REVIEWS&EOPP.SCLabel=%e9%83%a8%e5%b1%9e%e7%94%b3%e8%af%b7%e8%ae%b0%e5%bd%95%e6%9f%a5%e8%af%a2&EOPP.SCFName=ADMN_F201512302128141443830683&EOPP.SCSecondary=true&EOPP.SCPTcname=PT_PTPP_SCFNAV_BASEPAGE_SCR&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR.HC_GP_ABS_MGRSS_BAL_GBL&IsFolder=false", (error, response, body)=>{
        if (error) {
            console.error('r6 error:', error); // Print the error if one occurred
        } else {
            fs.createWriteStream('tmp/r6.html').end(body); //DEBUG
            dumpHeader(response, 'tmp/r6-hdr.txt');  //DEBUG
        }
    });
}
