# 4章: Google App Engine による WordPress サイトの運営

この章では、Google App Engine（以下 GAE） を利用して WordPress サイトを公開する方法について解説する。

GAE で WordPress を動かす方法は、公式なドキュメントでチュートリアルが紹介されているが、このチュートリアルはバージョンが古い SDK をベースに解説されており、一部のコマンドが期待通りに動作しない。

本書では、本書執筆時点（2018年4月）での最新の SDK をベースに解説する。

* Google App Engine とは
* Google App Engine で WordPress を利用するメリット
* ローカル環境の準備
* Google App Engine の準備
* GAE 用の WordPress 環境をローカルに作成
* GAE へのデプロイ
* メディアのアップロード

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

GAE 上に WordPress をインストールするには、少なくとも以下のソフトウエアがインストールされている必要がある。

* Google Cloud SDK
* PHP
* MySQL クライアント + Cloud SQL Proxy

また、以下は必須ではないが、あったほうが便利なのでインストールしておく。

* WP-CLI

今回は、macOS でのセットアップ方法を解説していく。 Homebrew を使用するのであらかじめインストールしておくこと。

https://brew.sh/

### Google Cloud SDK のインストール

Google Cloud SDK とは、GCP を利用するための一連のツールで、`gcloud` などのコマンドラインツールもこれらの中に含まれる。

本書では、可能な部分はコマンドラインですすめていくので、このツールをあらかじめインストールしよう。

https://cloud.google.com/sdk/docs/quickstart-macos

詳細は後述するが、`gcloud init` コマンドを使用してこの時点で初期設定を行っておいてもよい。

### PHP のインストール

まず PHP をインストールする。今回は、本書執筆時点での最新版 PHP 7.2 をインストールしよう。

```
$ brew install php
```

### MySQL のインストール

次に MySQL をインストールしよう。 GAE を利用する際には、ローカルで MySQL サーバーを起動する必要はないが、動作確認等で必要となることもあるので、サーバーも含めてインストールする。

```
$ brew install mysql
```

macOS 起動時に MySQL を起動するには以下のコマンドを実行すればよい。

```
$ brew services start mysql
```

GAE では、Cloud SQL Proxy というローカル環境から GCP の MySQL インスタンスへ接続するためのツールも公開されているが、これは MySQL サーバーがローカルで起動していると起動しないので、Cloud SQL Proxy を起動する際には以下のコマンドで停止する必要がある。

```
$ brew services stop mysql
```

### Cloud SQL Proxy のインストール

GCP 内の MySQL にローカルから接続するためのツール、Cloud SQL Proxy をインストールしよう。 以下のサイトに記載されている方法で行えばよい。

https://cloud.google.com/sql/docs/mysql-connect-proxy#install

### WP-CLI のインストール

WordPress をコマンドラインから操作するためのツール、WP-CLI をインストールしよう。

```
$ curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
$ chmod +x wp-cli.phar
$ mv wp-cli.phar /usr/local/bin/wp
```

以上のコマンドを順番に実行したら最後に動作確認をしてみよう。 エラーが出ずに以下のような出力が得られれば問題なく動作している。

```
$ wp --info
OS:	Darwin 17.4.0 Darwin Kernel Version 17.4.0: Sun Dec 17 09:19:54 PST 2017; root:xnu-4570.41.2~1/RELEASE_X86_64 x86_64
Shell:	/bin/bash
PHP binary:	/usr/local/Cellar/php@7.0/7.0.29/bin/php
PHP version:	7.0.29
php.ini used:	/usr/local/etc/php/7.0/php.ini
WP-CLI root dir:	phar://wp-cli.phar
WP-CLI vendor dir:	phar://wp-cli.phar/vendor
WP_CLI phar path:	/Users/miya/repos/wp-gcp-log
WP-CLI packages dir:	/Users/miya/.wp-cli/packages/
WP-CLI global config:
WP-CLI project config:
WP-CLI version:	2.0.0-alpha-cb09568
```

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

今回は新しく作りたいので、`Create a new project` を選択してみよう。その後プロジェクト名の入力を求められる。

```
Enter a Project ID. Note that a Project ID CANNOT be changed later.
Project IDs must be 6-30 characters (lowercase ASCII, digits, or
hyphens) in length and start with a lowercase letter.
```

プロジェクト ID を入力する際には以下の2点に注意しよう。

* プロジェクト ID をあとから変更することはできない。
* プロジェクト ID は、GCP 全体でユニークである必要がある。

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

`tutorial-sql-instance` はインスタンス名であり、任意のインスタンス名に変更可能である。 今回は、リージョンに `asia-northeast1` (東京)を指定する。

```
$ gcloud sql instances create tutorial-sql-instance \
--region=asia-northeast1 \
--activation-policy=ALWAYS \
--tier=db-n1-standard-1
```

次に、このインスタンスの MySQL root パスワードを以下のコマンドで設定しよう。安全なパスワードを使用することを強く推奨する。

```
$ gcloud sql users set-password root % --instance=tutorial-sql-instance --password=[YOUR_MYSQL_ROOT_PASSWORD]
```

最後に、Cloud SQL Proxy を利用して、ローカル環境から MySQL に接続するためのサーバーを起動しよう。

```
$ cloud_sql_proxy \
-dir /tmp/cloudsql \
-instances=[YOUR_PROJECT_ID]:asia-northeast1:tutorial-sql-instance=tcp:3306 \
-credential_file=/path/to/credential.json
```

このコマンドでは、以下の情報を利用しているので、必要に応じて置き換えること。

* `[YOUR_PROJECT_ID]` - プロジェクト ID
* `tutorial-sql-instance` - MySQL のインスタンス名
* `/path/to/credential.json` - サービスアカウントの認証情報用JSONファイルまでのパス

コマンドが成功すると、`Ready for new connections` と表示され待機状態となる。この状態で、ローカルから `mysql` コマンドを利用して MySQL インスタンスに接続することが可能になる。

動作確認のため、mysql コマンドを使って実際に接続してみよう。

```
$ mysql -h 127.0.0.1 -u root -p
```

この Cloud SQL Proxy は、後述する `wp server` でローカルで WordPress を動作させる際に必要なものなので、別ウインドウで起動させておくとよい。

## GAE 用の WordPress 環境をローカルに作成

### WordPress 用のデータベースを作成する

以下のコマンドで、WordPress 用のデータベースを作成しよう。`[YOUR_MYSQL_ROOT_PASSWORD]` には先ほど設定した MySQL の root パスワードを、`[YOUR_WP_DB_PASSWORD]` には、WordPress 用データベースのパスワードを指定しよう。

```
$ echo 'create database tutorialdb;' | mysql -h 127.0.0.1 -u root -p
$ echo "create user 'tutorial-user'@'%' identified by '[YOUR_WP_DB_PASSWORD]';" | mysql -h 127.0.0.1 -u root -p
$ echo "grant all on tutorialdb.* to 'tutorial-user'@'%';" | mysql -h 127.0.0.1 -u root -p
```

ここで作成したデータベースのデータベース名、ユーザー名は以下の通りである。

* データベース名: `tutorialdb`
* データベースユーザー名: `tutorial-user`

### WordPress のセットアップ

GAE 用の WordPress を構築するには、Google による WordPress プロジェクト用のテンプレートが GitHub で公開されているのでそれを利用する。

```
$ git clone https://github.com/GoogleCloudPlatform/php-docs-samples.git
$ cd php-docs-samples/appengine/wordpress
$ composer install
```

以上で WordPress をセットアップするためのヘルパーコマンドがインストールされるので、それを利用して WordPress 環境を構築する。 `[YOUR_PROJECT_ID]` を実際の プロジェクト ID に、`[YOUR_WP_DB_PASSWORD]` には先ほど指定した WordPress 用のデータベースパスワードを指定しよう。

```
$ php wordpress-helper.php setup -n \
-d ./wordpress-project \
--db_region=asia-northeast1 \
--db_instance=tutorial-sql-instance \
--db_name=tutorialdb \
--db_user=tutorial-user \
-p [YOUR_PROJECT_ID] \
--db_password=[YOUR_WP_DB_PASSWORD]
```

WordPress の準備が完了したので WP-CLI コマンドを利用してローカルで WordPress を動かしてみよう。WP-CLI には `wp server` という PHP のビルトインコマンドを利用したサーバーを起動するためのコマンドがあるので、それを利用すればローカル環境にウェブサーバーがインストールされている必要はない。

まず、以下のコマンドを実行して WP-CLI の設定ファイルを作成して WordPress のドキュメントルートを指定する。

```
$ cd wordpress-project
$ echo "path: wordpress" > wp-cli.yml
```

次に WordPress を動作させるためのサーバーを起動しよう。

```
$ wp server
```

ブラウザで、`http://localhost:8080` にアクセスして WordPress のインストーラーが表示されていれば成功である。 ついでにインストールを完了させておこう。

![](https://www.evernote.com/l/ABUfoesBDoxNmor44A4unJYvSQ4qRqZT2MgB/image.png)

### WordPress 本体、プラグイン、テーマ、言語ファイルのアップデート

WordPress を安全に利用するには常に最新の状態に保っておく必要がある。

GAE 上では、直接ブラウザからアップデートを行うことができないため、上述した `wp server` 環境下でアップデートを行うか WP-CLI を使用してアップデートしよう。

```
$ wp core update
$ wp plugin update --all
$ wp theme update --all
$ wp core language update
```

### Google Cloud Storage plugin の有効化

GAE では、WordPress プラグインを管理画面からアップロードすることができないため、ローカルでインストールする必要がある。一見煩雑に感じるかもしれないが、ウェブブラウザから PHP ファイルをアップロードされるリスクがないことは安全上好ましいことであり、WP-CLI を使用すればローカルでプラグインをインストールし有効化することができる。

上述した `php wordpress-helper.php` を使用すれば Google Cloud Storage plugin というプラグインがインストールされるのでまずこれを有効化しよう。

以下のコマンドは `wordpress-project/` 以下で実行する必要があることに注意すること。

```
$ wp plugin activate gcs
```

このプラグインは GAE 上でメディアをアップロードできるようにするために必要なのでかならず有効化しておくこと。

もし、Contact Form 7 をインストールするなら以下のようなコマンドを実行する。

```
$ wp plugin install contact-form-7
```

上のコマンドで使用した `contact-form-7` という文字列は、スラッグと呼ばれるものであり、WordPress の公式プラグインリポジトリ上の URL に使用されている文字列である。

https://wordpress.org/plugins/contact-form-7/

このスラッグには以下のように .zip ファイルまでの URL を使用することもできる。

```
$ wp plugin install https://downloads.wordpress.org/plugin/contact-form-7.5.0.1.zip
```

この時点でインストールしたプラグインはあくまでもローカルにだけ存在しているものであるが、WordPress では有効化されたプラグインの情報をデータベースに保存しており、ローカルでインストールしたプラグインを実際に有効化する際には、その前にかならず後述する方法でデプロイする必要がある。

デプロイが終わった後は WordPress の管理画面で有効化するか、以下のように WP-CLI コマンドを利用してローカルから有効化することも可能である。

```
$ wp plugin activate contact-form-7
```

その他のコマンドについては、WP-CLI のドキュメンテーションや `wp help` を確認していただきたい。

## GAE へのデプロイ

GAE に WordPress をデプロイするには、以下のコマンドを実行するだけでよい。 デプロイには約5分ほどかかるようだ。

```
$ gcloud app deploy
```

はじめてこのコマンドを実行する際にはリージョンを選択する必要があるので、`asia-northeast1`（東京）を選択しよう。

```
Please choose the region where you want your App Engine application
located:

 [1] europe-west3  (supports standard and flexible)
 [2] us-east1      (supports standard and flexible)
 [3] europe-west2  (supports standard and flexible)
 [4] us-central    (supports standard and flexible)
 [5] us-east4      (supports standard and flexible)
 [6] europe-west   (supports standard and flexible)
 [7] asia-south1   (supports standard and flexible)
 [8] australia-southeast1 (supports standard and flexible)
 [9] asia-northeast1 (supports standard and flexible)
 [10] northamerica-northeast1 (supports standard and flexible)
 [11] southamerica-east1 (supports standard and flexible)
 [12] cancel
Please enter your numeric choice:  9
```

デプロイが完了したら、以下のコマンドを実行すればブラウザで開くことができる。

```
$ gloud app browse
```

## メディアのアップロード

WordPress の投稿画面からメディアのアップロードを可能にするためには、Cloud Storage を設定する必要がある。

まず、先に述べた Google Cloud Storage plugin が有効化されていることを確認する。

```
$ wp plugin status gcs
Plugin gcs details:
    Name: Google Cloud Storage plugin
    Status: Active
    Version: 0.1.2 (Update available)
    Author: Google Inc
    Description: A plugin for uploading media files to Google Cloud Storage
```

次に、Google Cloud Storage plugin の管理画面でメディアをアップロードするためのバケット名を指定する。

![](https://www.evernote.com/l/ABVb-Wq7Q5hMyIoQsUmtdRzxynxfcRK3kYcB/image.png)

バケットは以下のコマンドで新規に作成することができる。

```
$ gsutil mb gs://[You_Bucket_Name]
```

`[You_Bucket_Name]` は任意のバケット名で、GCP 全体でユニークな名前である必要があるので注意しよう。もしすでに存在しているバケット名を指定すると以下のようなエラーが出る。

```
$ gsutil mb gs://wordpress
Creating gs://wordpress/...
ServiceException: 409 Bucket wordpress already exists.
```

次にこのバケットに対するウェブ経由での閲覧を許可しよう。

```
$ gsutil iam ch allUsers:objectViewer gs://[You_Bucket_Name]
```

以上で Cloud Storage の準備が完了したので WordPress に移動して、さきほどの Google Cloud Storage plugin の管理画面でこのバケット名を入力しよう。

最後に念のためメディアをアップロードして動作確認しておくことをおすすめする。

![](https://www.evernote.com/l/ABX9Jj_4HzdCFaHxDLLAQ-5gavpmdip1CosB/image.png)

## GAE の感想

まずパフォーマンスについてあるが、100 クライアントから 10,000 アクセスというそこそこハードな条件でベンチマークを行ったところ、一つもエラーがでかったことは特筆すべきであり、高トラフィックなサイトでインフラの運用コストを抑えたい場合には大きく貢献してくれるであろう。

```
$ h2load -c 100 -n 10000 https://wp-miya.appspot.com/
starting benchmark...
spawning thread #0: 100 total client(s). 10000 total requests
TLS Protocol: TLSv1.2
Cipher: ECDHE-RSA-AES128-GCM-SHA256
Server Temp Key: ECDH P-256 256 bits
Application protocol: h2
progress: 10% done
progress: 20% done
progress: 30% done
progress: 40% done
progress: 50% done
progress: 60% done
progress: 70% done
progress: 80% done
progress: 90% done
progress: 100% done

finished in 193.36s, 51.72 req/s, 2.64MB/s
requests: 10000 total, 10000 started, 10000 done, 10000 succeeded, 0 failed, 0 errored, 0 timeout
status codes: 10000 2xx, 0 3xx, 0 4xx, 0 5xx
traffic: 511.02MB (535847211) total, 371.78KB (380700) headers (space savings 89.18%), 509.55MB (534300000) data
                     min         max         mean         sd        +/- sd
time for request:   372.36ms       6.23s       1.86s    996.61ms    60.19%
time for connect:   429.52ms    473.09ms    458.45ms      8.94ms    64.00%
time to 1st byte:   992.89ms       4.18s       2.73s    770.73ms    62.00%
req/s           :       0.52        0.58        0.54        0.01    68.00%
```

一方で体感速度はやや遅く感じた。リージョンに東京を選択したのでレイテンシーはそれほどないはずなので、もしかしたら工夫次第で改善の余地があるかもしれない。

ただし、Google が提供するモバイルスピードの診断ツールでは良い結果がでたので、デフォルトのままでも問題になるほど遅いわけではない。

![](https://www.evernote.com/l/ABW1S5G3-U1Id67SvtX64aFr6ndpjzc29hIB/image.png)

前の章でも述べられているが、メールについてはいろいろノウハウの蓄積が必要かもしれないと思った。GAE では PHP の `mail()` が利用できないので何らかの外部サービスとの連携が必須である。

今回、この章では可能な限りコマンドラインツールを使用して WordPress を構築していった。一度プロジェクトを作成してしまうとほぼすべての操作がコマンドラインから可能であり、これは Git と CI を組み合わせたデプロイの自動化で大きな威力を発揮してくれると思う。

また、Cloud SQL Proxy というローカル環境から GCP 上の MySQL へ接続するためのツールのおかげで、WP-CLI との相性がとてもよかった。特別な動機作業を行うことなく `wp server` 本番とほぼ同じ状態のローカル開発環境が起動するのは素晴らしいと思う。ただしうっかり本番環境の DB を書き換えてしまうリスクもあり、そこは注意スべきことかもしれない。
