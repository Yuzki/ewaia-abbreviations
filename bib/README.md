# 文献表

## 印仏学会：ヴェーダ関係略号一覧

https://www.jaibs.jp/journal/submit

- `jaibs-1.json`: 1次文献
- `jaibs-2.json`: 2次文献
- `jaibs-language.txt`: 言語名 (そのまま)
- `jaibs-sign.txt`: 記号 (そのまま)
  
**注**
JSON形式への変換はChatGPT (GPT-3.5) による


## EWAia: Abkürzungsverzeichnis

Mayrhofer, Manfred. 1992–2001. Etymologisches Wörterbuch des Altindoarischen. Heidelberg: Winter (Bearbeitet 1985–, in den Faszikeln erschienen 1986–).


**Note**
- CSV is created by ChatGPT (GPT-3.5).
- Typos are due to OCR.
- Errors in type are due to ChatGPT.

> 以下に略号の一覧を挙げます。続いてその略号の正式名称の一覧を挙げます。正式名称の前には "=" がついていますが、以下ではその記号は無視し> てください。また、途中の改行も消してください。それをもとにして```略号,正式名称,種別```というcsv形式を作ってください。種別は、正式名称> が言語名ならば 'language', 文献名ならば 'reference', 文法事項ならば 'grammar', それ以外は 'other'としてください。各フィールドに ',> ' が含まれていた場合はダブルクオーテーションで囲うことで特殊文字をエスケープしてください。例は以下のとおりです。
> 
> [INPUT]
> ```
> A.
> AArmL
> Aav.
> AAWL
> Abaev
> AbhAkWiss[ ] .
> Ab1Du
> AblPI
> Ab1Sg
> AC
> AcNeoph
> AcOr
> Ae.
> Ahd.
> Aia.
> AiGr
> AION
> = Anmerkung [- Anm.].
> = Annual of Armenian Linguistics. Clevelaod,
> Ohio.
> =- Altavestisch.
> = Abhandlungen der geistes- und sozialwissen-
> schaftlichen Klasse der Akademie der W1Ssen-
> schaften und der Literatur in Mainz.
> = V. I. Abaev, Istoriko-Etimologiceskij Slovar'
> Osetinskogo Jazyka. Moskau-Leningrad Bd. I
> (1958) ff.
> = Abhandlungen der [ ] Akademie der Wissen-
> schaften. [Philosoph.-histor. Klasse).
> = Ablativ Dual.
> = Ablativ Plural.
> = Ablativ Singular.
> = L'antiquite classique. Brüssel.
> = Acta Neophilologica. Laibach.
> = Acta Orientalia, ediderunt Societates Orientales
> Danica Fennica Norvegica Svecica. Kopenhagen.
> = Altenglisch.
> = Althochdeutsch.
> = Altindoarisch.
> = J. Wackemagel (- A. Debrunner - L. Renou -
> R. Hauschild), Altindische Grammatik. Göttin-
> gen, Bd. I (1896) ff'.
> = Annali del Seminario di Studi del Mondo Clas-
> sico, Sezione linguistica. Pisa. (1 (1979) ff.; löst
> AION-L ab].
> ```
> [/INPUT]
> 
> 上記の入力を受け取ったら以下を出力します。
> 
> [OUTPUT]
> ```
> "A.","Anmerkung [- Anm.].",other
> "AArmL","Annual of Armenian Linguistics. Clevelaod, Ohio.",reference
> "Aav.","Altavestisch.",language
> "AAWL","Abhandlungen der geistes- und sozialwissenschaftlichen Klasse der Akademie der Wissenschaften und der Literatur in > Mainz.",reference
> "Abaev","V. I. Abaev, Istoriko-Etimologiceskij Slovar' Osetinskogo Jazyka. Moskau-Leningrad Bd. I (1958) ff.",reference
> "AbhAkWiss[ ] ."","Abhandlungen der [ ] Akademie der Wissenschaften. [Philosoph.-histor. Klasse).",reference
> "AblDu","Ablativ Dual.",grammar
> "AblPl","Ablativ Plural.",grammar
> "AblSg","Ablativ Singular.",grammar
> "AC","L'antiquite classique. Brüssel.",reference
> "AcNeoph","Acta Neophilologica. Laibach.",reference
> "AcOr","Acta Orientalia, ediderunt Societates Orientales Danica Fennica Norvegica Svecica. Kopenhagen.",reference
> "Ae.","Altenglisch.",language
> "Ahd.","Althochdeutsch.",language
> "Aia.","Altindoarisch.",language
> "AiGr","J. Wackemagel (- A. Debrunner - L. Renou - R. Hauschild), Altindische Grammatik. Göttingen, Bd. I (1896) ff.",> reference
> "AION","Annali del Seminario di Studi del Mondo Classico, Sezione linguistica. Pisa. (1 (1979) ff.; löst AION-L ab].",> reference
> ```
> [/OUTPUT]
> 
> この例のようにして、以下の入力に対してcsvを作って下さい。
> 
> [INPUT]
> ```
> ...
> ```
> [/INPUT]
