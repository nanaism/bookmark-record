import { prisma } from "@/lib/prisma";
import { Topic } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

/**
 * ログインユーザーのトピック一覧を取得する
 */
export async function GET() {
  // 1. セッション情報を取得
  const session = await auth();
  // 2. 認証チェック
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // 3. 自分のuserIdに紐づくトピックのみを検索
    const topics = await prisma.topic.findMany({
      where: { userId },
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const topicsWithCount = topics.map(
      (topic: Topic & { _count: { bookmarks: number } }) => ({
        ...topic,
        bookmarkCount: topic._count.bookmarks,
      })
    );

    return NextResponse.json(topicsWithCount);
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

/**
 * 新しいトピックを作成する
 */
export async function POST(request: NextRequest) {
  // 1. セッション情報を取得
  const session = await auth();
  // 2. 認証チェック
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { title, description, emoji } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // 3. ログインユーザーのIDを紐付けて作成
    const topic = await prisma.topic.create({
      data: {
        title,
        description: description || null,
        emoji: emoji || "📁",
        userId: userId, // ★ ユーザーIDを紐付ける
      },
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
    });

    const topicWithCount = {
      ...topic,
      bookmarkCount: topic._count.bookmarks,
    };

    return NextResponse.json(topicWithCount, { status: 201 });
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
