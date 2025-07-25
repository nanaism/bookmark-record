import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

/**
 * 特定トピックのブックマーク一覧を取得する (公開)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicId = searchParams.get("topicId");

    if (!topicId) {
      return NextResponse.json(
        { error: "topicId is required" },
        { status: 400 }
      );
    }

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
 * 新しいブックマークを「処理待ち」状態で作成する
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { url, description, topicId } = body;

    if (!url || !topicId) {
      return NextResponse.json(
        { error: "URL and topicId are required" },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const topic = await prisma.topic.findFirst({
      where: { id: topicId, userId },
    });
    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found or access denied" },
        { status: 404 }
      );
    }

    // OGP情報を空のまま、ステータスを「PENDING」で作成
    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        description: description || null,
        topicId,
        authorId: userId,
        ogTitle: url, // 一時的にURLをタイトルとして設定
        ogDescription: "OGP情報を取得中です...", // 状態がわかるように
        ogImage: null,
        processingStatus: "PENDING", // 処理待ち状態に設定
      },
    });

    // ★★★ 即時処理をバックグラウンドでトリガー ★★★
    fetch(`${new URL(request.url).origin}/api/ogp-process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookmarkId: bookmark.id }),
    });

    // ここでバックグラウンド処理をトリガーする必要はなくなります。
    // Cronが自動で処理してくれるのを待ちます。

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error("Error creating bookmark:", error);
    return NextResponse.json(
      { error: "Failed to create bookmark" },
      { status: 500 }
    );
  }
}
