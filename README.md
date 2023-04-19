# Insert AmazonPoints in the Wishlist (tacores)

Amazonウィッシュリストに入っているKindle本のAmazonポイントを表示するChrome拡張（の、tacoresによる拡張）

* Amazon側のDOM変更("total-points-value-display-column")に対応
* 一定以上のポイント還元率でdevコンソール出力する機能を追加
* ポイント還元だけでなく、価格が一定以上下がった場合もコンソール出力する

### コンソール出力する閾値設定
`const CONSOLE_OUTPUT_RATE = 30;`

## インストール方法
1. githubから、git clone か zipダウンロードでローカルにダウンロードする
1. Chromeの「拡張機能を管理」から「パッケージ化されていない拡張機能を読み込む」を選択し、content.jsが入っているフォルダを選択する

## フォーク元
https://github.com/sytkm/PointsintheWishlist

## 注意
本を購入する場合は、必ず商品ページでポイントに間違いがないことを確認してから購入してください

## License
Copyright (c) 2023 tacores
Released under the MIT license
http://opensource.org/licenses/mit-license.php
