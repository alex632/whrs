//
// 自动化从 PeopleSoft - Wistron HR Online 截取请假资讯，并制作报表。
// 我想知道谁请了多少假？还剩多少假？這群懶散的東西！
//

'use strict';	// Whole-script strict mode applied.

const request0 = require('request');
const FileCookieStore = require('tough-cookie-filestore');
const j0 = request0.jar(new FileCookieStore('tmp/cookies.json')); // NOTE: 'cookies.json' file must already exist!
const request = request0.defaults({ jar : j0 , headers: {
    // NOTE: User-Agent must be specified or the following message responded.
    // Failed processing Browscap file. as it could be missing. Please contact your system adminstrator.
    'User-Agent': 'Alexander the great.'
}});

// Get initial page
function reqq1() {
    request("https://hr.wistron.com/psp/PRD/?&cmd=login&languageCd=ZHS&", (error, response, body)=>{
        if (error) {
            console.error('error:', error); // Print the error if one occurred
        } else {
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
            fs.createWriteStream('tmp/r1.html').end(body); //DEBUG
            dumpHeader(response, 'tmp/r1-hdr.txt');  //DEBUG
            reqq2(procR1(body));
        }
    })
}

const http = require('http');
const https = require('https');
const fs = require('fs');
const querystring = require('querystring');

var bytesGot = 0;   // Statistics
//process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;  // May be latter.
//var baseUrl = "https://hr.wistron.com";

function dumpHeader(rsp, fn) {
    let fo = fs.createWriteStream(fn);
    fo.write(`HTTP/${rsp.httpVersion} ${rsp.statusCode} ${rsp.statusMessage}\r\n`);
    let hdr = rsp.rawHeaders;
    for (let i=0; i < hdr.length; i+=2) {
        fo.write(`${hdr[i]}: ${hdr[i+1]}\r\n`);
    }
    fo.end();
}

// Generic HTTP GET
function genGet(url, logfilenm) {
    return new Promise( (resolve, reject) => {
        let req = https.request( { url: url,
            headers: { 'user-agent': 'Alexander the great...' } // NOTE: required.
        }, response => {
            let chunks = [];
            response.addListener('data', (chunk) => {
                bytesGot += chunk.byteLength;
                chunks.push(chunk);
            });
            response.on('end', () => {
                let buff = Buffer.concat(chunks);
                let html = buff.toString();
                let fo = fs.createWriteStream(`tmp/${logfilenm}`);   //DEBUG
                fo.write(html);
                fo.end();
                if (response.statusCode===200) {
                    resolve({statusCode: response.statusCode, html: html});
                } else {
                    reject(`GET ${url} HTTP error: ${response.statusMessage}`);
                }
            });
        });
        req.end();
        req.on('error', e => {
            reject(`GET ${url} Problem: ${e.message}`);
        });
    });
}

// Process values from req1
function procR1(html) {
    let fi1 = { // form input values
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
    const fv1 = Object.assign({}, fi1, fx1)  
    return fv1;
}

// HTTP POST to login
function reqq2(fv) {
    request.post("https://hr.wistron.com/psp/PRD/?&cmd=login&languageCd=ZHS&", {followAllRedirects:true, form:fv}, (error, response, body)=>{
        if (error) {
            console.error('error:', error); // Print the error if one occurred
        } else {
            fs.createWriteStream('tmp/r2.html').end(body); //DEBUG
            dumpHeader(response, 'tmp/r2-hdr.txt');  //DEBUG
        }
    });
}

(function() {
    fs.mkdir("./tmp", ()=>{
        fs.createWriteStream("./tmp/cookies.json").end(""); // NOTE: wait for file creation done?
        console.log("Rock and Roll");
        reqq1();
    })
})();
