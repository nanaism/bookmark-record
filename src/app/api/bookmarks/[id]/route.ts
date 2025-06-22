import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * 指定されたブックマークの情報を更新する
 *
 * @param request - リクエストオブジェクト（url, description, topicIdを含む）
 * @param params - URLパラメータ（ブックマークIDを含む）
 * @returns 更新されたブックマーク情報
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { url, description, topicId } = body;

    if (!url || !topicId) {
      return NextResponse.json(
        { error: "URL and topicId are required" },
        { status: 400 }
      );
    }

    // URLの形式が正しいかを検証（不正なURLの場合はエラーを返す）
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.update({
      where: { id },
      data: {
        url,
        description: description || null,
        topicId,
      },
    });

    return NextResponse.json(bookmark);
  } catch (error) {
    console.error("Error updating bookmark:", error);
    return NextResponse.json(
      { error: "Failed to update bookmark" },
      { status: 500 }
    );
  }
}

/**
 * 指定されたブックマークを削除する
 *
 * @param request - リクエストオブジェクト
 * @param params - URLパラメータ（ブックマークIDを含む）
 * @returns 削除成功メッセージ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.bookmark.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Bookmark deleted successfully" });
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return NextResponse.json(
      { error: "Failed to delete bookmark" },
      { status: 500 }
    );
  }
}
