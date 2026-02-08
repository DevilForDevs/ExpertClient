import { parseSearchResponse } from "./EndPoints";
import { SearchResponse } from "./types";

export async function sendYoutubeSearchRequest(
  query: string,
  continuation: string,
  params: string
): Promise<SearchResponse> {
  const jsonBody: Record<string, unknown> = continuation
    ? { continuation }
    : { query, params };

  jsonBody["context"] = {
    request: { internalExperimentFlags: [], useSsl: true },
    client: {
      utcOffsetMinutes: 0,
      hl: "en-GB",
      gl: "IN",
      clientName: "WEB",
      originalUrl: "https://www.youtube.com",
      clientVersion: "2.20250613.00.00",
      platform: "DESKTOP",
    },
    user: { lockedSafetyMode: false },
  };

  const response = await fetch(
    "https://www.youtube.com/youtubei/v1/search?prettyPrint=false",
    {
      method: "POST",
      headers: {
        "Origin": "https://www.youtube.com",
        "Referer": "https://www.youtube.com",
        "X-YouTube-Client-Version": "2.20250613.00.00",
        "X-YouTube-Client-Name": "1",
        "Content-Type": "application/json",
        "Accept-Language": "en-GB,en;q=0.9",
      },
      body: JSON.stringify(jsonBody),
    }
  );

  const text = await response.text();
  return parseSearchResponse(text);
}
