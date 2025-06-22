import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * 指定されたトピックの詳細情報を取得する
 *
 * @param request - リクエストオブジェクト
 * @param params - URLパラメータ（トピックIDを含む）
 * @returns トピック詳細情報（ブックマーク数を含む）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const topic = await prisma.topic.findUnique({
      where: { id },
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // レスポンス用にブックマーク数を追加
    const topicWithCount = {
      ...topic,
      bookmarkCount: topic._count.bookmarks,
    };

    return NextResponse.json(topicWithCount);
  } catch (error) {
    console.error("Error fetching topic:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic" },
      { status: 500 }
    );
  }
}

/**
 * 指定されたトピックの情報を更新する
 *
 * @param request - リクエストオブジェクト（title, description, emojiを含む）
 * @param params - URLパラメータ（トピックIDを含む）
 * @returns 更新されたトピック情報（ブックマーク数を含む）
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, emoji } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        title,
        description: description || null,
        emoji: emoji || "📁", // デフォルトの絵文字を設定
      },
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
    });

    // レスポンス用にブックマーク数を追加
    const topicWithCount = {
      ...topic,
      bookmarkCount: topic._count.bookmarks,
    };

    return NextResponse.json(topicWithCount);
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json(
      { error: "Failed to update topic" },
      { status: 500 }
    );
  }
}

/**
 * 指定されたトピックを削除する
 *
 * @param request - リクエストオブジェクト
 * @param params - URLパラメータ（トピックIDを含む）
 * @returns 削除成功メッセージ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.topic.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Topic deleted successfully" });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 }
    );
  }
}
