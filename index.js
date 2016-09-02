const FCobj = require("./FCobj");



// court
const court_code = [
	{ "code": "TPD", "name": "臺灣台北地方法院" },
	{ "code": "PCD", "name": "臺灣新北地方法院" },
	{ "code": "SLD", "name": "臺灣士林地方法院" },
	{ "code": "TYD", "name": "臺灣桃園地方法院" },
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

// proptype
const target_code = [
	{ "code": "C52","name":"房屋"},
	{ "code": "C51","name":"土地"},
	{ "code": "C54","name":"動產"},
]

// saletype
const proc_code = [
	{ "code": "1","name":"一般程序"},
	{ "code": "4","name":"應買公告"},
	{ "code": "5","name":"拍定價格"},
]
	


var court_index = 0;

function StartSingleCourtScratch(i){
	console.log(court_code[i]["name"]+", 類型: "+ target_code[0]["name"] +": 資料抓取中...");
	FCobj
		.getDataByCourtAndCat( target_code[0]["code"], court_code[i]["code"] )
		.then(function(result){
			recursivePageSave(result, result.pageNow);
		},function(error){
			console.error(error);
		});
		
		
}

function recursivePageSave(result, pageNow){
	FCobj
		.getPageData(result,pageNow)
		.then(function(result){
			if( result.final ){
				console.log( "page "+pageNow+" is saved. " );
				console.log( "Data save complete." );
				delete FCobj.final_page_index;
				court_index++;
				if( !checkIfFinished(court_index) ){
					StartSingleCourtScratch(court_index);
				}else{
					process.exit(0);
				}
				return;
			} else{
				console.log( "page "+pageNow+" is saved. " );
				recursivePageSave( result.form, result.pageNow );
			}
		}, function(error){
			console.error(error);
		});
}

function checkIfFinished(i){
	return (i == court_code.length  ) ? true : false;
}

// program start...
StartSingleCourtScratch(0);

























	














