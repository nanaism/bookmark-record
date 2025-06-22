import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * 複数のブックマークを一括で作成する
 *
 * @param request - リクエストオブジェクト（urls配列とtopicIdを含む）
 * @returns 作成されたブックマーク数と成功メッセージ
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls, topicId } = body;

    if (!urls || !Array.isArray(urls) || !topicId) {
      return NextResponse.json(
        { error: "URLs array and topicId are required" },
        { status: 400 }
      );
    }

    // 各URLの形式を検証し、有効なもののみを抽出
    const validUrls = [];
    for (const url of urls) {
      try {
        new URL(url);
        validUrls.push(url);
      } catch {
        // 無効なURLはスキップして処理を続行
        continue;
      }
    }

    if (validUrls.length === 0) {
      return NextResponse.json(
        { error: "No valid URLs provided" },
        { status: 400 }
      );
    }

    // 有効なURLを使用してブックマークを一括作成
    const bookmarks = await prisma.bookmark.createMany({
      data: validUrls.map((url) => ({
        url,
        description: "Added via bulk import",
        topicId,
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
