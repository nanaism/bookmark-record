import { getOgpData } from "@/lib/ogp";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// このAPIはバックグラウンドで呼ばれるため、認証チェックは不要（ブックマークIDで操作するため）
// もしセキュリティを強化するなら、内部的なシークレットキーなどで認証する

export async function POST(request: NextRequest) {
  try {
    const { bookmarkId } = await request.json();
    if (!bookmarkId) {
      return NextResponse.json(
        { error: "bookmarkId is required" },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: { id: bookmarkId },
    });

    if (!bookmark) {
      return NextResponse.json(
        { error: "Bookmark not found" },
        { status: 404 }
      );
    }

    // 時間のかかるOGP取得処理を実行
    const ogp = await getOgpData(bookmark.url);

    // 取得したOGP情報でデータベースを更新
    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: {
        ogTitle: ogp.title ?? bookmark.url,
        ogDescription: ogp.description,
        ogImage: ogp.image,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing OGP:", error);
    return NextResponse.json(
      { error: "Failed to process OGP" },
      { status: 500 }
    );
  }
}
