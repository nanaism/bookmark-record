# Chienowa（チエノワ）

> 知をつなぐ。未来がひらく。

[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

『Chienowa（チエノワ）』は、個人やチームの知識を繋ぎ合わせ、新たな価値を創造するための集合知型ナレッジベースです。

---

## 🚀 デモサイト (Live Demo)

**以下のURLから、実際にアプリケーションをお試しいただけます！**

### [➡️ Chienowaを試してみる](https://www.aiichiro.jp/)

---

## 🖼️ スクリーンショット (Screenshot)

![Chienowa Screenshot](https://github.com/user-attachments/assets/0f650c05-2468-4099-a2d9-6ea5b3b42cb2)

---

## 🌟 プロジェクト概要 (About this Project)

### コンセプト

『Chienowa』は、散在しがちな個人やチームの知識・情報を一元管理し、その価値を最大化することを目指す、まさに”ちえ”の”輪”を創造するサービスです。AIによるレコメMンド機能が、思わぬ知識の発見やアイデアの結合を促し、あなたの知的生産性を飛躍的に向上させます。

### プロダクトのポジショニング

| 要素                       | 内容                                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------------------- |
| **❶ 課題 (Problem)**       | 個人やチームが持つ知識や情報がサイロ化し、有効活用されずに埋もれてしまう。                             |
| **❷ ターゲット (Target)**  | 知識やナレッジを効率的に収集・整理し、個人やチームで活用したいと考えているすべての人々。               |
| **❸ プロダクト (Product)** | **Chienowa（チエノワ）**：集合知型ナレッジベースサービス                                             |
| **❹ 提供価値 (Value)**     | 誰でも簡単に知識を蓄積・共有でき、AIレコメンドによって新しいアイデアや知見の発見を促進する。           |
| **❺ 既存代替手段 (Alternative)** | 既存のWikiツール、一般的なブックマーク管理サービス                                               |
| **❻ 差別化要因 (Differentiation)** | **AIによるインテリジェントなレコメンド機能**。使えば使うほどナレッジ間の繋がりが強化され、価値が高まる。 |

---

## ✨ 主な機能 (Features)

*   **📚 トピック管理**
    *   学習したいことや管理したい知識を「トピック」として作成・編集・削除できます。
    *   絵文字を設定して、視覚的に分かりやすく管理できます。

*   **🔖 ブックマーク管理**
    *   トピックに関連するWebページのURLと説明を保存できます。
    *   気になるページをどんどん追加し、自分だけのナレッジを構築できます。

*   **🤖 AIによるレコメンド**
    *   登録したブックマークの内容をAIが解析し、関連性の高い新たなWebページを自動で推薦します。
    *   予期せぬ情報の発見が、あなたの知識の幅を広げます。

*   **🖱️ 直感的なUI/UX**
    *   ドラッグ＆ドロップによるトピックやブックマークの並び替えなど、ストレスフリーな操作性を実現しています。
    *   `shadcn/ui` を活用した、モダンで洗練されたデザイン。

---

## 🛠️ 使用技術 (Tech Stack)

本プロジェクトは、以下の技術スタックで構築されています。

| カテゴリ           | 技術・サービス                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **フロントエンド** | [React](https://reactjs.org/), [Next.js](https://nextjs.org/), [TypeScript](https://www.typescriptlang.org/) |
| **スタイリング**   | [Tailwind CSS](https://tailwindcss.com/)                                                            |
| **UIコンポーネント** | [shadcn/ui](https://ui.shadcn.com/), [dnd-kit](https://dndkit.com/)                                 |
| **バックエンド/DB**  | [Prisma](https://www.prisma.io/) (ORM)                                                            |
| **外部API**        | [Exa API](https://exa.ai/) (AI Search)                                                              |
| **インフラ**       | [Vercel](https://vercel.com/)                                                                     |

---

## 📖 ユーザーストーリー (User Stories)

1.  **トピックの作成**: ユーザーはサイトにアクセスし、絵文字・タイトル・説明を入力して新しいトピックを作成する。作成されたトピックは一覧に即座に反映される。
2.  **ブックマークの追加**: 特定のトピックを選択し、関連するWebページのURLと説明を入力してブックマークを追加する。
3.  **ナレッジの閲覧**: トピックを選択すると、関連付けられたブックマークが一覧で表示され、いつでも知識を確認できる。
4.  **情報の整理**: 作成したトピックやブックマークは、いつでも編集・削除が可能。
5.  **新たな発見**: AIレコメンド機能により、既存のブックマークに関連した未知の優良なWebページと出会うことができる。
6.  **DB管理**: 開発者は `Prisma Studio` を用いて、データベースの内容をGUIで直感的に確認・操作できる。
