import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { auth } from "../../../../auth";

/**
 * ログインユーザーのお気に入りブックマーク一覧を取得する
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const favoriteBookmarks = await prisma.bookmark.findMany({
      where: {
        authorId: userId, // 自分が作成したブックマーク
        isFavorite: true, // お気に入り登録されているもの
      },
      orderBy: [
        // ★ 配列形式で複数キーを指定
        { order: "asc" }, // orderフィールドの昇順
        { createdAt: "desc" }, // orderがnullの場合は作成日の降順
      ],
    });

    return NextResponse.json(favoriteBookmarks);
  } catch (error) {
    console.error("Error fetching favorite bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorite bookmarks" },
      { status: 500 }
    );
  }
}
