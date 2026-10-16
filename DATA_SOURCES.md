# データの出典と来歴

## 原資料と変換

Manfred Mayrhofer, *Etymologisches Wörterbuch des Altindoarischen*, Heidelberg: Winter, 1992–2001 の Abkürzungsverzeichnis を出典として、SktTool の `bib/README.md` が記録しています。OCR 後、ChatGPT (GPT-3.5) で略号・正式名称・種別の CSV に整形しています。OCR 誤字と分類の誤りがあるという原記録を保持しています。書誌の参考: [CiNii Research](https://cir.nii.ac.jp/crid/1971993809670356013)。書誌情報は再利用許諾の証拠ではありません。

| 生成元 CSV / JSON キー | 件数 |
| --- | ---: |
| `bib/EWAia-I.csv` | 515 |
| `bib/EWAia-I-New.csv` | 142 |
| `bib/EWAia-II.csv` | 18 |
| `bib/EWAia-III.csv` | 257 |
| 合計 | 932 |

`bib/web/joincsv.py` が表の順序で読み込み、`bib/web/ewaia.json` に出力します。各配列の各行は `abbreviation`, `full`, `type` の文字列 3 列です。生成処理は元の順序・空白・綴り・分類を保持します。`report`, `literature`, `übrige`, ` reference` も原値です。ファイル名だけでは各 CSV の原資料の巻・版・ページや I-New の具体的対応は確認できません。

## 根拠となる履歴

以下は [SktTool](https://github.com/Yuzki/SktTool) の原コミット ID です。独立化では対象パスのみを残したため、新履歴の SHA は異なります。対応表と復旧用履歴はローカルの作業引継ぎに保存しています。

| 原コミット | 内容 |
| --- | --- |
| [c6caf1f](https://github.com/Yuzki/SktTool/commit/c6caf1f) | CSV と出典説明 (2023-10-21) |
| [fcd7b48](https://github.com/Yuzki/SktTool/commit/fcd7b48) | 修正 (2023-10-23) |
| [917e766](https://github.com/Yuzki/SktTool/commit/917e766) | JSON 生成処理・生成物 (2023-10-23) |
| [ac8ef75](https://github.com/Yuzki/SktTool/commit/ac8ef75) | Web 検索 (2023-10-23) |
| [ea074cc](https://github.com/Yuzki/SktTool/commit/ea074cc) | GPL v3 の LICENSE 追加 (2024-07-05) |
| [af1da5b](https://github.com/Yuzki/SktTool/commit/af1da5b) | データ取得 URL の変更 (2024-07-15) |
| [be5b132](https://github.com/Yuzki/SktTool/commit/be5b132), [34ee6f1](https://github.com/Yuzki/SktTool/commit/34ee6f1) | 検索 HTML の変更 (2025-05-21) |

対象コード・CSV の git author には Yuzki と Yuzuki Tsukagoshi の名義があります。git の記録だけでは同一人であること、全寄与の権利保有、外部コード不使用は証明できません。履歴には当時の文書・権利表示も保持しています。文書に他機能への言及があっても、対象外コード・データは独立化した履歴に含めていません。

## 権利の確認状況

確認できるのは、旧リポジトリに GPL v3 本文が置かれていたことと上記の出典・処理説明です。現行の LICENSE も旧本文を保持しています。独立プロジェクトでのコード条件は権利保有確認とユーザーの選択待ちであり、v3-only / or-later も推定していません。過去の GPL 配布の扱いを変更するものではありません。

以下は未確認です。

- 各 CSV に対応する原資料の巻・版・ページ、OCR 元の入手経路、スキャンの利用条件。
- 原資料の権利表示、現在の権利者、再配布許諾と適用できるデータ条件。
- 自作コードの全寄与に対する再許諾権と外部由来コードの有無。

OCR・AI 変換を経たことや短い略号であることだけで自由利用可能と判断していません。コードのライセンス選択をデータへ一括適用せず、MIT・CC BY・CC0 等を未確認のデータに付与していません。条件が確定するまで新規公開・配布を保留します。Bootstrap / Popper の MIT 条件は別に維持します（ルート README 参照）。
