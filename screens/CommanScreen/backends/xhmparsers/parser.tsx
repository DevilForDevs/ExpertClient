
import { Video } from "../../../../utils/types";

function formatViews(value: any): string {
    const num = Number(value);
    if (!isFinite(num)) return "";

    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1_000) {
        return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return String(num);
}

function formatDuration(value: any): string | undefined {
    const totalSeconds = Number(value);
    if (!isFinite(totalSeconds) || totalSeconds <= 0) return undefined;

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const pad = (n: number) => String(n).padStart(2, "0");

    if (hours > 0) {
        return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${minutes}:${pad(seconds)}`;
}

export function normalizeXhImageUrl(url?: string): string {
    if (!url || typeof url !== "string") return "";

    let fixed = url;

    // Remove size / transform part like: s(w:526,h:298),jpeg
    fixed = fixed.replace(/\/s\([^)]*\),?jpeg/gi, "");

    // Encode for React Native (handles (), commas, etc.)
    fixed = encodeURI(fixed);

    return fixed;
}



export type ExtractedData = {
    videos: Video[];
    hls: string[];
    standard: string[];
};

export function metaPornSimplifiers(jsonString: string): Video[] {
    const videos: Video[] = [];
    let parsed;

    try {
        parsed = JSON.parse(jsonString);
    } catch {
        console.error("Invalid JSON:", jsonString);
        return videos;
    }

    if (Array.isArray(parsed)) {
        parsed.forEach(el => console.log(el));
    } else if (Array.isArray(parsed.items)) {
        parsed.items.forEach((el: any) => {
            videos.push(
                {
                    type: "video",
                    videoId: String(el.title),
                    title: String(el.title),
                    duration: "",
                    views: "",
                    channel: "",
                    channelName: "",
                    channelUrl: "",
                    thumbnail: el.thumbnail,
                    pageUrl: el.href,
                }
            )
        });
        return videos
    } else {
        console.log("No iterable items found");
    }
    return videos
}

export function metaPornCatSimplifiers(jsonString: string): Video[] {
    const videos: Video[] = [];

    let parsed;

    try {
        parsed = JSON.parse(jsonString);
    } catch {
        console.error("Invalid JSON:", jsonString);
        return videos;
    }

    if (Array.isArray(parsed)) {
        parsed.forEach(el => console.log(el));
    } else if (Array.isArray(parsed.items)) {
        parsed.items.forEach((el: any) => {
            if (el.host?.toLowerCase() === "faphouse") return;

            videos.push({
                type: "video",
                videoId: String(el.title),
                title: String(el.title),
                duration: el.duration,
                views: "",
                channel: "",
                channelName: el.host,
                channelUrl: "",
                thumbnail: el.thumbnail,
                pageUrl: el.outUrl,
            });
        });

        return videos;
    } else {
        console.log("No iterable items found");
    }
    return videos;
}


const toArray = (v: any): any[] => Array.isArray(v) ? v : [];

const isObject = (v: any): v is Record<string, any> =>
    v !== null && typeof v === "object";



export function extractItems(data: any): ExtractedData {
    const videos: Video[] = [];

    /* ---------------- VIDEO LISTS ---------------- */

    const videoLists = [
        data?.layoutPage?.videoListProps?.videoThumbProps,
        data?.searchResult?.videoThumbProps,
        data?.videoThumbProps,
        data?.relatedVideosComponent
            ?.videoTabInitialData
            ?.videoListProps
            ?.videoThumbProps,
    ];

    for (const list of videoLists.flatMap(toArray)) {
        videos.push({
            type: "video",
            videoId: String(list?.id ?? ""),
            title: String(list?.title ?? ""),
            duration: formatDuration(list?.duration),
            views: formatViews(list?.views),
            channel: normalizeXhImageUrl(list?.landing?.logo),
            channelName: list?.landing?.name,
            channelUrl: list?.landing?.link,
            thumbnail: list?.thumbURL ?? "",
            pageUrl: list?.pageURL,
        });
    }

    /* ---------------- RELATED VIDEOS ---------------- */

    for (const item of toArray(data?.xplayerPluginSettings?.relatedVideos)) {
        videos.push({
            type: "video",
            videoId: String(item?.id ?? item?.videoId ?? ""),
            title: String(item?.title ?? ""),
            duration: formatDuration(item?.duration),
            views: formatViews(item?.views),
            thumbnail: item?.thumbUrl ?? "",
            pageUrl: item?.pageURL ?? item?.url,
        });
    }

    /* ---------------- SOURCES ---------------- */

    const hls: string[] = [];
    const standard: string[] = [];

    const sources = data?.xplayerSettings?.sources;

    if (isObject(sources)) {
        for (const value of Object.values(sources)) {

            // HLS-like objects
            if (isObject(value) && typeof value.url === "string") {
                hls.push(value.url);
                continue;
            }

            // Standard formats (arrays)
            if (Array.isArray(value)) {
                for (const item of value) {
                    if (typeof item?.url === "string") {
                        standard.push(item.url);
                    }
                }
            }

            // Nested objects (future-proof)
            if (isObject(value)) {
                for (const nested of Object.values(value)) {
                    if (typeof nested?.url === "string") {
                        hls.push(nested.url);
                    }
                }
            }
        }
    }

    return { videos, hls, standard };
}






export async function fetchM3u8Resolutions(
    masterUrl: string
): Promise<Record<string, string>> {
    try {
        const res = await fetch(masterUrl)
        if (!res.ok) return {}

        const text = await res.text()
        const lines = text.split(/\r?\n/)
        const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf("/"))

        const variants: Record<string, string> = {}

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]

            if (line.startsWith("#EXT-X-STREAM-INF") && i + 1 < lines.length) {
                const resolutionPart = line
                    .split(",")
                    .find(p => p.trim().startsWith("RESOLUTION="))

                if (!resolutionPart) continue

                const resolution = resolutionPart.split("=")[1].trim()
                const url = lines[i + 1].trim()

                const fullUrl = url.startsWith("http")
                    ? url
                    : `${baseUrl}/${url}`

                variants[resolution] = fullUrl
            }
        }

        return variants
    } catch {
        return {}
    }
}




// item?.landing?.logo