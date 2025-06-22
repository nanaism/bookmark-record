import { getOgpData } from "@/lib/ogp";
import { prisma } from "@/lib/prisma";
import { ProcessingStatus } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

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

    if (!bookmark || bookmark.processingStatus !== ProcessingStatus.PENDING) {
      // 既に処理中または完了済みの場合は何もしない
      return NextResponse.json({
        message: "Bookmark not pending or not found.",
      });
    }

    // ステータスをIN_PROGRESSに更新
    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: { processingStatus: ProcessingStatus.IN_PROGRESS },
    });

    let updatedData;
    try {
      const ogp = await getOgpData(bookmark.url);
      updatedData = {
        ogTitle: ogp.title ?? bookmark.url,
        ogDescription: ogp.description,
        ogImage: ogp.image,
        processingStatus: ProcessingStatus.COMPLETED,
      };
    } catch (e) {
      updatedData = { processingStatus: ProcessingStatus.FAILED };
      console.error(`Failed to process OGP for ${bookmarkId}:`, e);
    }

    await prisma.bookmark.update({
      where: { id: bookmarkId },
      data: updatedData,
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
