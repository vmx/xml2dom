var sys = require('sys');
//var dom = require('./jsdom/level1/core').dom.level1.core;
var xml2dom = require('./xml2dom').xml2dom;
var data = require('./metaxml');

var xml2domparsed = xml2dom(data.huge);
sys.log(xml2domparsed);
