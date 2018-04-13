# wp-gcp-log
WordPressをGCPに移行するまでのログを綴った書籍。技術書店 #4 で頒布予定。

## ファイル構成

```
wp-gcp-log
│
├ README.md このファイル
│
├ images 原稿を配置するフォルダ
│
├ manuscripts 原稿を配置するフォルダ
│
└ toc.md 目次
```

## 執筆方法

`manuscripts` フォルダに原稿を配置します。
原稿の命名規則は `01_chapter.md` のように、 `章番号_分類.md` です。分類には次のものがあります。

- _title_ タイトルページ
- _chapter_ 章
- _toc_ 目次
- _colophon_ 奥付

### リンク

紙の本と電子書籍の両方を作成する（予定）なので、普通のリンクタグを利用してください。いい感じに脚注として表示されるようになるはずです。マークダウンでは`[リンク文字](URL)`と表記します。

### 画像の命名規則

画像ファイルはimagesフォルダ内に`02_01_graph.jpg`という具合に`賞番号_ファイル内連番_画像名`にしてください。

ファイルの追加・修正などはプルリクエストを送ってください。

## コンパイル

マークダウンなのでそのままでも出力できますが、HTMLや出版物を出力するコマンドがいくつかあります。

### HTMLへのビルド

```
# npmでライブラリをインストール
npm install
# HTMLを出力
npm build
# BrowserSyncで表示する
npm start
```

上記のコマンドを入力し、[localhost:3000/manuscripts/00_toc.html](https://localhost:3000/manuscripts/00_toc.html)へアクセスすると、目次が表示されます。

### PDFへのビルド

W.I.P

### ePubへのビルド

W.I.P

## ライセンス

ソースコードはMITライセンスです。

`manuscripts`ディレクトリおよび`images`ディレクトリのすべてのコンテンツは<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">クリエイティブ・コモンズ 表示 - 非営利 - 継承 4.0 国際 ライセンス</a>の下に提供されています。

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="クリエイティブ・コモンズ・ライセンス" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/80x15.png" /></a>