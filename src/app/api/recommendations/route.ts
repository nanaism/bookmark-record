import { getOgpData } from "@/lib/ogp"; // ★ 既存のOGP取得関数をインポート
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";

const EXA_API_URL = "https://api.exa.ai/findSimilar";

// Exa APIからのレスポンスの型
interface ExaResult {
  title: string;
  url: string;
  id: string;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await fetch(EXA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.EXA_API_KEY!,
      },
      body: JSON.stringify({
        url: url,
        numResults: 5,
        highlights: {
          // ★ ハイライト（要約）も取得するよう追加
          numSentences: 3,
        },
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
    const results: ExaResult[] = data.results;

    // ★★★ OGP情報を並列で取得してリッチなデータに変換 ★★★
    const enrichedResults = await Promise.all(
      results.map(async (rec) => {
        const ogpData = await getOgpData(rec.url);
        return {
          ...rec, // id, title, url を維持
          ogImage: ogpData.image,
          ogDescription: ogpData.description,
        };
      })
    );

    return NextResponse.json(enrichedResults);
  } catch (error) {
    console.error("Error in recommendations route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
