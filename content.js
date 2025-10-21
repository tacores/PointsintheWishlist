const CONSOLE_OUTPUT_RATE = 30;

window.addEventListener("load",function(eve){
	chrome.storage.local.get("delayTime",(value)=>{
		//options.htmlで設定した値をAmazonのローカルストレージに移す
		localStorage["delayTime"]=value.delayTime||500;
		//前のセッションが残っていた場合を考慮し最初のロード時に消す
		sessionStorage.clear();
		wishpoints();
	})
},false);

//DOMの変更を監視する
const obtarget = document.getElementById("g-items");
const observer = new MutationObserver(records =>{
	wishpoints();
});
observer.observe(obtarget,{childList:true});

function wishpoints(){
	const dom_parser = new DOMParser();
	//wishlist内のアイテムのリスト
	const itemList = document.getElementsByClassName("price-section");
	//どこまで読み込んだのかsessionStorageに記録
	const olditemnum = sessionStorage.getItem("storageItemNum")||0;
	//以前に調べてないアイテムに対しfetchを行う
	for(let item of Array.from(itemList).slice(olditemnum)){
		const asin = JSON.parse(item.attributes["data-item-prime-info"].value).asin;
		fetch('https://www.amazon.co.jp/dp/'+asin)
		.then(res=>res.text())
		.then(text=>{
		const doc = dom_parser.parseFromString(text, "text/html");
		const title = doc.getElementsByTagName('title')[0].innerText.split('|')[0];
		const kindle_price = doc.getElementById('kindle-price');

		// Kindle以外の場合、特選タイムセールだけチェックする
		if (kindle_price == undefined) {
			let deal_rich_rate = 0;
			const deal_rich = item.parentElement.parentElement.getElementsByClassName("wl-deal-rich-badge-label");
			if(deal_rich.length > 0) {
				const match = deal_rich[0].innerText.match(/\d+%/);
				if(match) {
					deal_rich_rate = parseInt(match[0].replace('%', ''));
				}
			}
			if( deal_rich_rate >= CONSOLE_OUTPUT_RATE ) {
				const title_no_kindle = doc.getElementsByTagName('title')[0].innerText.split('|')[1].trim();
				console.log(title_no_kindle + " " + deal_rich_rate + "%（特選タイムセール）");
			}
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

		// 価格下落率
		const price_drop = item.parentElement.parentElement.getElementsByClassName("itemPriceDrop");
		let price_drop_rate = 0;
		if(price_drop.length > 0) {
			const match = price_drop[0].innerText.match(/\d+%/);
			if(match) {
				price_drop_rate = parseInt(match[0].replace('%', ''));
			}
		}

		// クーポン
		const coupon = doc.getElementsByClassName("promoPriceBlockMessage");
		let coupon_rate = 0;
		if(coupon.length > 0) {
			const match = coupon[0].innerText.match(/\d+% OFF/);
			if(match) {
				coupon_rate = parseInt(match[0].replace('% OFF', ''));
			}
		}

		if( rate >= CONSOLE_OUTPUT_RATE) {
			console.log(title + " " + rate + "%（ポイント）");
		}
		if( price_drop_rate >= CONSOLE_OUTPUT_RATE) {
			console.log(title + " " + price_drop_rate + "%（価格）");
		}
		if( coupon_rate > 0) {
			console.log(title + " " + coupon_rate + "%（クーポン）");
		}

		//debug
		//console.log(points);
	}).catch(err=>console.error(err));
	}
	//セッションストレージに現在の読み込み数を記録
	sessionStorage.setItem("storageItemNum", itemList.length);
}
