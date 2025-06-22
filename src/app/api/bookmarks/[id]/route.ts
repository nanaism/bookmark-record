import { getOgpData } from "@/lib/ogp"; // 忘れずに追加
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";

// paramsがPromiseであることを型で明示
interface RouteParams {
  params: Promise<{ id: string }>;
}
/**
 * 指定されたブックマークの情報を更新する (本人所有のものに限る)
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

    const existingBookmark = await prisma.bookmark.findUnique({
      where: { id },
    });
    if (!existingBookmark || existingBookmark.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let ogpDataToUpdate = {
      ogTitle: existingBookmark.ogTitle,
      ogDescription: existingBookmark.ogDescription,
      ogImage: existingBookmark.ogImage,
    };

    if (existingBookmark.url !== url) {
      const newOgp = await getOgpData(url);
      // `undefined` の場合は `null` に変換する
      ogpDataToUpdate = {
        ogTitle: newOgp.title ?? null,
        ogDescription: newOgp.description ?? null,
        ogImage: newOgp.image ?? null,
      };
    }

    const bookmark = await prisma.bookmark.update({
      where: { id },
      data: {
        url,
        description: description || null,
        topicId,
        ogTitle: ogpDataToUpdate.ogTitle,
        ogDescription: ogpDataToUpdate.ogDescription,
        ogImage: ogpDataToUpdate.ogImage,
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
 * 指定されたブックマークを削除する (本人所有のものに限る)
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
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { id },
    });
    if (!existingBookmark || existingBookmark.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
