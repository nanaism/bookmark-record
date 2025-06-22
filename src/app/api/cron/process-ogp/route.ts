import { getOgpData } from "@/lib/ogp";
import { prisma } from "@/lib/prisma";
import { ProcessingStatus } from "@prisma/client"; // ★★★ ProcessingStatusをインポート ★★★
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // ステータスがPENDINGのブックマークを1件だけ取得
    const pendingBookmark = await prisma.bookmark.findFirst({
      where: {
        processingStatus: ProcessingStatus.PENDING, // ★ 文字列からEnumに変更
      },
    });

    if (!pendingBookmark) {
      return NextResponse.json({ message: "No pending bookmarks to process." });
    }

    // ステータスをIN_PROGRESSに更新
    await prisma.bookmark.update({
      where: { id: pendingBookmark.id },
      data: { processingStatus: ProcessingStatus.IN_PROGRESS }, // ★ 文字列からEnumに変更
    });

    let updatedData;
    try {
      // OGP取得処理を実行
      const ogp = await getOgpData(pendingBookmark.url);
      updatedData = {
        ogTitle: ogp.title ?? pendingBookmark.url,
        ogDescription: ogp.description,
        ogImage: ogp.image,
        processingStatus: ProcessingStatus.COMPLETED, // ★ 文字列からEnumに変更
      };
    } catch (e) {
      // OGP取得に失敗した場合
      updatedData = {
        processingStatus: ProcessingStatus.FAILED, // ★ 文字列からEnumに変更
      };
      console.error(
        `Failed to process OGP for bookmark ${pendingBookmark.id}:`,
        e
      );
    }

    // データベースを最終的な状態で更新
    await prisma.bookmark.update({
      where: { id: pendingBookmark.id },
      data: updatedData,
    });

    return NextResponse.json({ success: true, processed: pendingBookmark.id });
  } catch (error) {
    console.error("Error in cron job:", error);
    // ここでエラーが発生した場合、特定のブックマークIDが分からないため、
    // 全体的なエラーとして返す
    return NextResponse.json(
      { error: "An unexpected error occurred in the cron job" },
      { status: 500 }
    );
  }
}
