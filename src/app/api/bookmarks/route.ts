import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

/**
 * ★★★ 特定トピックのブックマーク一覧を誰でも取得できるようにする ★★★
 */
export async function GET(request: NextRequest) {
  // 認証チェックを削除！
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId");

    if (!topicId) {
      return NextResponse.json(
        { error: "topicId is required" },
        { status: 400 }
      );
    }

    // トピックの所有権チェックを削除！

    const bookmarks = await prisma.bookmark.findMany({
      where: { topicId },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(bookmarks);
  } catch (error) {
    console.error("Error fetching bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookmarks" },
      { status: 500 }
    );
  }
}

/**
 * 新しいブックマークを作成する
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    // ★ descriptionは受け取らないか、受けてもogDescriptionより優先するなど仕様を決める
    const { url, description, topicId } = body;

    if (!url || !topicId) {
      return NextResponse.json(
        { error: "URL and topicId are required" },
        { status: 400 }
      );
    }

    // ★★★ OGP取得処理を削除！ ★★★
    // まずはOGP情報が空の状態でブックマークを作成する
    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        description: description || null, // フォームからの説明を一時的に使用
        topicId,
        authorId: userId,
        ogTitle: url, // タイトルが空だと寂しいので、一旦URLを入れておく
        ogDescription: "Loading...", // 処理中であることが分かるように
        ogImage: null,
      },
    });

    // ★★★ Trigger the background processing ★★★
    // 新しく作るAPIエンドポイントを「叩くだけ」で、OGP取得処理をバックグラウンドで開始させる
    // `fetch`を`await`しないことで、この処理の完了を待たずにレスポンスを返す（Fire and Forget）
    fetch(`${new URL(request.url).origin}/api/bookmarks/process-ogp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookmarkId: bookmark.id }),
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    );
  }
}
