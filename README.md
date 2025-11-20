# 案件・クライアント管理システム

Web制作会社・フリーランス向けの案件・クライアント管理システムです。Next.js + Prisma + SQLite で構築されており、ローカル環境で動作します。

## 🚀 クイックスタート

```bash
# リポジトリをクローン
git clone https://github.com/itsukih/project-manager.git
cd project-manager

# develop ブランチに切り替え
git checkout develop

# 依存関係をインストール
npm install

# データベースをセットアップ
npx prisma migrate dev
npx prisma generate

# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセスしてください。

## 主な機能

### 📋 案件管理
- 案件の新規登録・編集・削除
- **案件ボード（カンバンビュー）** - ドラッグ&ドロップで営業ステータスを変更
- 営業ステータス管理（相談中、お見積り提示中、**受注確定**、進行中、納品、連絡待ち、失注）
- 進行ステータス管理（未着手、デザイン中、コーディング中、確認中、修正中、納品済）
- スケジュール管理（相談日、受注日、着手日、初稿日、納品日）
- **外注パートナーの複数選択対応**（デザイナー・コーダーなど）
- 請求書発行・入金確認管理
- 売上金額・外注費・利益額の自動計算
- クライアント・パートナー共有用シートURL管理

### 👥 クライアント管理（CRM機能）
- クライアント情報の一元管理
- **ランク別管理**（VIP、A、B、C、D、E）
  - VIP: 案件/継続案件あり
  - A: 契約/チャット/見積り依頼
  - B: 面談/商談あり
  - C: メールのやりとりのみ
  - D: お祈りメール
  - E: お断り（基本非表示、CSVエクスポート時のみ表示）
- **営業文テンプレート管理**（月次自動リセット）
- **定期連絡管理**（月次自動リセット）
- 契約書PDF管理
- 商談履歴・ニーズ・アプローチ記録
- CSV一括エクスポート機能

### 🤝 外注パートナー管理
- デザイナー・コーダーの登録・管理
- **ポートフォリオURL管理**
- **契約書PDF管理**
- プロジェクトとの関連付け（多対多対応）
- 削除時の関連チェック機能

### 📧 定期連絡テンプレート
- テンプレートの作成・編集・有効化/無効化
- **過去の送信履歴保存**（年月別）
- **コピー機能**で簡単に使用可能

### 📊 集計・分析機能
- 年別売上集計（受注額・納品額）
- 月別推移グラフ
- 利益額の自動計算
- ステータス別案件数

### 🎨 UI/UX
- レスポンシブデザイン
- 淡いオレンジ・黄色を基調とした明るいデザイン
- モバイル対応のサイドバーナビゲーション
- モーダルベースの編集画面

## 技術構成

- **フレームワーク**: Next.js 15 (App Router)
- **言語**: TypeScript
- **データベース**: SQLite + Prisma ORM
- **UI**: Tailwind CSS + Lucide React
- **フォーム**: React Hook Form + Zod
- **日付**: react-datepicker + date-fns

## 💻 必要な環境

- Node.js 18.x 以上
- npm または yarn

## セットアップ手順（詳細）

### 1. リポジトリのクローン

```bash
git clone https://github.com/itsukih/project-manager.git
cd project-manager
git checkout develop
```

### 2. 依存関係のインストール

```bash
npm install
```

### 3. データベースの初期化

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションが http://localhost:3000 で起動します。

## プロジェクト構造

```
project-manager/
├── prisma/
│   ├── schema.prisma          # データベーススキーマ定義
│   └── migrations/            # マイグレーションファイル
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── api/               # APIエンドポイント
│   │   ├── clients/           # クライアント管理ページ
│   │   ├── partners/          # 外注パートナー管理ページ
│   │   ├── gantt/             # ガントチャートページ
│   │   ├── analytics/         # 集計分析ページ
│   │   └── layout.tsx         # ルートレイアウト
│   ├── components/            # Reactコンポーネント
│   │   ├── ui/                # 汎用UIコンポーネント
│   │   ├── Layout.tsx         # メインレイアウト
│   │   ├── ProjectList.tsx    # 案件一覧
│   │   ├── ProjectModal.tsx   # 案件編集モーダル
│   │   └── ...
│   ├── hooks/                 # カスタムフック
│   ├── lib/                   # ユーティリティ
│   └── types/                 # 型定義
└── package.json
```

## データベース設計

### 主要テーブル

- **projects** - 案件情報
- **clients** - クライアント情報
- **outsourcing_partners** - 外注パートナー情報

### 主要な列

**projects テーブル:**
- 基本情報: name, description, clientId
- ステータス: salesStatus, progressStatus
- 日程: consultationDate, orderDate, startDate, firstDraftDate, deliveryDate
- 外注: hasOutsourcing, outsourcingPartnerId, outsourcingPartnerSheetUrl
- 金額: amount, invoiceIssued, paymentConfirmed, paymentDueDate
- URL: clientSheetUrl

## 使用方法

### 1. 初期セットアップ

1. **クライアント登録**: サイドバーの「クライアント管理」から取引先を登録
2. **外注パートナー登録** (必要に応じて): 「外注パートナー管理」から登録

### 2. 案件管理

1. **新規案件作成**: トップページの「新規案件」ボタンから作成
2. **案件編集**: 案件一覧の編集ボタンから詳細を編集
3. **フィルター・検索**: フィルターボタンで条件絞り込み

### 3. 請求書発行時の自動設定

- 「請求書発行済」にチェックを入れると、支払い期限が自動的に翌月末に設定されます
- 手動で変更も可能です

### 4. 集計・分析

- 「集計・分析」ページで年別の売上データや案件状況を確認できます

## 🤝 他の人と共有する方法

### 方法1: GitHub リポジトリを公開

1. [リポジトリ設定](https://github.com/itsukih/project-manager/settings) にアクセス
2. 「Danger Zone」→「Change visibility」→「Make public」をクリック
3. 相手に以下のURLとセットアップ手順を共有：
   ```
   https://github.com/itsukih/project-manager
   ```

### 方法2: コラボレーターとして招待（プライベートのまま）

1. [アクセス管理](https://github.com/itsukih/project-manager/settings/access) にアクセス
2. 「Invite a collaborator」で相手の GitHub ユーザー名を追加
3. 相手がリポジトリにアクセスできるようになります

### 方法3: ZIP ファイルで共有

```bash
# プロジェクトをZIPで圧縮（データベースファイルを除外）
git archive --format=zip --output=project-manager.zip develop
```

相手は ZIP を解凍後、上記のセットアップ手順を実行します。

## 今後の拡張予定

- ガントチャートのドラッグ&ドロップ機能
- 月別売上グラフの実装
- バックアップ・復元機能
- 通知・リマインダー機能

## ライセンス

MIT License

## 開発者向け情報

### よく使用するコマンド

```bash
# データベーススキーマ変更後
npx prisma migrate dev

# Prismaクライアント再生成
npx prisma generate

# データベースリセット
npx prisma migrate reset

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start
```
