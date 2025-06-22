import { type DefaultSession } from "next-auth";

/**
 * Auth.jsのデフォルトの型を拡張し、
 * セッションオブジェクトにカスタムプロパティ（id）を追加します。
 */
declare module "next-auth" {
  /**
   * `session`コールバックから返されるSessionオブジェクトの型。
   */
  interface Session extends DefaultSession {
    user?: {
      id: string; // userオブジェクトにidプロパティを追加
    } & DefaultSession["user"]; // 既存のプロパティ(name, email, image)と結合
  }
}
