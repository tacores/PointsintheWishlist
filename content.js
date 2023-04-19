const CONSOLE_OUTPUT_RATE = 30;

window.addEventListener("load",function(eve){
	//options.htmlで設定した値をAmazonのローカルストレージに移す
	chrome.runtime.sendMessage({method: "getLocalStorage", key1: "fetchType",key2:"loadType",key3:"delayTime"}, function(response) {
		localStorage["fetchType"]=response.data1;
		localStorage["loadType"]=response.data2;
		localStorage["delayTime"]=response.data3;
	});
	//前のセッションが残っていた場合を考慮し最初のロード時に消す
	sessionStorage.clear();

	//fetchAPIを用いるかjqueryのajaxを用いるか
	if(localStorage["fetchType"]=="fetchapi"){
		wishpoints(true);
	}else if(localStorage["fetchType"]=="jqueryajax"){
		wishpoints(false);
	}
},false);

//DOMの変更を監視する
const obtarget = document.getElementById("g-items");
const observer = new MutationObserver(records =>{
	//debug
	//console.log("observe!");
	if(localStorage["fetchType"]=="fetchapi"){
		wishpoints(true);
	}else if(localStorage["fetchType"]=="jqueryajax"){
		wishpoints(false);
	}
});
observer.observe(obtarget,{childList:true});

function wishpoints(enablefetch){
	const dom_parser = new DOMParser();
	//wishlist内のアイテムのリスト
	const itemList = document.getElementsByClassName("price-section");
	//どこまで読み込んだのかsessionStorageに記録
	const olditemnum = sessionStorage.getItem("storageItemNum")||0;
	//debug
	//console.log(itemList);
	//console.log(olditemnum);
	//以前に調べてないアイテムに対しfetchを行う
	for(let item of Array.from(itemList).slice(olditemnum)){
		const asin = JSON.parse(item.attributes["data-item-prime-info"].value).asin;
		const price_drop = item.parentElement.parentElement.getElementsByClassName("itemPriceDrop");
		let price_drop_rate = 0;
		if(price_drop.length > 0) {
			const match = price_drop[0].innerText.match(/\d+%/);
			if(match) {
				price_drop_rate = parseInt(match[0].replace('%', ''));
			}
		}

		if(enablefetch){
			//console.log("fetch");
			fetch('https://www.amazon.co.jp/dp/'+asin)
			.then(res=>res.text())
			.then(text=>{
			const doc = dom_parser.parseFromString(text, "text/html");
			const title = doc.getElementsByTagName('title')[0].innerText.split('|')[0];
			const kindle_price = doc.getElementById('kindle-price');
			if (kindle_price == undefined) {
				return;
			}

			const price = kindle_price.textContent.trim().replace(/,/g, "").match(/\d+/g)[0];
			const lopoints = doc.getElementsByClassName("loyalty-points");
			//debug
			//console.log(lopoints);
			//loyalty-pointsがない場合にはエラーが出るため存在判定
			let points = "";
			let rate = "";
			if(lopoints.length!=0){
				points = lopoints[0].children[1].innerText.trim();
				const matches = points.match(/\d+/g);	// （例）441ポイント (64%)
				rate = matches[1];
				item.firstElementChild.insertAdjacentHTML("beforeend", " " + points);
			} else {
				const totalpoints = doc.getElementsByClassName("total-points-value-display-column");
				if(totalpoints.length != 0) {
					points = totalpoints[1].children[0].innerText.trim();
					const matches = points.match(/\d+/g);	//（例）+40 ポイント
					rate = parseInt(matches[0] / price * 100);
					const point_text = matches[0] + "ポイント (" + rate + "%)";
					item.firstElementChild.insertAdjacentHTML("beforeend", " " + point_text);
				}
			}

			if( rate >= CONSOLE_OUTPUT_RATE) {
				console.log(title + " " + rate + "%（ポイント）");
			}
			if( price_drop_rate >= CONSOLE_OUTPUT_RATE) {
				console.log(title + " " + price_drop_rate + "%（価格）");
			}
			//debug
			//console.log(points);
		}).catch(err=>console.error(err));
		}else{
			//debug
			// console.log("jquery ajax");
			$.ajax({
				type:'GET',
				url:'https://www.amazon.co.jp/dp/'+asin,
				dataType:'html'
			}).done(function(data,status,xhr){
				const lopoints = dom_parser.parseFromString(data, "text/html").getElementsByClassName("loyalty-points");
				//kindle本でポイントがついている場合のみ計算
				if(lopoints.length){
					//trimをすることでスペースを削除
					var points = lopoints[0].children[1].innerText.trim();
					//debug
					// console.log(kindlepoints);
					item.firstElementChild.insertAdjacentHTML("beforeend", " " + points);
				}
			}).fail(function(xhr,status,error){
				console.error(error);
			});
		}
	}
	//debug
	//console.log(itemList.length);
	//セッションストレージに現在の読み込み数を記録
	sessionStorage.setItem("storageItemNum", itemList.length);
}
