# 4章: Google App Engine による WordPress サイトの運営

この章では、Google App Engine（以下 GAE） を利用して WordPress サイトを運営する方法について解説する。

## Google App Engine とは

Google App Engine とは、Google Cloud Platform によって提供されるサービスの一つであり、PaaS (Platform As A Service) の一つである。

前章で述べた Google Compute Engine は、利用者のニーズに応じて好きな言語やフレームワーク等をインストールできるという点でユーザーにとっては非常に自由度の高いサービスであるが、サーバーにインストールされる OS やミドルウエア、さらに冗長化構成などもユーザー自身で構成し管理する必要がある。

一方で、GAE はフルマネージドサービスであるため、インフラ構成やスケーリングなどの運用上の問題を大幅に軽減してコンテンツの運用に集中することが可能であるが、限られた言語や API の中で利用していくことを要求される。

## Google App Engine で WordPress を利用するメリット

GAE では、サービスリリース後の初期の段階から PHP の実行が可能であり、WordPress を利用することも可能である。

GAE 上で WordPress を可動させれば、OS やミドルウエアのアップデート、特にセキュリティパッチなどの適用にわずらわされることなく、突発的なトラフィックの増大に際しての スケーリング も自動的に行なってくれる。

このことにより、ウェブマスターはインフラの管理という付加価値を産まない重労働から開放され、価値のあるコンテンツをつくることに集中することが可能になる。

## ローカル環境の準備

はじめにローカル環境に必要なソフトウエアをインストールしてみよう。

GAE 上に WordPress をインストールするには、少なくとも以下のソフトウエアがインストールされている必要である。

* PHP
* MySQL + Cloud SQL Proxy
* WP-CLI

今回は、macOS でのセットアップを順に解説していく。

## Google App Engine の準備

### 新しいプロジェクトを作成する

まず、以下のコマンドを実行して新しいプロジェクトを作成しよう。

```
$ gcloud init
```

このコマンドを初めて実行した場合には、以下のようにブラウザで oAuth でのログイン画面が開くので、Google Cloud を利用したい Google アカウントでログインしてみよう。

![](https://www.evernote.com/l/ABVSmjxw4-JEVKuztxOY_aVGVU6dvbgxOWcB/image.png)

次に、どのプロジェクトを使用するかの質問が表示される。

```
Pick cloud project to use:
 [1] xxxx-xxxxx
 [2] Create a new project
Please enter numeric choice or text value (must exactly match list
item):  
```

今回は新しく作りたいと思いますので、`Create a new project` を選択してみよう。その後プロジェクト名の入力を求められる。

```
Enter a Project ID. Note that a Project ID CANNOT be changed later.
Project IDs must be 6-30 characters (lowercase ASCII, digits, or
hyphens) in length and start with a lowercase letter.
```

プロジェクト ID を入力する際には以下の2点にご注意しよう。

* プロジェクト ID をあとから変更することはできない。
* プロジェクト ID は、GCP 全体でユニークである必要があるので、`capitalp-wordpress` などのようにプレフィックスをつけるとよい。

### 課金を有効化する

次に GCP のダッシュボードに移動して課金を有効化しよう。

https://console.cloud.google.com/home/dashboard

まず以下のように、左側のメニューでお支払いをクリックする。

![](https://www.evernote.com/l/ABVUYCkdR5lC_Y_jS28Z1sj8SDw9dVhoHb4B/image.png)

次に画面の指示に従って請求先アカウントをリンクしよう。その後以下のような画面になれば成功である。

![](https://www.evernote.com/l/ABULHs4AE7RMBL1f7Xim5rTwpt2guy1R9SsB/image.png)

### API の有効化

`gcloud` コマンドで GAE で WordPress を動作させるために必要な2つのサービスを有効化しよう。

```
$ gcloud services enable compute.googleapis.com sqladmin.googleapis.com
```

筆者がためしたところ、このコマンドのレスポンスはとても不安定で何度か失敗したりやたら時間がかかったりするので、根気よく試してみよう。

### サービスアカウントの作成

次に、API に接続するためのサービスアカウントを作成するために以下の URL にアクセスしよう。

https://console.cloud.google.com/apis/credentials

![](https://www.evernote.com/l/ABVbRNIFNURGTapnLnUBbKpn4UVuXCXns3EB/image.png)

「認証情報を作成」クリックすると以下のようにプルダウンメニューが表示されるので、「サービスアカウントキー」を選択。

![](https://www.evernote.com/l/ABXDSb0BhT5OP4uBsC_5JNYyFgdKBWwm61UB/image.png)

次に以下の画面で必要な権限を割り当てよう。

まず、サービスアカウント名には任意の文字列たとえば「プロジェクト編集者」と入力し、次に役割で [Project] - [編集者] を選択。最後にキーのタイプで [JSON] を選択し、作成をクリックしよう。

![](https://www.evernote.com/l/ABUUA3KEqGlKDIWFqo-twUq2NhTgOXXZq1AB/image.png)

JSON ファイルがダウンロードされるので、このファイルはどこかに大切に保存しよう。もし紛失した場合は、あたらしくサービスアカウントを作成する必要がある。

### MySQL の作成

まず、以下のコマンドで Cloud SQL 第2世代インスタンスを作成して、MySQL サーバーを起動しよう。

`tutorial-sql-instance` はインスタンス名であり、任意のインスタンス名に変更可能である。

```
gcloud sql instances create tutorial-sql-instance \
    --activation-policy=ALWAYS \
    --tier=db-n1-standard-1
```

次に、このインスタンスの MySQL root パスワードを以下のコマンドで設定しよう。この例ではパスワードに `xxxx` という文字列を使用しているが、安全なパスワードを使用することを強く推奨する。

```
$ gcloud sql users set-password root % --instance=tutorial-sql-instance --password=xxxx
```

最後に、Cloud SQL Proxy を利用して、ローカル環境から MySQL に接続するためのサーバーを起動しよう。

```
cloud_sql_proxy \
    -dir /tmp/cloudsql \
    -instances=capitalp-wordpress:us-central1:tutorial-sql-instance=tcp:3306 \
    -credential_file=/path/to/credential.json
```

このコマンドでは、以下の情報を利用しているので、必要に応じて置き換えること。

* `capitalp-wordpress` - プロジェクト ID
* `tutorial-sql-instance` - MySQL のインスタンス名
* `/path/to/credential.json` - サービスアカウントの認証情報用JSONファイルまでのパス

コマンドが成功すると、`Ready for new connections` と表示され待機状態となる。この状態で、ローカルから `mysql` コマンドを利用して MySQL インスタンスに接続することが可能になる。

では、mysql コマンドを使って実際に接続してみよう。

```
$ mysql -h 127.0.0.1 -u root -p
```

## Google App Engine へのデプロイ

## Advanced Tips
