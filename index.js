//
// 自动化从 PeopleSoft - Wistron HR Online 截取请假资讯，并制作报表。
// 我想知道谁请了多少假？还剩多少假？這群懶散的東西！
//

'use strict';	// Whole-script strict mode applied.

const request0 = require('request');
//require('request-debug')(request0);
//require('request').debug = false;

const FileCookieStore = require('tough-cookie-filestore');
const j0 = request0.jar(new FileCookieStore('tmp/cookies.json')); // NOTE: 'cookies.json' file must already exist!
const request = request0.defaults({ jar : j0, headers: {
    // NOTE: User-Agent must be specified or the following message responded.
    // Failed processing Browscap file. as it could be missing. Please contact your system adminstrator.
    'User-Agent': 'Alexander the great.'
}});

// Get initial page
function req1() {
    request("https://hr.wistron.com/psp/PRD/?&cmd=login&languageCd=ZHS&", (error, response, body)=>{
        if (error) {
            console.error('r1 error:', error); // Print the error if one occurred
        } else {
            //console.log('r1 statusCode:', response && response.statusCode); // Print the response status code if a response was received
            fs.createWriteStream('tmp/r1.html').end(body); //DEBUG
            dumpHeader(response, 'tmp/r1-hdr.txt');  //DEBUG
            req2(procR1(body));
        }
    })
}

//const http = require('http');
//const https = require('https');
const fs = require('fs');
//const querystring = require('querystring');

var bytesGot = 0;   // Statistics
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
        "ICNAVTYPEDROPDOWN": "1",
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
        //console.log('yeah!', m[0], m[1]);
        fi1["HR_DR_GROUP_VW$hnewpers$0"] = m[1];
    }
    console.log(fi1);
    fi1["ICAction"] = "SELECT_EMPLOYEE$3";    // Pony
    // ICBcDomData 没有也可以 ?
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
            dumpHeader(response, 'tmp/r2-hdr.txt');  //DEBUG
            //req3();
            //req5();
            req7();
        }
    });
}

// HTTP POST to get data
function req8(fv) {
    /*
    let fd = "ICAJAX=1&ICNAVTYPEDROPDOWN=1&ICType=Panel&ICElementNum=0&ICStateNum=1&ICAction=SELECT_EMPLOYEE%240&ICModelCancel=0&ICXPos=0&ICYPos=0&ResponsetoDiffFrame=-1&TargetFrameName=None&FacetPath=None&ICFocus=&ICSaveWarningFilter=0&ICChanged=-1&ICSkipPending=0&ICAutoSave=0&ICResubmit=0&ICSID=2znVWanXhPm0UnZ9HDa9khgmLLWUZIK0y7rCAlOWdx0%3D&ICActionPrompt=false&ICTypeAheadID=&ICBcDomData=C~HC_GP_ABS_MGRSS_HIST_GBL~EMPLOYEE~HRMS~ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL~UnknownValue~%E8%AF%B7%E5%81%87%E8%AE%B0%E5%BD%95%E6%9F%A5%E8%AF%A2~UnknownValue~UnknownValue~https%3A%2F%2Fhr.wistron.com%2Fpsp%2FPRD%2FEMPLOYEE%2FHRMS%2Fc%2FROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL~UnknownValue*F~HC_VIEW_TIME_MGR~EMPLOYEE~HRMS~UnknownValue~UnknownValue~%E9%83%A8%E5%B1%9E%E7%94%B3%E8%AF%B7%E8%AE%B0%E5%BD%95%E6%9F%A5%E8%AF%A2~UnknownValue~UnknownValue~https%3A%2F%2Fhr.wistron.com%2Fpsp%2FPRD%2FEMPLOYEE%2FHRMS%2Fs%2FWEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME%3Fpt_fname%3DHC_VIEW_TIME_MGR%26c%3DnT2qZk55zeTkVdGCn7%252fwqZ7uQ1R71R0f%26FolderPath%3DPORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR%26IsFolder%3Dtrue~UnknownValue*F~HC_TIME_MANAGEMENT~EMPLOYEE~HRMS~UnknownValue~UnknownValue~%E8%80%83%E5%8B%A4%E7%AE%A1%E7%90%86~UnknownValue~UnknownValue~https%3A%2F%2Fhr.wistron.com%2Fpsp%2FPRD%2FEMPLOYEE%2FHRMS%2Fs%2FWEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME%3Fpt_fname%3DHC_TIME_MANAGEMENT%26c%3DnT2qZk55zeTkVdGCn7%252fwqZ7uQ1R71R0f%26FolderPath%3DPORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT%26IsFolder%3Dtrue~UnknownValue*F~CO_MANAGER_SELF_SERVICE~EMPLOYEE~HRMS~UnknownValue~UnknownValue~%E7%BB%8F%E7%90%86%E8%87%AA%E5%8A%A9%E6%9C%8D%E5%8A%A1~UnknownValue~UnknownValue~https%3A%2F%2Fhr.wistron.com%2Fpsp%2FPRD%2FEMPLOYEE%2FHRMS%2Fs%2FWEBLIB_PT_NAV.ISCRIPT1.FieldFormula.IScript_PT_NAV_INFRAME%3Fpt_fname%3DCO_MANAGER_SELF_SERVICE%26c%3DnT2qZk55zeTkVdGCn7%252fwqZ7uQ1R71R0f%26FolderPath%3DPORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE%26IsFolder%3Dtrue~UnknownValue&ICPanelName=&ICFind=&ICAddCount=&ICAppClsData=&HR_DR_GROUP_VW$hnewpers$0=0%7C0%7C0%7C0%7C0%7C0%7C0%231%7C0%7C0%7C0%7C0%7C0%7C0%232%7C0%7C0%7C0%7C0%7C0%7C0%23&DERIVED_HR_DR_ASOFDATE=2021%2F04%2F08&DERIVED_HR_DR_EMPL_RCD=0";
    let options = {
        url: "https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL",
        //url: "https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?Page=GP_ABS_SSCREQHIST&Action=A",
        method: 'POST',
        jar: j0,
        headers: {
            'User-Agent': 'Alexander the great.',
            "Content-Type": "application/x-www-form-urlencoded"
        },
        //body: fd,
        form: fv
        //followAllRedirects: true
    }
    */
    //require('request-debug')(request);
    //require('request').debug = true;
    request.post("https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL", {form:fv}, (error, response, body)=>{
        if (error) {
            console.error('r8 error:', error); // Print the error if one occurred
        } else {
            fs.createWriteStream('tmp/r8.html').end(body); //DEBUG
            dumpHeader(response, 'tmp/r8-hdr.txt');  //DEBUG
            //req3();
            //req5();
            //req8();
            //req7("https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PORTALPARAM_PTCNAV=HC_GP_ABS_MGRSS_HIST_GBL&EOPP.SCNode=HRMS&EOPP.SCPortal=EMPLOYEE&EOPP.SCName=ADMN_MANAGER_REVIEWS&EOPP.SCLabel=%e9%83%a8%e5%b1%9e%e7%94%b3%e8%af%b7%e8%ae%b0%e5%bd%95%e6%9f%a5%e8%af%a2&EOPP.SCFName=ADMN_F201512302128141443830683&EOPP.SCSecondary=true&EOPP.SCPTcname=PT_PTPP_SCFNAV_BASEPAGE_SCR&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR.HC_GP_ABS_MGRSS_HIST_GBL&IsFolder=false&PortalActualURL=https%3a%2f%2fhr.wistron.com%2fpsc%2fPRD%2fEMPLOYEE%2fHRMS%2fc%2fROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL%3fNAVSTACK%3dClear&PortalContentURL=https%3a%2f%2fhr.wistron.com%2fpsc%2fPRD%2fEMPLOYEE%2fHRMS%2fc%2fROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL%3fNAVSTACK%3dClear&PortalContentProvider=HRMS&PortalCRefLabel=%e8%af%b7%e5%81%87%e8%ae%b0%e5%bd%95%e6%9f%a5%e8%af%a2&PortalRegistryName=EMPLOYEE&PortalServletURI=https%3a%2f%2fhr.wistron.com%2fpsp%2fPRD%2f&PortalURI=https%3a%2f%2fhr.wistron.com%2fpsc%2fPRD%2f&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes");
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
            fs.createWriteStream('tmp/r5.html').end(body); //DEBUG
            dumpHeader(response, 'tmp/r5-hdr.txt');  //DEBUG
            let rxp = new RegExp('<iframe id="ptifrmtgtframe".*? src="(.*?)"></iframe>');
            let m = rxp.exec(body);
            if (m) {
                console.log('直接报告者用户界面 iframe', m[1]);
                req7(m[1]);
            }
        }
    });
}

// 主管自助服务 - 部属申请记录查询 - 请假记录查询 - 直接报告者用户界面
function req7() {
    let url = "https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PORTALPARAM_PTCNAV=HC_GP_ABS_MGRSS_HIST_GBL&EOPP.SCNode=HRMS&EOPP.SCPortal=EMPLOYEE&EOPP.SCName=ADMN_MANAGER_REVIEWS&EOPP.SCLabel=%e9%83%a8%e5%b1%9e%e7%94%b3%e8%af%b7%e8%ae%b0%e5%bd%95%e6%9f%a5%e8%af%a2&EOPP.SCFName=ADMN_F201512302128141443830683&EOPP.SCSecondary=true&EOPP.SCPTcname=PT_PTPP_SCFNAV_BASEPAGE_SCR&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR.HC_GP_ABS_MGRSS_HIST_GBL&IsFolder=false&PortalActualURL=https%3a%2f%2fhr.wistron.com%2fpsc%2fPRD%2fEMPLOYEE%2fHRMS%2fc%2fROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL%3fNAVSTACK%3dClear&PortalContentURL=https%3a%2f%2fhr.wistron.com%2fpsc%2fPRD%2fEMPLOYEE%2fHRMS%2fc%2fROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL%3fNAVSTACK%3dClear&PortalContentProvider=HRMS&PortalCRefLabel=%e8%af%b7%e5%81%87%e8%ae%b0%e5%bd%95%e6%9f%a5%e8%af%a2&PortalRegistryName=EMPLOYEE&PortalServletURI=https%3a%2f%2fhr.wistron.com%2fpsp%2fPRD%2f&PortalURI=https%3a%2f%2fhr.wistron.com%2fpsc%2fPRD%2f&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes";
    // https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PORTALPARAM_PTCNAV=HC_GP_ABS_MGRSS_HIST_GBL&EOPP.SCNode=HRMS&EOPP.SCPortal=EMPLOYEE&EOPP.SCName=ADMN_MANAGER_REVIEWS&EOPP.SCLabel=部属申请记录查询&EOPP.SCFName=ADMN_F201512302128141443830683&EOPP.SCSecondary=true&EOPP.SCPTcname=PT_PTPP_SCFNAV_BASEPAGE_SCR&FolderPath=PORTAL_ROOT_OBJECT.CO_MANAGER_SELF_SERVICE.HC_TIME_MANAGEMENT.HC_VIEW_TIME_MGR.HC_GP_ABS_MGRSS_HIST_GBL&IsFolder=false&PortalActualURL=https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PortalContentURL=https://hr.wistron.com/psc/PRD/EMPLOYEE/HRMS/c/ROLE_MANAGER.GP_ABS_MGRSS_HIST.GBL?NAVSTACK=Clear&PortalContentProvider=HRMS&PortalCRefLabel=请假记录查询&PortalRegistryName=EMPLOYEE&PortalServletURI=https://hr.wistron.com/psp/PRD/&PortalURI=https://hr.wistron.com/psc/PRD/&PortalHostNode=HRMS&NoCrumbs=yes&PortalKeyStruct=yes
    request(url, (error, response, body)=>{
        if (error) {
            console.error('r7 error:', error);
        } else {
            dumpHeader(response, 'tmp/r7-hdr.txt');
            fs.createWriteStream('tmp/r7.html').end(body);
            let html = body;
            while (true) {
                let rxp = /<tr id='trSINGLE_SELECT_GRID.*?<\/tr>/sg;
                let m = rxp.exec(html);
                // ID 名称	员工ID	职务	部门ID
                if (m) {
                    let rxpL = new RegExp("<DIV    id='win0divSELECT_EMPLOYEE\\$(.*?)'>.*?<span class='PABOLDTEXT' >(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>", "s");
                    let mL = rxpL.exec(m[0]);
                    if (mL) {
                        console.log("Leader: ", mL[1], mL[2], mL[3], mL[4], mL[5]);
                    } else {
                        let rxpM = new RegExp("<DIV    id='win0divSELECT_EMPLOYEE\\$(.*?)'>.*?<span class='PSEDITBOX_DISPONLY' >(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>.*?<span.*?class='PSEDITBOX_DISPONLY'.*?>(.*?)</span>", "s");
                        let mM = rxpM.exec(m[0]);
                        if (mM) {
                            console.log("Member: ", mM[1], mM[2], mM[3], mM[4], mM[5]);
                        }
                    }
                    html = html.substr(rxp.lastIndex);
                } else {
                    break;
                }
            }
            //procR7(body);
            req8(procR7(body));
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

(function() {
    fs.mkdir("./tmp", ()=>{
        fs.createWriteStream("./tmp/cookies.json").end("", ()=>{
            console.log("Rock and Roll");
            req1();
        });
    })
})();
