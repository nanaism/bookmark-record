import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";

/**
 * 複数のブックマークを一括で作成する (本人所有のトピックに限る)
 */
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await request.json();
    const { urls, topicId } = body;

    if (!urls || !Array.isArray(urls) || !topicId) {
      return NextResponse.json(
        { error: "URLs array and topicId are required" },
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

    const validUrls = [];
    for (const url of urls) {
      try {
        new URL(url);
        validUrls.push(url);
      } catch {
        continue;
      }
    }

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs provided" },
        { status: 400 }
      );
    }

    const bookmarks = await prisma.bookmark.createMany({
      data: validUrls.map((url) => ({
        url,
        description: "Added via bulk import",
        topicId,
        authorId: userId, // ★ 投稿者IDを紐付ける
      })),
    });

    return NextResponse.json(
      {
        message: `${bookmarks.count} bookmarks created successfully`,
        count: bookmarks.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bulk bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to create bulk bookmarks" },
      { status: 500 }
    );
  }
}
