const requests = require("request");
const rp = require("request-promise");
const cheerio  = require("cheerio");


const baseUrl = "http://www.judicial.gov.tw/";
const court_code = [
	{ "code": "TPD", "name": "臺灣台北地方法院" },
	{ "code": "PCD", "name": "臺灣新北地方法院" },
	{ "code": "SLD", "name": "臺灣士林地方法院" },
	{ "code": "TYP", "name": "臺灣桃園地方法院" },
	{ "code": "SCD", "name": "臺灣新竹地方法院" },
	{ "code": "MLD", "name": "臺灣苗栗地方法院" },
	{ "code": "TCD", "name": "臺灣臺中地方法院" },
	{ "code": "NTD", "name": "臺灣南投地方法院" },
	{ "code": "CHD", "name": "臺灣彰化地方法院" },
	{ "code": "ULD", "name": "臺灣雲林地方法院" },
	{ "code": "CYD", "name": "臺灣嘉義地方法院" },
	{ "code": "TND", "name": "臺灣臺南地方法院" },
	{ "code": "KSD", "name": "臺灣高雄地方法院" },
	{ "code": "PTD", "name": "臺灣屏東地方法院" },
	{ "code": "TTD", "name": "臺灣臺東地方法院" },
	{ "code": "HLD", "name": "臺灣花蓮地方法院" },
	{ "code": "ILD", "name": "臺灣宜蘭地方法院" },
	{ "code": "KLD", "name": "臺灣基隆地方法院" },
	{ "code": "PHD", "name": "臺灣澎湖地方法院" },
	{ "code": "KMD", "name": "福建金門地方法院" },
	{ "code": "LCD", "name": "福建連江地方法院" },
]

var options = {
    uri: baseUrl+"db/WHD2A01.jsp",
    method:'POST',
    form: {
        court: 'TPD'
    },
    transform: function (body) {
        return cheerio.load(body);
    }
};
 
rp(options)
    .then(function ($) {
    	var $form = $("form[name='form']");
    	console.log($form);
    },function (err) {
        console.log("error: ",err);
    })
    .then(function(){

    });
    