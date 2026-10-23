// IndexNow tells Bing (and through it Copilot, DuckDuckGo and ChatGPT search), Yandex, Naver, Seznam
// and Yep the moment a page is new or changed, instead of waiting for their next crawl.
// The key is public by design: it is served at https://coupondonation.com/<key>.txt (public/).
export const INDEXNOW_KEY = "88cc93917332877d9126bf9574635250";
export const INDEXNOW_HOST = "coupondonation.com";
const ENDPOINT = "https://api.indexnow.org/indexnow";

/** Only our own https pages, at most 10,000 per call (the protocol's limit). */
export function indexNowUrls(urls: string[]): string[] {
  const out = new Set<string>();
  for (const url of urls) {
    if (typeof url === "string" && url.startsWith(`https://${INDEXNOW_HOST}/`) && url.length < 2048) out.add(url);
    if (out.size >= 10000) break;
  }
  return [...out];
}

export function indexNowBody(urls: string[]) {
  return {
    host: INDEXNOW_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${INDEXNOW_HOST}/${INDEXNOW_KEY}.txt`,
    urlList: indexNowUrls(urls),
  };
}

/** Sends the URLs; returns the HTTP status (200/202 accepted, 403 key not yet live, 429 slow down). */
export async function submitIndexNow(urls: string[]): Promise<number> {
  const body = indexNowBody(urls);
  if (!body.urlList.length) return 204;
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    await res.body?.cancel();
    return res.status;
  } catch {
    return 0;
  }
}
