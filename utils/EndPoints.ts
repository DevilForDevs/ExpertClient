import { deepGet } from "./praserHelpers";
import { Video, ShortVideo, SearchResponse } from "./types";
import { generateContentPlaybackNonce, generateTParameter } from "./misfunction";
// Build a Video object from JSON
function createVideoTree(videoRenderer: Record<string, unknown>): Video {
  const videoId = videoRenderer["videoId"] as string;

  const channelId = (deepGet(videoRenderer,
    "avatar",
    "decoratedAvatarViewModel", "rendererContext", "commandContext", "onTap",
    "innertubeCommand", "browseEndpoint", "browseId"
  ) as string) ?? "Unknown";


  const title =
    (deepGet(videoRenderer, "title", "runs", 0, "text") as string) ?? "Unknown";

  let duration = "Unknown";
  if ("lengthText" in videoRenderer) {
    duration = deepGet(videoRenderer, "lengthText", "simpleText") as string;
  }

  const views = deepGet(videoRenderer, "shortViewCountText", "simpleText") as string;
  const channel = deepGet(
    videoRenderer,
    "avatar",
    "decoratedAvatarViewModel",
    "avatar",
    "avatarViewModel",
    "image",
    "sources",
    0,
    "url"
  ) as string;

  const publishedOn = deepGet(
    videoRenderer,
    "publishedTimeText",
    "simpleText"
  ) as string | null;

  return {
    type: "video",
    videoId,
    title,
    duration,
    views,
    channel,
    ...(publishedOn ? { publishedOn } : {}),
    channelUrl: channelId
  };
}

// Parse Shorts
function parseShorts(shorts: unknown[]): ShortVideo {
  const result: Video[] = [];

  var sampleShortGroupId = "grop1"

  for (const s of shorts) {
    const short = deepGet(s, "shortsLockupViewModel") as Record<string, unknown>;

    if (!short) continue;

    const videoId = deepGet(
      short,
      "onTap",
      "innertubeCommand",
      "reelWatchEndpoint",
      "videoId"
    ) as string;

    const title = deepGet(
      short,
      "overlayMetadata",
      "primaryText",
      "content"
    ) as string;

    const views = deepGet(
      short,
      "overlayMetadata",
      "secondaryText",
      "content"
    ) as string;

    sampleShortGroupId = videoId

    // wrap each short as Video
    const video: Video = {
      type: "video",
      videoId,
      title,
      views,
    };

    result.push(video);
  }

  return { type: "shorts", videoId: "randomVideoId", videos: result };
}

// Parse videos & nested structures
function parseVideos(items: unknown[], totalVideos: (Video | ShortVideo)[]) {
  for (const vr of items) {
    const obj = vr as Record<string, unknown>;
    if ("videoRenderer" in obj) {
      totalVideos.push(
        createVideoTree(obj["videoRenderer"] as Record<string, unknown>)
      );
    } else if ("shelfRenderer" in obj) {
      const vr2 = deepGet(
        obj,
        "shelfRenderer",
        "content",
        "verticalListRenderer",
        "items"
      ) as unknown[] | null;
      if (vr2) parseVideos(vr2, totalVideos);
    } else if ("gridShelfViewModel" in obj) {
      const shorts = deepGet(obj, "gridShelfViewModel", "contents") as unknown[];
      const parsedShorts = parseShorts(shorts)
      totalVideos.push(parsedShorts);
    }
  }
}

// Main parser
export function parseSearchResponse(response: string): SearchResponse {
  const responseJson = JSON.parse(response) as Record<string, unknown>;
  const totalVideos: (Video | ShortVideo)[] = [];
  let continuation: string | null = null;

  // Parse main search results
  if ("contents" in responseJson) {
    const contents = deepGet(
      responseJson,
      "contents",
      "twoColumnSearchResultsRenderer",
      "primaryContents",
      "sectionListRenderer",
      "contents",
      0,
      "itemSectionRenderer",
      "contents"
    ) as unknown[] | null;

    if (contents) parseVideos(contents, totalVideos);

    continuation =
      (deepGet(
        responseJson,
        "contents",
        "twoColumnSearchResultsRenderer",
        "primaryContents",
        "sectionListRenderer",
        "contents",
        1,
        "continuationItemRenderer",
        "continuationEndpoint",
        "continuationCommand",
        "token"
      ) as string) ?? null;
  }

  // Parse continuation results
  if ("onResponseReceivedCommands" in responseJson) {
    const contents = deepGet(
      responseJson,
      "onResponseReceivedCommands",
      0,
      "appendContinuationItemsAction",
      "continuationItems",
      0,
      "itemSectionRenderer",
      "contents"
    ) as unknown[] | null;

    if (contents) parseVideos(contents, totalVideos);

    continuation =
      (deepGet(
        responseJson,
        "onResponseReceivedCommands",
        0,
        "appendContinuationItemsAction",
        "continuationItems",
        1,
        "continuationItemRenderer",
        "continuationEndpoint",
        "continuationCommand",
        "token"
      ) as string) ?? continuation;
  }

  return { videos: totalVideos, continuation };
}

export async function getVisitorId(): Promise<string> {
  const url = "https://youtubei.googleapis.com/youtubei/v1/visitor_id?prettyPrint=false";

  const body = {
    context: {
      request: {
        internalExperimentFlags: [],
        useSsl: true
      },
      client: {
        androidSdkVersion: null,
        osVersion: "17.5",
        hl: "en-GB",
        clientName: "IOS",
        gl: "GB",
        clientScreen: "WATCH",
        clientVersion: "18.15.0",
        osName: "iOS",
        platform: "MOBILE"
      },
      user: {
        lockedSafetyMode: false
      }
    }
  };

  const headers = {
    "User-Agent": "com.google.ios.youtube/18.15.0 (iPhone; iOS 17.5; Scale/3.00)",
    "X-Goog-Api-Format-Version": "2",
    "Content-Type": "application/json",
    "Accept-Language": "en-GB, en;q=0.9"
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const json = await res.json();
  return json.responseContext.visitorData;
}

export async function getIosPlayerResponse(videoId: string): Promise<any> {
  const cpn = generateContentPlaybackNonce();
  const tp = generateTParameter();
  const visitorId = await getVisitorId();

  const url = `https://youtubei.googleapis.com/youtubei/v1/player?prettyPrint=false&t=${tp}&id=${videoId}`;

  const body = {
    context: {
      client: {
        clientName: "IOS",
        clientVersion: "20.03.02",
        clientScreen: "WATCH",
        platform: "MOBILE",
        visitorData: visitorId,
        deviceMake: "Apple",
        deviceModel: "iPhone16,2",
        osName: "iOS",
        osVersion: "18.2.1.22C161",
        hl: "en-GB",
        gl: "GB",
        utcOffsetMinutes: 0,
      },
      request: {
        internalExperimentFlags: [],
        useSsl: true,
      },
      user: {
        lockedSafetyMode: false,
      },
    },
    videoId,
    cpn,
    contentCheckOk: true,
    racyCheckOk: true,
  };

  const headers = {
    "User-Agent":
      "com.google.ios.youtube/20.03.02(iPhone16,2; U; CPU iOS 18_2_1 like Mac OS X; GB)",
    "X-Goog-Api-Format-Version": "2",
    "Content-Type": "application/json",
    "Accept-Language": "en-GB, en;q=0.9",
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return res.json();
}



export async function fetchPlaylistUsingPost(
  url: string,
  mkey: string,
  value: string
) {
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0",
    "X-Youtube-Client-Name": "1",
    "X-Youtube-Client-Version": "2.20260101.00.00",
    "Origin": "https://www.youtube.com",
    "Referer": "https://www.youtube.com/",
  };

  const payload = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20260101.00.00",
        hl: "en",
        gl: "IN",
      },
    },
    [mkey]: value, // 🔑 browseId OR continuation
  };

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`);
  }

  return res.json();
}

export function formatDurationHMS(lengthSeconds: string | number): string {
  const totalSeconds = Number(lengthSeconds) || 0

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

