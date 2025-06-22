import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { orderedIds } = await request.json();

    if (!Array.isArray(orderedIds)) {
      return NextResponse.json(
        { error: "orderedIds must be an array" },
        { status: 400 }
      );
    }

    // データベースの更新処理をトランザクション内で実行し、データの整合性を保証
    const updatePromises = orderedIds.map((id, index) =>
      prisma.bookmark.updateMany({
        where: {
          id: id,
          authorId: userId, // 本人のブックマークのみ更新可能
        },
        data: {
          order: index, // 配列のインデックスがそのまま順序になる
        },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Error reordering bookmarks:", error);
    return NextResponse.json(
      { error: "Failed to reorder bookmarks" },
      { status: 500 }
    );
  }
}
