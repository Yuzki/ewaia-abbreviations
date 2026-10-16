# EWAia Abbreviation Search

Manfred Mayrhofer の *Etymologisches Wörterbuch des Altindoarischen* (EWAia) の略号・正式名称を検索する静的サイトです。略号と正式名称の大文字小文字を区別しない部分一致で検索し、略号・正式名称・種別を元の順序で表示します。

[SktTool](https://github.com/Yuzki/SktTool) の関連コード・CSV・出典説明をコミット履歴とともに独立させました。経緯と対象は [SktTool issue #4](https://github.com/Yuzki/SktTool/issues/4) を参照してください。EWAia 本文検索、Register、JAIBS 略号、その他の Sanskrit ツールは含みません。

## ローカルで使う

リポジトリ直下で実行します。Python 3 と uv が必要です。

```sh
uv run python -m http.server 8000 --bind 127.0.0.1
```

<http://127.0.0.1:8000/> を開くと `bib/web/search.html` へ移動します。JSON は同じサイト内の `bib/web/ewaia.json` から取得し、SktTool のデータ配信には依存しません。相対 URL のため GitHub Pages 等のサブパスでも使用できます。公開設定はこのリポジトリの作業に含みません。

文字入力で検索します。チェックボックスの変更は次の入力で反映されます。空文字を入力した場合は選択対象の全件、両チェックが OFF の場合は 0 件になります。既存の Search ボタンには処理がありません。この動作と既存の画面は独立化に際して維持しています。

## データを再生成する

```sh
uv run python bib/web/joincsv.py
```

Python 標準ライブラリのみで 4 CSV から 932 件を生成します。スクリプトの絶対パスを指定すれば別の作業ディレクトリからも実行できます。JSON のキー、行順、文字列、種別を保持し、必要なヘッダーや値の欠落はエラーとして報告します。空白の除去、重複排除、Unicode 正規化、OCR 修正は行いません。

原資料・CSV の対応・変換経緯・権利上の未確認事項は [DATA_SOURCES.md](DATA_SOURCES.md)、出典説明は [bib/README.md](bib/README.md) を参照してください。OCR と ChatGPT (GPT-3.5) による変換を含み、誤字と種別の誤りがあります。

## 依存と条件

画面は CDN の Bootstrap 5.0.2 (CSS/JS) と Popper 2.9.2 (JS) を既存の SRI 付きで読み込みます。これらは MIT ライセンスです（[Bootstrap](https://github.com/twbs/bootstrap/blob/v5.0.2/LICENSE)、[Popper](https://github.com/floating-ui/floating-ui/blob/v2.9.2/LICENSE.md)）。第三者の著作権・ライセンス条件は維持されます。CDN の利用にはネットワーク接続が必要です。

このプロジェクトの自作コードは MIT ライセンスです（[LICENSE](LICENSE)、著作権者 Yuzuki Tsukagoshi）。ユーザー確認に基づく選択であり、SktTool での過去の GPL 配布を変更・取り消すものではありません。略号データの再配布条件は未決定です。原資料の権利表示・再配布許諾・データ条件を確認できるまで、データの公開・配布は保留しています。コードの MIT 条件をデータへ適用せず、データに MIT や CC 条件を推定で付与していません。

SktTool 側の移転案内・リダイレクトは別作業です。UI 統一・翻訳・機能追加・OCR 修正もこの独立化の範囲外です。
