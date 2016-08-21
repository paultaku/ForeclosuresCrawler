const requests = require("request");
const rp = require("request-promise");
const cheerio  = require("cheerio");
const firebase = require("firebase");

firebase.initializeApp({
  serviceAccount: "./foreclose-c374a2374390.json",
  databaseURL: "https://foreclose-bdea7.firebaseio.com"
});

var db = firebase.database();
var ref = db.ref();
var dataRef = ref.child('data/TPD');


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

const target_code = [
	{ "code": "C52","name":"房屋"},
	{ "code": "C51","name":"土地"},
	{ "code": "C54","name":"動產"},
]

const proc_code = [
	{ "code": "1","name":"一般程序"},
	{ "code": "4","name":"應買公告"},
	{ "code": "5","name":"拍定價格"},
]

 
rp(	{
	uri: "http://aomp.judicial.gov.tw/abbs/wkw/WHD2A02.jsp?proptype=C52&saletype=1&court=TPD",
	method:'GET',
	transform: function (body) { return cheerio.load(body); }
	})
	.then(function ($) {
		var $input = $("input[type='hidden']");
		return { "name": $input.attr('name'),
			"value": $input.val()
		};
	},function (err) {
		console.log("error: ",err);
	})
	.then(function(result){
		console.log(result);
		rp({
			uri: "http://aomp.judicial.gov.tw/abbs/wkw/WHD2A03.jsp?"+result['name']+"="+result['value']+"&hsimun=all&ctmd=all&sec=all&saledate1=&saledate2=&crmyy=&crmid=&crmno=&dpt=&minprice1=&minprice2=&saleno=&area1=&area2=&registeno=&checkyn=all&emptyyn=all&rrange=%A4%A3%A4%C0&comm_yn=&owner1=&order=odcrm&courtX=TPD&proptypeX=C52&saletypeX=1&query_typeX=db",
			method: 'GET',
			transform: function(body){ return cheerio.load(body); }
		})
		.then(function($){
			var rows = $("form[name ='form'] table table tr").slice(1,-2);

			rows.each(function(i,el){
				var cols = $("td",this);
				var dataObj = {
					serial: "", // 字號股別
					dateNtime: "", // 拍賣日期及拍賣次數
					cityArea: "", // 縣市
					address: { link:"", text:"" }, // 房屋地址樓層面積
					auctionPrice: "", // 總拍賣底價(元)
					check: "", // 點交
					isEmpty: "", // 空屋
					auctionTime: "", // 標別
					comment: "", // 備註
					imgLinks: [], // 看圖
					commAuction: "", // 採通訊投標
					queryLandPolluted: "", // 土地有無遭受污染
					strBeauty: function( string ){
						return string.replace(/\r/g,'').replace(/ /g,'').replace(/\n/g,'').replace(/\t/g,'');
					}
				};
				cols.each(function(i,el){
					console.log("index: ",i);
					switch(i) {
						case 1:
							dataObj["serial"] = dataObj.strBeauty( $(this).html() );
							console.log( dataObj["serial"] );
							break;
						case 2:
							dataObj["dateNtime"] = dataObj.strBeauty( $("div",this).html() );
							break;
						case 3:
							dataObj["cityArea"] = dataObj.strBeauty( $("div",this).html() );
							break;
						case 4:
							dataObj["address"]["link"] = "http://aomp.judicial.gov.tw/abbs/wkw/"+$("a",this).attr("href");
							dataObj["address"]["text"] = dataObj.strBeauty($('a',this).text()) + "|" + dataObj.strBeauty( $(this).text() );
							console.log( dataObj["address"]["text"] );
							// dataObj["address"] = dataObj.strBeauty( $(this).html() );
							
							break;
						case 5:
							dataObj["auctionPrice"] = dataObj.strBeauty( $(this).html() );
							break;
						case 6:
							dataObj["check"] = dataObj.strBeauty( $("div",this).html() );
							break;
						case 7:
							dataObj["isEmpty"] = dataObj.strBeauty( $("div",this).html() );
							break;
						case 8:
							dataObj["auctionTime"] = dataObj.strBeauty( $("div",this).html() );
							break;
						case 9:
							dataObj["comment"] = dataObj.strBeauty( $("div",this).html() );
							break;
						case 10:
							// dataObj["imgLinks"] = dataObj.strBeauty( $(this).html() );
							// console.log( $(this).html() );
							break;
						case 11:
							dataObj["commAuction"] = dataObj.strBeauty( $("center",this).html() );
							break;
						case 12:
							// dataObj["queryLandPolluted"] = $(this).html();
							// console.log( $(this).html() );
							break;
						default:
							break;	
					}
				}); /* cols each function */
				delete dataObj["strBeauty"];
				dataRef.push().set(dataObj);
			}); /* rows each function */
			
			

		}, function(err){
			console.log("error: ", err);
		})
	});
























	














