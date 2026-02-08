

import { getIosPlayerResponse } from "./EndPoints";
import { Video, FormatGroup, AskFormatModel, DownloadItem } from "./types";



const findAudioFmt = (container: "mp4" | "webm", requiredFmts: AskFormatModel[]) => {
  for (const element of requiredFmts) {
    for (const fmt of element.formatGroup) {
      if (container === "mp4" && fmt.itag === 140) return fmt;
      if (container === "webm" && fmt.itag === 251) return fmt;
    }
  }
  return null;
};

// 🔹 STEP 1: Extract the video/audio selection logic
export function getSelectedFormats(selectedItag: number, requiredFmts: AskFormatModel[]) {
  let selectedVideoFmt: any = null;
  let selectedAudioFmt: any = null;

  requiredFmts.forEach((element) => {
    const fmts = element.formatGroup;
    fmts.forEach((fmt) => {
      if (fmt.itag === selectedItag) {
        selectedVideoFmt = fmt;

        if (fmt.url.includes("mime=video%2Fmp4")) {
          selectedAudioFmt = findAudioFmt("mp4", requiredFmts);
        } else if (fmt.url.includes("mime=video%2Fwebm")) {
          selectedAudioFmt = findAudioFmt("webm", requiredFmts);
        } else {
          selectedAudioFmt = fmt;
        }
      }
    });
  });

  return { selectedVideoFmt, selectedAudioFmt };
}
export const ytThumbs = (id: string) => ({
  hq: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
  mq: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
  sd: `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
  def: `https://i.ytimg.com/vi/${id}/default.jpg`,
});

export async function fetchHlsUrl(videoId: string): Promise<string | null> {
  try {
    if (!videoId) return null;

    const result = await getIosPlayerResponse(videoId);
    const streamingData = result?.streamingData;

    if (!streamingData?.hlsManifestUrl) {
      console.warn("No HLS for video:", videoId);
      return null;
    }

    return streamingData.hlsManifestUrl;

  } catch (err) {
    console.error("Failed to fetch player response:", err);
    return null;
  }
}





