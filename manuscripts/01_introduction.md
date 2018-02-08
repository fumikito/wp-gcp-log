# はじめに

本書は Google Inc. の提供するクラウド・サービスである Google Cloud Platform を WordPressから利用するにあたっての指南書兼実行記録である。

## 本書を書くに至った経緯

WordPressをホスティングする際、いくつかの選択肢がある。かなりの規模まではレンタルサーバー（共有・占有）で事足りるが、一定以上の規模のWebサイトでは、クラウド・サービスを利用することが当たり前となってきた。とりわけ、月間数千万ページビュー以上のサイトにおいては、クラウドサービスが提供するスケーラビリティと柔軟性が魅力だ。

クラウドサービスはいくつかあるが、日本におけるWordPressの利用ケースとしては、[Amazon Web Service](https://aws.amazon.com)(AWS)がもっとも著名である。日本最古の公式WordPressコンサルタントであった株式会社デジタルキューブの提供する[AMIMOTO](https://www.digitalcube.jp/our-solutions/)というAMI(Amazon Machine Image)によって、WordPressのセットアップを容易に行えるようにもなったのも一因だろう。ある意味で、WordPressで大規模ホスティングをする場合、AWSは定番となっている。

そんな状況において、2017年頃からGoogle Cloud Platform(GCP)についての評判を聞くようになった。具体的には、以下のようなサービスである。

- [Kinsta.com](https://kinsta.com)（Google Cloud Platform上に展開しているマネージド・ホスティング・サービス）
- [Pantheon](https://pantheon.io) （参考：[PantheonがGoogle Cloud Platformに移行完了](https://capitalp.jp/2018/01/24/pantheon-moves-to-gcp/)） 

つまり、顧客に対してWordPressのホスティングを提供する事業者がGCPを選ぶケースが増えているということだ。

筆者はAWSでのWordPressホスティングに不満はなかったのだが、いくつかの情報から、AWSからGCPへ移行する労を払うに値する何かがあるのでは、と確信するようになった。

本書では、筆者の運営するWordPressメディアサイト[Capital P](https://capitalp.jp)をAWSからGCPへと移行するとともに、本来は必要ないのだが、高負荷に耐えうるスケーラブルなサイトを構築するまでの冒険の足跡である。

## 本書の構成

1. Capital P 現在のAWS構成
2. GCPアプリケーションの紹介
3. Google Compute Engineによるシングル WordPress
4. Google App Engineによるエラスティック WordPress
5. Google Kubernetes Engineによる大規模編成

## 免責事項

- 本書の著者はGCPおよびその運営会社であるGoogle Inc.とはまったく関係がない。そのため、本書に書かれたことはGoogle Inc.のなんらかの意見の表明ではありえない。
- 本書の内容は執筆時点（2018年2月頃）の状況に基づいており、それ以外の時期における正当性を一切保証しない。
- 本書の内容に基づいて業務を行い、その結果なんらかの損害あるいは意図しない支払いが発生したとしても、著者は一切の補償をしない。
- 筆者は執筆開始時点(2018年2月)において、一切のGCP事業経験はなく、一切の資格を保有しない。そのため、中には間違った情報が含まれている可能性があることを事前に告知しておく。その際、間違った情報を鵜呑みにして読者が何時間も浪費したとしても、一切の責任は生じない。なにより、筆者はおそらくその何倍もの時間を無駄にしているはずだからである。