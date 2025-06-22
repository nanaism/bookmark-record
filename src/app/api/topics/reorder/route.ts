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

    const updatePromises = orderedIds.map((id, index) =>
      prisma.topic.updateMany({
        where: {
          id: id,
          userId: userId, // 本人のトピックのみ更新可能
        },
        data: {
          order: index,
        },
      })
    );

    await prisma.$transaction(updatePromises);

    return NextResponse.json({ message: "Order updated successfully" });
  } catch (error) {
    console.error("Error reordering topics:", error);
    return NextResponse.json(
      { error: "Failed to reorder topics" },
      { status: 500 }
    );
  }
}
