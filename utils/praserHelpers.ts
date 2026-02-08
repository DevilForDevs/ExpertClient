import { AskFormatModel, FormatGroup } from "./types";
export function deepGet(obj: unknown, ...keys: (string | number)[]): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null) return null;

    if (typeof key === "string" && typeof current === "object" && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[key];
    } else if (typeof key === "number" && Array.isArray(current)) {
      current = current[key];
    } else {
      return null;
    }
  }
  return current;
}



export function mapAdaptiveFormatsToRequired(adaptiveFormats: any[]): AskFormatModel[] {
  if (!adaptiveFormats || !Array.isArray(adaptiveFormats)) return [];

  const groups: Record<string, FormatGroup[]> = {};

  adaptiveFormats.forEach((fmt) => {
    const mimeType = fmt.mimeType || '';
    const contentLength = Number(fmt.contentLength) || 0;
    let container = 'Unknown';
    let type = 'Unknown';
    let codec = 'Unknown';

    // Extract container and codec
    const mimeMatch = mimeType.match(/(\w+)\/(\w+);?\s*codecs="?(.*?)"?$/);
    if (mimeMatch) {
      type = mimeMatch[1]; // video or audio
      container = mimeMatch[2]; // mp4, webm
      codec = mimeMatch[3]; // avc1.640028, av01, opus, etc.
    }

    // Determine group title
    let groupTitle = 'Unknown';
    if (type === 'video' && container === 'mp4' && codec.includes('av01')) groupTitle = 'MP4 AV01';
    else if (type === 'video' && container === 'mp4' && codec.includes('avc1')) groupTitle = 'MP4 AVC';
    else if (type === 'audio' && container === 'mp4') groupTitle = 'MP4 Audio';
    else if (type === 'video' && container === 'webm') groupTitle = 'WebM';
    else if (type === 'audio' && container === 'webm') groupTitle = 'WebM Audio';

    if (!groups[groupTitle]) groups[groupTitle] = [];

    const info = fmt.qualityLabel || (fmt.bitrate ? `${Math.floor(fmt.bitrate / 1000)} kbps` : 'Unknown');
    groups[groupTitle].push({ itag: fmt.itag, info, contentLength, url: fmt.url });
  });

  // Desired order
  const order = ['MP4 AVC', 'MP4 AV01', 'MP4 Audio', 'WebM', 'WebM Audio', 'Unknown'];

  return order
    .filter((title) => groups[title])
    .map((title) => ({ title, formatGroup: groups[title] }));
}













