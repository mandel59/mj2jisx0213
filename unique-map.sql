-- SQLite

-- Copyright (c) 2020 Ryusei Yamaguchi
--
-- Permission is hereby granted, free of charge, to any person obtaining a copy
-- of this software and associated documentation files (the "Software"), to deal
-- in the Software without restriction, including without limitation the rights
-- to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
-- copies of the Software, and to permit persons to whom the Software is
-- furnished to do so, subject to the following conditions:
--
-- The above copyright notice and this permission notice shall be included in
-- all copies or substantial portions of the Software.
--
-- THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
-- IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
-- FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
-- AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
-- LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
-- OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
-- THE SOFTWARE.

WITH
t1 AS (
    SELECT
        MJ文字図形名,
        縮退UCS,
        縮退X0213,
        '別紙参照' AS 規則,
        0 AS rank
    FROM 例外情報
    UNION ALL
    SELECT
        MJ文字図形名,
        縮退UCS,
        縮退X0213,
        'JIS包摂規準・UCS統合規則' AS 規則,
        1000 AS rank
    FROM mjsm_JIS包摂規準UCS統合規則
    UNION ALL
    SELECT
        MJ文字図形名,
        縮退UCS,
        縮退X0213,
        '民二5202号通知別表 正字・俗字等対照表' AS 規則,
        2000
        AS rank
    FROM (
        SELECT *
        FROM mjsm_民二5202号通知別表_正字俗字等対照表
        WHERE (MJ文字図形名, 縮退UCS) NOT IN (
            SELECT MJ文字図形名, 縮退UCS
            FROM mjsm_民一2842号通達別表_誤字俗字正字一覧表_別字
        )
    )
    UNION ALL
    SELECT
        MJ文字図形名,
        縮退UCS,
        縮退X0213,
        '戸籍統一文字情報 親字・正字' AS 規則,
        3000
        + ホップ数 * 100
        + ((MJ文字図形名, 縮退UCS) NOT IN (
            SELECT MJ文字図形名, 縮退UCS
            FROM mjsm_民一2842号通達別表_誤字俗字正字一覧表_無印
        ) AND (MJ文字図形名, 縮退UCS) NOT IN (
            SELECT MJ文字図形名, 縮退UCS
            FROM mjsm_民一2842号通達別表_誤字俗字正字一覧表_俗字
        )) * 10
        AS rank
    FROM (
        SELECT *
        FROM mjsm_戸籍統一文字情報_親字正字
        WHERE (MJ文字図形名, 縮退UCS) NOT IN (
            SELECT MJ文字図形名, 縮退UCS
            FROM mjsm_民一2842号通達別表_誤字俗字正字一覧表_別字
        )
    )
    UNION ALL
    SELECT
        MJ文字図形名,
        縮退UCS,
        縮退X0213,
        '民一2842号通達別表 誤字俗字・正字一覧表' AS 規則,
        4000
        + ((MJ文字図形名, 縮退UCS) NOT IN (
            SELECT MJ文字図形名, 縮退UCS
            FROM mjsm_民一2842号通達別表_誤字俗字正字一覧表_無印
        ) AND (MJ文字図形名, 縮退UCS) NOT IN (
            SELECT MJ文字図形名, 縮退UCS
            FROM mjsm_民一2842号通達別表_誤字俗字正字一覧表_俗字
        )) * 10
        AS rank
    FROM (
        SELECT *
        FROM (
            SELECT * FROM mjsm_民一2842号通達別表_誤字俗字正字一覧表_無印
            UNION ALL
            SELECT * FROM mjsm_民一2842号通達別表_誤字俗字正字一覧表_俗字
        )
        WHERE (MJ文字図形名, 縮退UCS) NOT IN (
            SELECT MJ文字図形名, 縮退UCS
            FROM mjsm_民一2842号通達別表_誤字俗字正字一覧表_別字
        )
    )
    UNION ALL
    SELECT
        MJ文字図形名,
        縮退UCS,
        縮退X0213,
        '法務省告示582号別表第四' AS 規則,
        5000
        + 順位 * 100
        AS rank
    FROM (
        SELECT *
        FROM mjsm_法務省告示582号別表第四_一
        WHERE (MJ文字図形名, 縮退UCS) NOT IN (
            SELECT MJ文字図形名, 縮退UCS
            FROM mjsm_民一2842号通達別表_誤字俗字正字一覧表_別字
        )
    )
),
t2 AS (
    SELECT MJ文字図形名, 縮退UCS, 縮退X0213, 規則,
        rank
        + coalesce(
            (
                SELECT
                    CASE
                        WHEN 漢字施策 = '常用漢字' THEN 1
                        WHEN 漢字施策 = '人名用漢字' AND X0213 BETWEEN '1-16-01' AND '1-47-51' THEN 2
                        WHEN 漢字施策 = '人名用漢字' AND X0213 BETWEEN '1-48-01' AND '1-84-06' THEN 3
                        WHEN 漢字施策 = '人名用漢字' AND X0213 BETWEEN '1-14-01' AND '1-94-94' THEN 4
                        ELSE 5
                    END
                FROM mji
                WHERE mji.実装したUCS = t.縮退UCS
            ),
            0
        )
        AS rank
    FROM t1 AS t
),
t3 AS (
    SELECT *
    FROM t2
    WHERE (MJ文字図形名, rank) IN (
        SELECT MJ文字図形名, min(rank)
        FROM t2
        GROUP BY MJ文字図形名
    )
)
SELECT
    mji.MJ文字図形名,
    printf('U+%04X', unicode(coalesce(縮退UCS, '＿'))) AS UCS,
    coalesce(縮退X0213, '1-01-18') AS "JIS X 0213",
    coalesce(規則, '候補なし') AS 備考,
    rank
FROM mji
LEFT JOIN t3 as t ON t.MJ文字図形名 = mji.MJ文字図形名
