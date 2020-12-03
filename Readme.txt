MJ縮退マップから一意な選択 Ver.0.2.2
============

― はじめにお読みください ―



MJ縮退マップから一意な選択
------------
[MJ縮退マップ]から自動的変換にJIS X 0213の候補に変換するためのリファレンスとなるプログラムです。本プログラムは、人の手を介さずに、テキストなどを自動変換する際に用いる変換テーブル等の作成に利用することができます。なお、変換に適する縮退候補がない場合は、「＿」(U+FF3F FULLWIDTH LOW LINE)を候補として提示する様に設計されています。本プログラムの基本的なアルゴリズムについては、平成27年度第一回文字情報基盤WG資料[縮退マップについて]のp.7～8を参照してください。
本プログラムは、[Node.js]で動作する様に作成されています。Node.jsは、各種プラットフォームで動作するJavaScriptランタイムです。

[MJ縮退マップ]: http://mojikiban.ipa.go.jp/4144.html
[縮退マップについて]: http://mojikiban.ipa.go.jp/contents/2015/09/20150925_5.pdf
[Node.js]: https://nodejs.org/


ライセンス
-------------
本プログラムは、The MIT Licenseに基づき配布されます。


Copyright (c) 2015 Information-technology Promotion Agency, Japan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


使い方
-------------
1. zipファイルを解凍する。
2. npmで依存するライブラリをインストールする。
* $ npm install
3. MJ2JISX0213.esを実行する。-hで使い方を見ることができます。


コンテンツ
-------------
MJ縮退マップから一意な変換 MJ2JISX0213.0.2.1.zip
1. はじめにお読みください	Readme.txt
2. MJ縮退マップから一意な変換スクリプト	MJ2JISX0213.es
3. JIS X 0213とUCSの対応情報	JISX0213_UCS.json


更新履歴
------------
* 2018-01-26 Ver.0.2.2
1. コンテンツのURLを変更し、httpsに対応
* 2016-06-30 Ver.0.2.1
1. Ver.0.2.0のバグを修正
2. MJ縮退マップの最新版に対応(Ver.1.0.0から内容についての変更はありません。)
* 2015-10-07 Ver.0.2.0
1.MJ縮退マップの読み込みをファイル読み込みから、WebリソースからのHTTP GETに変更。
2.コマンド引数で、出力ファイルのファイルフォーマットをJSON/TSV/CSVより選択可能な様に変更。
* 2015-09-30 Ver.0.1.1 MJ縮退マップから一意な選択Ver.0.1.1を公開。



