import 'react-native-get-random-values';
export function videoId(url) {
  const regex = /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/|live\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#&?]*).*/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function getRandomInt(max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array); // now works
  return array[0] % max;
}

export function generate(alphabet, length) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet[getRandomInt(alphabet.length)];
  }
  return result;
}

export function generateContentPlaybackNonce() {
  return generate(ALPHABET, 16);
}

export function generateTParameter() {
  return generate(ALPHABET, 12);
}
export async function getVisitorId() {
  const url = "https://youtubei.googleapis.com/youtubei/v1/visitor_id?prettyPrint=false";

  const body = {
    context: {
      request: {
        internalExperimentFlags: [],
        useSsl: true,
      },
      client: {
        androidSdkVersion: 35,
        utcOffsetMinutes: 0,
        osVersion: "15",
        hl: "en-GB",
        clientName: "ANDROID",
        gl: "GB",
        clientScreen: "WATCH",
        clientVersion: "19.28.35",
        osName: "Android",
        platform: "MOBILE",
      },
      user: {
        lockedSafetyMode: false,
      },
    },
  };

  const headers = {
    "User-Agent": "com.google.android.youtube/19.28.35 (Linux; U; Android 15; GB) gzip",
    "X-Goog-Api-Format-Version": "2",
    "Content-Type": "application/json",
    "Accept-Language": "en-GB, en;q=0.9",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();

    return json.responseContext.visitorData;
  } catch (error) {
    console.error("Failed to fetch visitorId:", error);
    return null;
  }
}

export async function androidPlayerResponse(cpn, visitorData, videoId, t) {
  const url = `https://youtubei.googleapis.com/youtubei/v1/reel/reel_item_watch?prettyPrint=false&t=${encodeURIComponent(t)}&id=${encodeURIComponent(videoId)}&fields=playerResponse`;

  const body = {
    cpn,
    contentCheckOk: true,
    context: {
      request: {
        internalExperimentFlags: [],
        useSsl: true,
      },
      client: {
        androidSdkVersion: 35,
        utcOffsetMinutes: 0,
        osVersion: "15",
        hl: "en-GB",
        clientName: "ANDROID",
        gl: "GB",
        clientScreen: "WATCH",
        clientVersion: "19.28.35",
        osName: "Android",
        platform: "MOBILE",
        visitorData,
      },
      user: {
        lockedSafetyMode: false,
      },
    },
    racyCheckOk: true,
    videoId,
    playerRequest: {
      videoId,
    },
    disablePlayerResponse: false,
  };

  const headers = {
    "User-Agent": "com.google.android.youtube/19.28.35 (Linux; U; Android 15; GB) gzip",
    "X-Goog-Api-Format-Version": "2",
    "Content-Type": "application/json",
    "Accept-Language": "en-GB, en;q=0.9",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    return json;
  } catch (error) {
    console.error("Error in androidPlayerResponse:", error);
    throw error;
  }
}
export async function getStreamingData(videoId) {
  try {
    const cpn = generateContentPlaybackNonce();
    const tp = generateTParameter();
    const visitorData = await getVisitorId();

    const responseJson = await androidPlayerResponse(cpn, visitorData, videoId, tp);
    return responseJson;
  } catch (error) {
    return { error: error.message || "Unknown error" };
  }
}

export function convertBytes(sizeInBytes){
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (sizeInBytes >= GB) {
    return `${Math.round(sizeInBytes / GB)} GB`;
  } else if (sizeInBytes >= MB) {
    return `${Math.round(sizeInBytes / MB)} MB`;
  } else if (sizeInBytes >= KB) {
    return `${Math.round(sizeInBytes / KB)} KB`;
  } else {
    return `${sizeInBytes} Bytes`;
  }
}

export function convertSpeed(bytesPerSec) {
  const KB = 1024;
  const MB = KB * 1024;
  const GB = MB * 1024;

  if (bytesPerSec >= GB) {
    return `${Math.round(bytesPerSec / GB)} GB/s`;
  } else if (bytesPerSec >= MB) {
    return `${Math.round(bytesPerSec / MB)} MB/s`;
  } else if (bytesPerSec >= KB) {
    return `${Math.round(bytesPerSec / KB)} KB/s`;
  } else {
    return `${bytesPerSec} B/s`;
  }
}


export function txt2filename(txt) {
  const specialCharacters = [
    "@", "#", "$", "*", "&", "<", ">", "/", "\\b", "|", "?", "CON", "PRN", "AUX", "NUL",
    "COM0", "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT0", "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9", ":", "\"", "'"
  ];

  let normalString = txt;

  for (const sc of specialCharacters) {
    // Escape regex special characters except for full strings like COM1
    const safeSc = sc.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(safeSc, 'gi');
    normalString = normalString.replace(regex, '');
  }

  return normalString;
}





