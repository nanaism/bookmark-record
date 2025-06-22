import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";

// paramsがPromiseであることを型で明示
interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 指定されたトピックの詳細情報を取得する (本人所有のものに限る)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  // ★★★ 変更点 ★★★
  const { id } = await params; // paramsをawaitで待つ

  try {
    const topic = await prisma.topic.findFirst({
      where: { id, userId },
      include: {
        _count: {
          select: { bookmarks: true },
        },
      },
    });

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found or access denied" },
        { status: 404 }
      );
    }

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
 * 指定されたトピックの情報を更新する (本人所有のものに限る)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  // ★★★ 変更点 ★★★
  const { id } = await params; // paramsをawaitで待つ

  try {
    const body = await request.json();
    const { title, description, emoji } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const existingTopic = await prisma.topic.findUnique({ where: { id } });
    if (!existingTopic || existingTopic.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const topic = await prisma.topic.update({
      where: { id },
      data: {
        title,
        description: description || null,
        emoji: emoji || "📁",
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
 * 指定されたトピックを削除する (本人所有のものに限る)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  // ★★★ 変更点 ★★★
  const { id } = await params; // paramsをawaitで待つ

  try {
    const existingTopic = await prisma.topic.findUnique({ where: { id } });
    if (!existingTopic || existingTopic.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
