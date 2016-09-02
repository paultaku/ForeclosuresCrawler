const requests = require("request");
const rp = require("request-promise");
const iconv = require("iconv-lite");
const cheerio  = require("cheerio");
const Q = require('q');
const firebase = require("firebase");
const moment = require("moment");

var today = moment().format("YYYY-MM-DD");

firebase.initializeApp({
  serviceAccount: "./foreclose-c374a2374390.json",
  databaseURL: "https://foreclose-bdea7.firebaseio.com"
});

var db = firebase.database();
var ref = db.ref();

function FCobj(){

	// properties
	var self = this;
	var final_page_index_get = false;
	var final_page_index;
	var data_array = {};

	this.ArrToObj = function(array){
		var form_Data = {};
		for(var key in array){
			form_Data[ array[key]['name'] ] = array[key]['value'];
		}
		return form_Data;
	}

	this.ObjToArr = function(obj){
		var arr = [];
		for(var key in obj){
			arr.push({
				name:key,
				value: obj[key],
			});
		}
		return arr;
	}

	
	this.getDataByCourtAndCat = function( target_code,court_code ){
		var deferred = Q.defer();
		rp({
			uri: "http://aomp.judicial.gov.tw/abbs/wkw/WHD2A02.jsp?proptype="+target_code+"&saletype=1&court="+court_code,
			method: "GET",
			transform: function(body){
				return cheerio.load(body);
			},
		})
		.then(function($){
			var form_Array = $("form[name ='form']").serializeArray();
			var form_data = self.ArrToObj(form_Array);
			self.removeData(form_data);
			deferred.resolve(form_data);
		}, function(error){
			deferred.reject(error);
		});

		return deferred.promise;
	}

	this.strBeauty = function(string){
		return iconv.decode(string.replace(/\r/g,'').replace(/ /g,'').replace(/\n/g,'').replace(/\t/g,''),'Big5');
	}

	this.removeData = function(data){
		var rowRef = ref.child('data/'+data.courtX);
		rowRef
			.remove()
			.then(function() {
				console.log("Remove succeeded.")
			})
			.catch(function(error) {
				console.log("Remove failed: " + error.message)
			});
	}

	this.pushData = function($, data){

		var rowRef = ref.child('data/'+data.courtX);
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
				queryLandPolluted: "" // 土地有無遭受污染
			};
			cols.each(function(i,el){
				switch(i) {
					case 1:
						dataObj["serial"] = self.strBeauty( $(this).html() );
						break;
					case 2:
						dataObj["dateNtime"] = self.strBeauty( $("div",this).html() );
						break;
					case 3:
						dataObj["cityArea"] = self.strBeauty( $("div",this).html() );
						break;
					case 4:
						dataObj["address"]["link"] = "http://aomp.judicial.gov.tw/abbs/wkw/"+$("a",this).attr("href");
						dataObj["address"]["text"] = self.strBeauty($('a',this).text()) + "|" + self.strBeauty( $(this).text() );							
						break;
					case 5:
						dataObj["auctionPrice"] = self.strBeauty( $(this).html() );
						break;
					case 6:
						dataObj["check"] = self.strBeauty( $("div",this).html() );
						break;
					case 7:
						dataObj["isEmpty"] = self.strBeauty( $("div",this).html() );
						break;
					case 8:
						dataObj["auctionTime"] = self.strBeauty( $("div",this).html() );
						break;
					case 9:
						dataObj["comment"] = self.strBeauty( $("div",this).html() );
						break;
					case 10:
						// dataObj["imgLinks"] = dataObj.strBeauty( $(this).html() );
						// console.log( $(this).html() );
						break;
					case 11:
						dataObj["commAuction"] = self.strBeauty( $("center",this).html() );
						break;
					case 12:
						// dataObj["queryLandPolluted"] = $(this).html();
						// console.log( $(this).html() );
						break;
					default:
						break;	
				}
				
			});	// cols each function 
			rowRef.push().set(dataObj);
		});	// rows each function
	}


	this.getPageData = function(formObj, pageNow){
		var deferred = Q.defer();
		var form = self.ObjToArr(formObj);
		var url = "http://aomp.judicial.gov.tw/abbs/wkw/WHD2A03.jsp?"+form[0]['name']+"="+form[0]['value']+"&hsimun=all&ctmd=all&sec=all&saledate1=&saledate2=&crmyy=&crmid=&crmno=&dpt=&minprice1=&minprice2=&saleno=&area1=&area2=&registeno=&checkyn=all&emptyyn=all&rrange=%A4%A3%A4%C0&comm_yn=&owner1=&order=odcrm&courtX="+formObj.courtX+"&proptypeX="+formObj.proptypeX+"&saletypeX="+formObj.saletypeX+"&query_typeX=db";
		rp({
			uri: url,
			method: 'POST',
			form: formObj,
			transform: function(body){ return cheerio.load(body); }
		})
		.then(function($){

			var form_Array = $("form[name ='form']").serializeArray();
			var form_Data = {};
			form_Data = self.ArrToObj(form_Array);

			if( $("nobr").length == 0 ){
				// 沒有資料提早結束
				deferred.resolve({
					form: {},
					pageNow: 1,
					final: true,
				});
			} else {
				self.pushData($, form_Data);

				if( !this.final_page_index_get ){
					this.final_page_index = ($("nobr").length == 1) ? 1 : parseInt( $("nobr").last().attr("onclick").split("=")[1].split(";")[0] );
					this.final_page_index_get = true;
					console.log("最後一頁: ", this.final_page_index);
				}

				var final_bool = ( form_Data.pageNow == this.final_page_index ) ? true : false;
				form_Data.pageNow = ( form_Data.pageNow == undefined ) ? 1 : parseInt(form_Data.pageNow) + 1;

				if( final_bool ){
					this.final_page_index_get = false;
				}

				deferred.resolve({
					form: form_Data,
					pageNow: form_Data.pageNow,
					final: final_bool,
				});	
			}
			
			
			
		}, function(err){
			deferred.reject(err);
			
		}); 

		return deferred.promise;
	}

	this.reset = function(){
		var deferred = Q.defer();
		this.final_page_index = undefined;
		deferred.resolve();
		return deferred.promise;
	}
}

exports = module.exports = new FCobj;
