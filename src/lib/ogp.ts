import * as cheerio from "cheerio";

export interface OgpData {
  title?: string;
  description?: string;
  image?: string;
}

/**
 * 指定されたURLからOGPデータを取得する
 * @param url OGPを取得したいページのURL
 * @returns OGPデータ（タイトル, 説明, 画像URL）
 */
export async function getOgpData(url: string): Promise<OgpData> {
  try {
    // URLからHTMLを取得
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
      },
      // タイムアウト設定 (5秒)
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.error(`Failed to fetch OGP data for ${url}: ${response.status}`);
      return {};
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // OGPメタタグから情報を抽出
    const getMetaContent = (property: string) =>
      $(`meta[property='${property}']`).attr("content");

    const title = getMetaContent("og:title") ?? $("title").text();
    const description =
      getMetaContent("og:description") ??
      $('meta[name="description"]').attr("content");
    const image = getMetaContent("og:image");

    return {
      title: title?.trim(),
      description: description?.trim(),
      image: image?.trim(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      console.error(`Timeout fetching OGP data for ${url}`);
    } else {
      console.error(`Error fetching OGP data for ${url}:`, error);
    }
    return {};
  }
}
