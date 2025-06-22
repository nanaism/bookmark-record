/**
 * Prismaクライアント設定
 *
 * データベース接続のシングルトンパターンを実装しています。
 * 開発環境でのホットリロード時に複数のPrismaインスタンスが作成されることを防ぎ、
 * データベース接続の効率化を図っています。
 */
import { PrismaClient } from "@prisma/client";

// グローバルオブジェクトにPrismaインスタンスを保存するための型定義
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 既存のインスタンスがあれば再利用、なければ新規作成
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// 開発環境でのみグローバルにインスタンスを保存（本番環境では不要）
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
