import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

const EXA_API_URL = "https://api.exa.ai/findSimilar";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // フロントエンドから推薦の元になるURLを受け取る
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(EXA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 環境変数からAPIキーを読み込む
        "x-api-key": process.env.EXA_API_KEY!,
      },
      body: JSON.stringify({
        url: url,
        numResults: 5, // 推薦件数を5件に指定
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Exa API error:", errorBody);
      return NextResponse.json(
        { error: "Failed to fetch recommendations from Exa API" },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Exa APIからのレスポンス(data.results)をそのままフロントに返す
    return NextResponse.json(data.results);
  } catch (error) {
    console.error("Error in recommendations route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
