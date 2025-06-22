import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";

// ▼▼▼ 型定義を修正 ▼▼▼
interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * ブックマークのお気に入り状態を切り替える (本人所有のものに限る)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // ▼▼▼ `await` を追加 ▼▼▼
  const { id } = await params;

  try {
    const existingBookmark = await prisma.bookmark.findUnique({
      where: { id },
    });

    if (!existingBookmark || existingBookmark.authorId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedBookmark = await prisma.bookmark.update({
      where: { id },
      data: {
        isFavorite: !existingBookmark.isFavorite, // 現在の状態を反転させる
      },
    });

    return NextResponse.json(updatedBookmark);
  } catch (error) {
    console.error("Error toggling favorite status:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite status" },
      { status: 500 }
    );
  }
}
