import { getOgpData } from "@/lib/ogp"; // 忘れずに追加
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

    // ★★★ トピックの所有権を確認 ★★★
    const topic = await prisma.topic.findFirst({
      where: { id: topicId, userId },
    });
    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found or access denied" },
        { status: 404 }
      );
    }

    // ★ OGPデータを取得
    const ogp = await getOgpData(url);

    const bookmark = await prisma.bookmark.create({
      data: {
        url,
        description: description || ogp.description || null, // 説明がなければOGPの説明を使う
        topicId,
        authorId: userId,
        ogTitle: ogp.title ?? null,
        ogDescription: ogp.description ?? null,
        ogImage: ogp.image ?? null,
      },
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
