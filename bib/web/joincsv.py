import pandas as pd
import json

# 4つのCSVファイルのファイル名
csv_files = ["bib/EWAia-I.csv", "bib/EWAia-I-New.csv", "bib/EWAia-II.csv", "bib/EWAia-III.csv"]

# CSVファイルからデータを読み取る
data = {}
for file in csv_files:
    df = pd.read_csv(file)
    # CSVファイルのヘッダーを列名として使用
    data[file] = df.to_dict(orient='records')

# JSONファイルにデータを書き込む
with open('bib/web/ewaia.json', 'w') as json_file:
    json.dump(data, json_file, indent=4)

print('JSONファイルが作成されました: output.json')
