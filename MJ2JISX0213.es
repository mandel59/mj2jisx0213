#!/usr/bin/env node
/*
 * title: MJ2JISX0213.es
 * verison: 0.2.1
 * author: MUTOU Keisuke (k-mutou@ipa.go.jp)
 *
 * release date: 2016-06-30
 * license: MIT
 */

var fs = require('fs'),
https = require('https'),
us = require('underscore'),
getopt = require('posix-getopt');

const CR = '\r', LF = '\n', CRLF = '\r\n';

const app = {
	version: "Ver.0.2.1",
	// 最新版のMJ縮退マップ
	resourceURL: "https://oscdl.ipa.go.jp/MJShrinkMap.json",
//	resourceURL: "https://dl.mojikiban.ipa.go.jp/MJShrinkMap.json",
	usage:" \
使い方: MJ2JISX0213 [オプション] [出力ファイル名]\n\n \
オプション:\n \
\t-v, --version\tバージョンを表示\n \
\t-f, --format\t出力ファイルフォーマット[JSON|TSV|CSV]を指定する\n \
\t-h, --help\t使い方(コレ)を表示\n\n"
};

var fileOption = {encoding: "utf-8"};
var ファイル形式 = "JSON";
var 出力ファイル名 = "変換テーブル.json";

/*
 * 例外処理の記述
 * アルゴリズムに従って、処理しないものは、以下に変換情報を記述しておく。
 *
 * 2015-08-17 追加 
 * MJ004411, MJ014719, MJ038446, MJ039434 別字リンクが含まれているもの。
 * MJ016011は、1-43-94は別字が含まれる経路なので、1-44-01を選択
 */
const 例外情報 = [
	{"MJ文字図形名":"MJ006457", "変換情報":{"JIS X 0213":"1-30-71", "UCS": "U+4E1E"}}, 
	{"MJ文字図形名":"MJ011815", "変換情報":{"JIS X 0213":"1-56-38", "UCS": "U+613C"}}, 
	{"MJ文字図形名":"MJ016886", "変換情報":{"JIS X 0213":"1-45-07", "UCS": "U+53CB"}}, 
	{"MJ文字図形名":"MJ020479", "変換情報":{"JIS X 0213":"1-37-27", "UCS": "U+7E8F"}}, 
	{"MJ文字図形名":"MJ057404", "変換情報":{"JIS X 0213":"1-33-67", "UCS": "U+5DE3"}}, 
	
	{"MJ文字図形名":"MJ019374", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}}, 
	{"MJ文字図形名":"MJ034976", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}}, 
	{"MJ文字図形名":"MJ035231", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}}, 
	{"MJ文字図形名":"MJ038675", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}}, 
	{"MJ文字図形名":"MJ056889", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}}, 
	{"MJ文字図形名":"MJ057204", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}}, 
	{"MJ文字図形名":"MJ057262", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}}, 
	{"MJ文字図形名":"MJ057625", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}}, 
	{"MJ文字図形名":"MJ057639", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}}, 
	
	{"MJ文字図形名":"MJ016011", "変換情報":{"JIS X 0213":"1-44-01", "UCS": "U+6F2B"}},
	{"MJ文字図形名":"MJ004411", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}},
	{"MJ文字図形名":"MJ014719", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}},
	{"MJ文字図形名":"MJ038446", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}},
	{"MJ文字図形名":"MJ039434", "変換情報":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}}
];

var 例外リスト = us.pluck(例外情報, "MJ文字図形名");
var n = new main()


function main()
{
	var parser = new getopt.BasicParser(':v(version)h(help)f:(format)', process.argv);
	while ((option = parser.getopt()) !== undefined)
	{
		switch (option.option)
		{
			case 'v':
				console.log(app.version);
				process.exit(2);
				break;
			case 'h':
				console.log(app.usage);
				process.exit(2);
				break;
			case 'f':
				switch (option.optarg.toUpperCase())
				{
					case 'JSON':
						ファイル形式 = "JSON";	break;
					case 'TSV':
						ファイル形式 = "TSV";	break;
					case 'CSV':
						ファイル形式 = "CSV";	break;
					default:
						console.error("ファイルフォーマットは、[JSON|TSV|CSV]より選択してください。");
						process.exit(-2);
				}
				break;
			default:
				console.error("引数の指定に誤りがあります。\n");
				console.log(app.usage);
				process.exit(-2);
		}
	}
	
	switch (process.argv.length - parser.optind())
	{
		case 1:
			// 出力ファイル名を変更する。
			var getoptの引数長 = process.argv.length;
			出力ファイル名 = process.argv[getoptの引数長-1];
		case 0:
			ファイル読み込み();
			break;
		default:
			console.error("引数の指定に誤りがあります。\n");
			console.log(app.usage);
	}
}

function ファイル読み込み()
{
	JISX0213toUCS = fs.readFileSync("JISX0213_UCS.json", fileOption);
	JISX0213_UCS = JSON.parse(JISX0213toUCS);
	
	// MJ縮退マップをHTTP GETで読み込む。
	console.log("* mojikiban.ipa.go.jpからMJ縮退マップを取得します。");
	https.get(app.resourceURL, function(res) {
		
		var body = "";
		res.setEncoding("utf8");
		res.on('data', function(chunk) {
			body += chunk;
		});

		// HTTP読み込みが終了したら
		res.on('end', function() {
			console.log("* %s からファイルを取得しました。", app.resourceURL);
			
			// MJ縮退マップをParse
			try
			{
				var MJ縮退マップ = JSON.parse(body);
			}
			catch(e)
			{
				if (e instanceof SyntaxError)
				{
					console.error("JSONデータの文法に誤りがあります。");
					process.exit(-3);
				}
			}
			
			console.log("* 一意な候補の選択アルゴリズムを適用します。");
			
			/* JIS情報を付加する */
			属性情報の付加(MJ縮退マップ);
			/* 一意な変換を実行する */
			変換テーブル = 一意な変換(MJ縮退マップ);
			/* 一意な変換情報をファイルに書き出す。 */
			ファイル出力(変換テーブル);
			console.log("* 適用処理が完了しました。\n出力ファイル名: %s", 出力ファイル名);
		});
	}).on('error', function(e) {
		// ネットワーク接続がないなど場合
		console.log("エラー: " + e.message);
	});

}

function 属性情報の付加(MJ縮退マップ)
{
	/*
	 * mapメソッドを利用して、MJ縮退マップの候補情報に、
	 * JIS水準情報と漢字施策情報を付加する。
	 * この処理に100秒くらいかかる。
	 */
	us.map(MJ縮退マップ.content, function(縮退候補情報) {
		us.map(縮退候補情報, function(情報) {
			us.map(情報, function(候補) {
				if (候補.UCS != undefined)
				{
					JIS情報 = us.findWhere(JISX0213_UCS, {"UCS": 候補.UCS});
					if (JIS情報.水準 != undefined)
						候補.水準 = JIS情報.水準;
					
					if (JIS情報.漢字施策 != undefined)
						候補.漢字施策 = JIS情報.漢字施策;
				}
				return 候補;
			});
			return 情報;
		});
		return 縮退候補情報;
	});
//	return MJ縮退マップ;
}

function 一意な変換(MJ縮退マップ)
{
	var 変換テーブル = [];	//一意な変換候補を格納する配列
	
	us.each(MJ縮退マップ.content, function(縮退候補情報) {
		
		/*
		 * 0. 例外の処理
		 *   当該MJ文字図形名が例外リストに含まれている場合は、1.以降の処理を行わず、例外情報の候補を
		 *   選択する。
		 */
		if (us.contains(例外リスト, 縮退候補情報.MJ文字図形名))
		{
			このMJ文字図形名の処理 = us.findWhere(例外情報, {"MJ文字図形名": 縮退候補情報.MJ文字図形名});
			変換テーブル.push({
				"MJ文字図形名": 縮退候補情報.MJ文字図形名, 
				"変換先": 変換先候補(このMJ文字図形名の処理.変換情報), 
				"備考": "別紙参照"
			});
			return ;
		}
		
		/*
		 * 1. JIS包摂・UCS統合規則
		 *   JIS包摂・UCS統合規則の情報が記載されており、変換先を一意に決定することができる。
		 */
		if (縮退候補情報['JIS包摂規準・UCS統合規則'] != undefined)
		{
			変換テーブル.push({
				"MJ文字図形名": 縮退候補情報.MJ文字図形名, 
				"変換先": 変換先候補(縮退候補情報['JIS包摂規準・UCS統合規則'][0]), 
				"備考": "JIS包摂規準・UCS統合規則"
			});
			return ;
		}
		
		/*
		 * 2. 法務省戸籍法関連通達・通知
		 *  法務省の戸籍法関連通達・通知の情報が記載されているもの。
		 */
		if (縮退候補情報['法務省戸籍法関連通達・通知'] != undefined)
		{
			/*
			 * 2.1 別字とされるものの除外
			 *   民一2842号通達 誤俗表で、別字とされているものは、全体から除く。
			 *   別字となっているUCSを特定して、全体に対してフィルタをかける。
			 */
			結果 = us.where(縮退候補情報['法務省戸籍法関連通達・通知'], {"付記":"別字"});	//別字とされているUCSを特定する。
			if (結果.length > 0)
			{
				var UCS = us.pluck(結果, 'UCS');
				
				// rejectメソッドを利用して、別字とされたUCSの値を消す。
				縮退候補情報['法務省戸籍法関連通達・通知'] = us.reject(縮退候補情報['法務省戸籍法関連通達・通知'], 
					function(縮退候補){ return us.contains(UCS, 縮退候補['UCS']) == true; });
				縮退候補情報['法務省告示582号別表第四'] = us.reject(縮退候補情報['法務省告示582号別表第四'], 
					function(縮退候補){ return us.contains(UCS, 縮退候補['UCS']) == true; });
				縮退候補情報['辞書類等による関連字'] = us.reject(縮退候補情報['辞書類等による関連字'], 
					function(縮退候補){ return us.contains(UCS, 縮退候補['UCS']) == true; });
			}

			/*
			 * 2.2 法務省戸籍法関聯通達・通知に関するものが一つの場合、それを選択 */
			if (縮退候補情報['法務省戸籍法関連通達・通知'].length == 1)
			{
				変換テーブル.push({
					"MJ文字図形名": 縮退候補情報.MJ文字図形名, 
					"変換先": 変換先候補(縮退候補情報['法務省戸籍法関連通達・通知'][0]), 
					"備考": 縮退候補情報['法務省戸籍法関連通達・通知'][0]['種別']
				});
				return ;
			}
			else if (縮退候補情報['法務省戸籍法関連通達・通知'].length > 1)
			{
				/* 法務省戸籍法関聯通達・通知に関するものが二つ以上の場合で、正俗表のものがあれば、それを選択 */
				if ((f = us.where(縮退候補情報['法務省戸籍法関連通達・通知'], {"種別":"民二5202号通知別表 正字・俗字等対照表"})).length == 1)
				{
					変換テーブル.push({
						"MJ文字図形名": 縮退候補情報.MJ文字図形名, 
						"変換先": 変換先候補(f[0]), 
						"備考": f[0].種別
					});
					return ;
				}
				else
				{
					// 種別が戸籍統一文字 親字・正字となっているものを抽出する。
					結果 = us.where(縮退候補情報['法務省戸籍法関連通達・通知'], {"種別":"戸籍統一文字情報 親字・正字"});
					最小ホップ = us.min(us.pluck(結果, "ホップ数"));
					結果 = us.where(結果, {"ホップ数":最小ホップ});
					
					/* ホップ数が最小となるものが一つの場合、それを候補とする。 */
					if (結果.length == 1)
					{
						変換テーブル.push({
							"MJ文字図形名": 縮退候補情報.MJ文字図形名, 
							"変換先": 変換先候補(結果[0]), 
							"備考": 結果[0].種別
						});
						return ;
					}

					/*
					 * ホップ数が最小となるものが複数ある場合は、処理1の③を行う。
					 * 民一2842号通達別表 誤字俗字・正字一覧表を参照 
					 */
					else if (結果.length > 1)
					{
						誤俗表 = us.where(縮退候補情報['法務省戸籍法関連通達・通知'], {"種別":"民一2842号通達別表 誤字俗字・正字一覧表", "付記":"無印"});
						if (誤俗表.length != 0)
						{
							us.each(誤俗表, function(値){
								結果.push(値);
							});
							UCSes = us.pluck(結果, "UCS");
							uni = UCSes.reduce(function(a, b){
								if (us.has(a, b) == false)
									a[b] = 1;
								else
									a[b] += 1;
								return a;
							},{});
							
							k = [];
							us.each(uni, function(value, key){
								if (value == 2)
									k.push(key);
							});
							
							if (k.length == 1)
							{
								変換テーブル.push({
									"MJ文字図形名": 縮退候補情報.MJ文字図形名, 
									"変換先": 変換先候補(us.findWhere(結果, {"UCS": k[0]})), 
									"備考": "戸籍統一文字情報/民一2842号通達別表 誤字俗字・正字一覧表"
								});
								return ;
							}
							else
							{
								var 変換先;
								常用漢字 = us.where(結果, {"漢字施策":"常用漢字"});
								人名用漢字 = us.where(結果, {"漢字施策":"人名用漢字"});
								
								/*
								 * 処理2 上記で決まらない場合は、漢字施策とJIS水準で決定する。
								 * 常用漢字、人名用漢字、両方とも人名用漢字の場合は、JIS水準の値が小さいものを選択 
								 *
								 */
								if (常用漢字.length == 1)
									変換先 = 常用漢字[0];
								else if (常用漢字.length == 0 && 人名用漢字.length == 1)
									変換先 = 人名用漢字[0];
								else if (常用漢字.length == 0 && 人名用漢字.length > 1)
									// 処理2 両方とも人名用漢字の場合は、水準の値が小さいものを変換先とする。
									変換先 = us.min(人名用漢字, function(候補){ return 候補.水準;});
							
								変換テーブル.push({
									"MJ文字図形名": 縮退候補情報.MJ文字図形名, 
									"変換先": 変換先候補(変換先),
									"備考": "戸籍統一文字情報 親字・正字"
								});
								
								return ;
							}
						}
						else
						{
							var 変換先;
							常用漢字 = us.where(結果, {"漢字施策":"常用漢字"});
							人名用漢字 = us.where(結果, {"漢字施策":"人名用漢字"});
							
							/*
							 * 処理2 上記で決まらない場合は、漢字施策とJIS水準で決定する。
							 * 常用漢字、人名用漢字、両方とも人名用漢字の場合は、JIS水準の値が小さいものを選択 
							 *
							 */
							if (常用漢字.length == 1)
								変換先 = 常用漢字[0];
							else if (常用漢字.length == 0 && 人名用漢字.length == 1)
								変換先 = 人名用漢字[0];
							else if (常用漢字.length == 0 && 人名用漢字.length > 1)
								// 両方とも人名用漢字の場合は、水準の値が小さいものを変換先とする。
								変換先 = us.min(人名用漢字, function(候補){ return 候補.水準;});
							
							変換テーブル.push({
								"MJ文字図形名": 縮退候補情報.MJ文字図形名, 
								"変換先": 変換先候補(変換先),
								"備考": "戸籍統一文字情報 親字・正字"
							});
							
							return ;
						}
					}
					/* 戸籍統一文字情報 親字・正字がないもの */
					else
					{
						var 変換先;
						誤俗表 = us.where(縮退候補情報['法務省戸籍法関連通達・通知'], {"種別":"民一2842号通達別表 誤字俗字・正字一覧表"});
						常用漢字 = us.where(誤俗表, {"漢字施策":"常用漢字"});
						人名用漢字 = us.where(誤俗表, {"漢字施策":"人名用漢字"});
						
						if (常用漢字.length == 1)
							変換先 = 常用漢字[0];
						else if (常用漢字.length == 0 && 人名用漢字.length == 1)
							変換先 = 人名用漢字[0];
						else if (常用漢字.length == 0 && 人名用漢字.length > 1)
							// 両方とも人名用漢字の場合は、水準の値が小さいものを変換先とする。
							変換先 = us.min(人名用漢字, function(候補){ return 候補.水準;});
						
						変換テーブル.push({
							"MJ文字図形名": 縮退候補情報.MJ文字図形名, 
							"変換先": 変換先候補(変換先),
							"備考": "民一2842号通達別表 誤字俗字・正字一覧表"
						});
						
						return;
					}
				}
			}
		}
		
		/* 
		 * 3. 法務省告示582号別表第四
		 *   別表第四の一により、入管正字への置き換えが示されているものであって、第1順位、第2順位の値がJIS X 0213に含まれるもの
		 *   がある場合。第1順位と第2順位が両方示されている場合は、第1順位を選択する。
		 */
		if (縮退候補情報['法務省告示582号別表第四'] != undefined)
		{
			別表四の一 = us.where(縮退候補情報['法務省告示582号別表第四'], {"表": "一"});
			if ( 別表四の一.length > 0)
			{
				変換テーブル.push({
					"MJ文字図形名": 縮退候補情報.MJ文字図形名, 
					"変換先": 変換先候補(us.first(別表四の一)), 
					"備考": "法務省告示582号別表第四"
				});
				return ;
			}
		}

		/* 候補が無いものは、「＿」(U+FF3F FULLWIDTH LOW LINE)を変換先にする。 */
		変換テーブル.push({
			"MJ文字図形名": 縮退候補情報.MJ文字図形名, 
			"変換先":{"JIS X 0213":"1-01-18", "UCS": "U+FF3F"}, 
			"備考": "候補なし"
		});
	});
	
	return 変換テーブル;
}

function ファイル出力(変換テーブル)
{
	var JSONデータ = function(変換テーブル)
	{
		return JSON.stringify({
			"meta": {
				"dct:title": "MJ縮退マップ 一意な変換表",
				"dct:issued": (new Date).toISOString().substr(0, 10),
				"dct:creator": [{
					// MJ縮退マップの派生物であるため、現著作者のクレジットを削除しないでください。
					"foaf:name": {
						"ja": "独立行政法人情報処理推進機構",
						"en": "Information-technology Promotion Agency, Japan"
					},
					"foaf:homepage": "http://www.ipa.go.jp/"
				} //追加する場合はこちら, {}
				],
				"owl:versionInfo": "",
				// CC BY-SAなので、このライセンス条項を踏襲してください。
				"cc:license": "http://creativecommons.org/licenses/by-sa/2.1/jp/"
			},
			"content": 変換テーブル
		}, null, "\t");
	}
	
	var SSVデータ = function(変換テーブル, SEPARATOR)
	{
		ssv = [];
		us.each(変換テーブル, function(list) {
			ssv.push(us.reduce(us.values(list), function(previous, data) {
				data = (typeof data == 'object') ? us.values(data).join(SEPARATOR) : data;
				
				if (previous == "")
					return data;
				else
					return previous + SEPARATOR + data;
			}, ""));
		});
		return ssv.join(CRLF);
	};
	
	switch (ファイル形式)
	{
		case "JSON": 
			// JSON形式で出力
			data = JSONデータ(変換テーブル);
			break;
		case "TSV": 
			// TSV形式で出力
			data = SSVデータ(変換テーブル, "\t");
			break;
		case "CSV": 
			data = SSVデータ(変換テーブル, ",");
			break;
		default: 
			data = JSONデータ(変換テーブル);
	}
	fs.writeFileSync(出力ファイル名, data);
}

function 変換先候補(情報)
{
	return {"JIS X 0213": 情報["JIS X 0213"], "UCS": 情報["UCS"]};
}
