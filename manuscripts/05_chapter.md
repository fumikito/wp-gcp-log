4章: Google App Engine による WordPress サイトの運営

この章では、Google App Engine（以下 GAE） を利用して WordPress サイトを運営する方法について解説する。

## Google App Engine とは

Google App Engine とは、Google Cloud Platform によって提供されるサービスの一つであり、PaaS (Platform As A Service) サービスの一つである。

前章で述べた Google Compute Engine は、root 権限が与えられ利用者のニーズに応じて好きな言語やフレームワークを利用できるが、サーバーにインストールされる OS やミドルウエア、さらに冗長化構成などもユーザー自身で構成し管理する必要がある。

一方で、GAE はフルマネージドサービスであるため、インフラ構成やスケーリングなどの運用上の問題を大幅に軽減してコンテンツの運用に集中することが可能であるが、限られた言語や API の中で利用していくことを要求される。

## Google App Engine で WordPress を利用するメリット

GAE では、サービスリリース後の初期の段階から PHP の実行が可能であり、WordPress を利用することも可能である。

GAE 上で WordPress を可動させれば、OS やミドルウエアのアップデート、特にセキュリティパッチなどの適用にわずらわされることなく、突発的なトラフィックの増大に際しての スケーリング も自動的に行なってくれる。

このことによりウェブマスターは、インフラの管理という付加価値を産まない重労働から開放され、価値のあるコンテンツをつくることに集中することが可能になる。

## ローカル環境の準備

## Google App Engine の準備

## Google App Engine へのデプロイ

## Advanced Tips
