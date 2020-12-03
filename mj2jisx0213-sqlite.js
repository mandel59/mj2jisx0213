const fs = require("fs")
const path = require("path")
const Database = require("better-sqlite3")
const 例外情報 = require("./exceptions").例外情報

const db = new Database(path.join(__dirname, "node_modules/@mandel59/mojidata/dist/moji.db"))

db.exec(`create temporary table 例外情報 (MJ文字図形名, 縮退UCS, 縮退X0213)`)
const insert = db.prepare(`insert into 例外情報 VALUES (@mj, @ucs, @x0213)`)

function parseUCS(code) {
    return String.fromCodePoint(parseInt(code.slice(2), 16))
}

例外情報.forEach(({
    MJ文字図形名: mj,
    変換情報: { "JIS X 0213": x0213, UCS: ucs }
}) => {
    insert.run({ mj, ucs: parseUCS(ucs), x0213 })
})

const query = fs.readFileSync(path.join(__dirname, "unique-map.sql"), "utf-8")

const 変換テーブル = []
for (const row of db.prepare(query).iterate()) {
    変換テーブル.push({
        MJ文字図形名: row["MJ文字図形名"],
        変換先: {
            "JIS X 0213": row["JIS X 0213"],
            UCS: row["UCS"]
        },
        備考: row["備考"],
        // rank: row.rank,
    })
}

function JSONデータ(変換テーブル) {
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

fs.writeFileSync("変換テーブル-sqlite.json", JSONデータ(変換テーブル))
