import { decode as atob } from "base-64"; // install: npm install base-64
import { Video, VideoDescription } from "../../../utils/types";
import { NativeModules } from 'react-native'
import { extractItems } from "../../CommanScreen/backends/xhmparsers/parser";
import { uncutmazaVideoSchema, xmazaSchema } from "../../CommanScreen/backends/schemas";
import { formatViews, handleDesiPornTube } from "../../CommanScreen/backends/siteManager";




function normalizeUrl(url: string): string {
    // replace wrong delimiter
    url = url.replace(/>/g, "?");

    // remove trailing ?
    if (url.endsWith("?")) {
        url = url.slice(0, -1);
    }

    // ensure only one ?
    const firstQ = url.indexOf("?");
    if (firstQ !== -1) {
        const before = url.slice(0, firstQ + 1);
        const after = url
            .slice(firstQ + 1)
            .replace(/\?/g, "");
        url = before + after;
    }

    return url;
}
function decodeVideoUrl(obf: string): string {
    let s = obf;

    // 1️⃣ JSON-unescape (\u041c etc.)
    if (s.includes("\\u")) {
        try {
            s = JSON.parse(`"${s}"`);
        } catch { }
    }

    // 2️⃣ Fix Cyrillic homoglyphs
    const cyr: Record<string, string> = {
        "А": "A", "В": "B", "С": "C", "Е": "E",
        "М": "M", "Н": "H", "О": "O", "Р": "P",
        "Т": "T", "Х": "X", "К": "K", "Л": "L",
        "И": "I", "Д": "D", "Ф": "F", "Г": "G",
    };

    Object.entries(cyr).forEach(([k, v]) => {
        s = s.split(k).join(v);
    });

    // 3️⃣ Restore Base64 separators
    s = s.replace(/,/g, "+").replace(/~/g, "/");

    // 4️⃣ Fix Base64 padding
    while (s.length % 4 !== 0) {
        s += "=";
    }

    // 5️⃣ Base64 decode (latin-1 safe)
    let decoded = atob(s);

    // 6️⃣ Reverse d(t)
    decoded = decoded.replace(/\+/g, "%20");
    decoded = decodeURIComponent(decoded);

    // 7️⃣ Prepend domain if needed
    if (decoded.startsWith("/")) {
        decoded = "https://desi-porn.tube" + decoded;
    }

    return normalizeUrl(decoded);
}


export function decodeLParam(url: string): string | null {
    try {
        // 1️⃣ extract 'l' parameter manually
        const query = url.split("?")[1] || "";
        const params = query.split("&").map(p => p.split("="));
        const lParam = params.find(([key]) => key === "l")?.[1];
        if (!lParam) return null;

        // 2️⃣ fix URL-safe base64 & padding
        let raw = decodeURIComponent(lParam).replace(/-/g, "+").replace(/_/g, "/");
        raw += "=".repeat((4 - (raw.length % 4)) % 4);

        // 3️⃣ decode base64 to binary string
        const decodedStr = atob(raw);

        // 4️⃣ extract URL using regex
        const match = decodedStr.match(/https?:\/\/[^\x00-\x20"']+/);
        return match ? match[0] : null;
    } catch (err) {
        console.error("Error decoding URL:", err);
        return null;
    }
}

export async function getHlsStreamVariants(
    masterUrl: string
): Promise<StreamVariant[]> {
    const response = await fetch(masterUrl);
    const text = await response.text();

    const lines = text.split("\n");
    const variants: StreamVariant[] = [];

    let currentResolution: string | undefined;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Parse resolution from EXT-X-STREAM-INF
        if (line.startsWith("#EXT-X-STREAM-INF")) {
            const resMatch = line.match(/RESOLUTION=(\d+x\d+)/);
            currentResolution = resMatch ? resMatch[1] : undefined;
            continue;
        }

        // Next non-comment line is the variant playlist URL
        if (line && !line.startsWith("#") && currentResolution) {
            const absoluteUrl = line.startsWith("http")
                ? line
                : new URL(line, masterUrl).toString();

            variants.push({
                ref: absoluteUrl,
                type: "hls",
                resolution: currentResolution,
            });

            currentResolution = undefined;
        }
    }

    return variants;
}

export function getDomainUrl(videoUrl: string): string {
    const match = videoUrl.match(/^(https?:\/\/[^\/]+)/i);
    return match ? match[1] : "";
}


async function xhamsterPlayerPage(
    mvideo: Video,
    url: string
): Promise<VideoDescription> {

    const { MyNativeModule } = NativeModules;

    const baseVideoDetails: VideoDescription = {
        title: mvideo.title,
        channelName: mvideo.channelName ?? "",
        channelPhoto: "",
        channelId: "",
        video: mvideo,
        hashTags: "",
        hlsUrl: undefined,
        views: 0,
        uploaded: "scrapper failed",
        subscriber: "",
        likes: "",
        dislikes: "",
        commentsCount: "00k",
        suggestedVideos: [],
    };

    let jsoboject: any;
    try {
        const jsonString = await MyNativeModule.getXhInitials(url);
        jsoboject = JSON.parse(jsonString);
    } catch {
        return baseVideoDetails;
    }



    const result = extractItems(jsoboject);
    const homepage = getDomainUrl(jsoboject.videoModel.pageURL) + "/";
    const videoHeaders: VideoHeaders = {
        Referer: homepage,
        Origin: homepage,
        "User-Agent": "Mozilla/5.0",
        Accept: "*/*",
    };

    const streamingVariants = await getHlsStreamVariants(jsoboject?.hlsUrl ?? "")
    streamingVariants.push(
        {
            type: "mp4",
            ref: jsoboject.mp4Url,
            resolution: "480p"
        }
    )


    return {
        ...baseVideoDetails,
        channelPhoto:
            jsoboject?.videoSponsor?.avatarUrl ??
            mvideo.channel ??
            "",
        channelId: jsoboject?.videoEntity?.authorId ?? "",
        hlsUrl: jsoboject?.hlsUrl ?? undefined,
        views: jsoboject?.videoEntity?.views ?? 0,
        uploaded: jsoboject?.videoEntity?.dateAgo ?? "",
        commentsCount: jsoboject?.videoEntity?.commentsCount ?? 0,
        suggestedVideos: result.videos,
        streamingRefrer: videoHeaders,
        streamingSources: streamingVariants
    };
}

async function handleUncustMaza(mvideo: Video, link: string): Promise<VideoDescription> {
    const { MyNativeModule } = NativeModules;

    let jsonString: string;
    const baseVideoDetails: VideoDescription = {
        title: mvideo.title,
        channelName: mvideo.channelName ?? "",
        channelPhoto: "",
        channelId: "",
        video: mvideo,
        hashTags: "",
        hlsUrl: undefined,
        views: 0,
        uploaded: "scrapper failed",
        subscriber: "",
        likes: "",
        dislikes: "",
        commentsCount: "00k",
        suggestedVideos: [],
    };


    try {
        jsonString = await MyNativeModule.htmlJsonBridge(
            link,
            JSON.stringify({
                ...uncutmazaVideoSchema,

                /* =========================
                   MULTIPLE CONTAINERS
                   ========================= */
                $containers: {
                    // Episodes list page
                    episodes: {
                        selector: "article.episode-item",
                        schema: {
                            title: {
                                selector: "h3.episode-title",
                                attr: "text",
                            },

                            url: {
                                selector: "a",
                                attr: "href",
                            },

                            thumbnail: {
                                selector: "img",
                                attr: "src",
                            },
                        },
                    },
                },

                /* =========================
                   GLOBAL FIELDS (unchanged)
                   ========================= */
                video: {
                    selector: "video#my-video",
                    attr: "src",
                    scope: "global",
                },

                series: {
                    selector: ".series-list a",
                    scope: "global",
                    multiple: true,
                    attr: "text",
                },

                models: {
                    selector: ".model-list a",
                    scope: "global",
                    multiple: true,
                    attr: "text",
                },
            })
        );
    } catch (e) {
        console.error("Native call failed", e);
        return baseVideoDetails;
    }

    // 1️⃣ Basic sanity check
    if (!jsonString || typeof jsonString !== "string") {
        console.warn("Invalid response:", jsonString);
        return baseVideoDetails;
    }

    // Native side returns "error: ..."
    if (jsonString.startsWith("error:") || jsonString.startsWith("http error")) {
        console.warn("Extractor error:", jsonString);
        return baseVideoDetails;
    }

    let data: any;

    // 2️⃣ Safe JSON parse
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON parse failed", jsonString);
        return baseVideoDetails;
    }


    // 3️⃣ Validate structure
    if (!data || !Array.isArray(data.items)) {
        console.warn("Invalid JSON structure:", data);
        return baseVideoDetails;
    }

    // 4️⃣ Map items → Video[]
    const videos: Video[] = [];

    try {
        for (const item of data.globals.episodes) {
            if (!item?.title || !item?.thumbnail) continue;
            videos.push({
                title: String(item.title),
                thumbnail: String(item.thumbnail),
                duration: item.duration ?? "",
                publishedOn: item.uploaded ?? "",
                views: "Views Not found",
                type: "video",
                pageUrl: item.url,
                videoId: String(item.url ?? item.title),
            });
        }
    } catch (error) {
        console.log(error)
    }



    for (const item of data.items) {
        if (!item?.title || !item?.thumbnail) continue;

        videos.push({
            title: String(item.title),
            thumbnail: String(item.thumbnail),
            duration: item.duration ?? "",
            publishedOn: item.uploaded ?? "",
            views: "Views Not found",
            type: "video",
            pageUrl: item.url,
            videoId: String(item.url ?? item.title),
        });
    }



    const homepage = getDomainUrl(mvideo.pageUrl ?? "") + "/";


    const videoHeaders: VideoHeaders = {
        Referer: homepage,
        Origin: homepage,
        "User-Agent": "Mozilla/5.0",
        Accept: "*/*",
    };

    const streamingVariants: StreamVariant[] = []
    streamingVariants.push(
        {
            type: "mp4",
            ref: data.globals.video,
            resolution: "HD"
        }
    )
    const tags = data.globals.series + " " + data.globals.models

    return {
        ...baseVideoDetails,
        channelPhoto: "https://uncutmaza.com.co/wp-content/uploads/2024/11/cropped-UncutMaza-32x32.png",
        channelId: "Uncutmaza",
        hlsUrl: undefined,
        views: 0,
        channelName: "Uncutmaza",
        uploaded: mvideo.publishedOn ?? "",
        commentsCount: "0",
        suggestedVideos: videos,
        streamingRefrer: videoHeaders,
        streamingSources: streamingVariants,
        hashTags: tags

    };
}


async function handlexmaaza(mvideo: Video): Promise<VideoDescription> {
    const { MyNativeModule } = NativeModules;
    const videos: Video[] = [];
    const baseVideoDetails: VideoDescription = {
        title: mvideo.title,
        channelName: mvideo.channelName ?? "",
        channelPhoto: "",
        channelId: "",
        video: mvideo,
        hashTags: "",
        hlsUrl: undefined,
        views: 0,
        uploaded: "scrapper failed",
        subscriber: "",
        likes: "",
        dislikes: "",
        commentsCount: "00k",
        suggestedVideos: [],
    };

    let jsonString: string;

    try {
        jsonString = await MyNativeModule.htmlJsonBridge(
            mvideo.pageUrl,
            JSON.stringify({
                ...xmazaSchema,
                video: {
                    selector: 'meta[itemprop="contentURL"]',
                    attr: "content",
                    scope: "global",
                },
                tagNames: {
                    selector: '.tags-list a.label',
                    scope: "global",
                    multiple: true,
                    attr: "text",
                },
            })
        );
    } catch (e) {
        console.error("Native call failed", e);
        return baseVideoDetails;
    }

    let data: any;

    // 2️⃣ Safe JSON parse
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.error("JSON parse failed", jsonString);

    }

    // 3️⃣ Validate structure
    if (!data || !Array.isArray(data.items)) {
        console.warn("Invalid JSON structure:", data);

    }

    for (const item of data.items) {
        if (!item?.title || !item?.thumbnail) continue;

        videos.push({
            title: String(item.title),
            thumbnail: String(item.thumbnail),
            duration: item.duration ?? "",
            publishedOn: "",
            views: item.quality ?? "",
            type: "video",
            pageUrl: item.url,
            videoId: item.postId,
        });
    }


    const streamingVariants: StreamVariant[] = []
    streamingVariants.push(
        {
            type: "mp4",
            ref: data.globals.video,
            resolution: "HD"
        }
    )
    const variant = streamingVariants[0];
    const domain = getDomainUrl(variant.ref)
    const videoHeaders: VideoHeaders = {
        Referer: variant.ref,
        Origin: domain,
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/144.0.0.0 Safari/537.36",
        Accept: "*/*",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8,hi;q=0.7",
        Connection: "keep-alive",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "Sec-CH-UA": `"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"`,
        "Sec-CH-UA-Mobile": "?0",
        "Sec-CH-UA-Platform": `"Windows"`,
        "Sec-Fetch-Dest": "video",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "same-origin",
    };

    const tagsArray = data.globals.tagNames;
    const tagsString = Array.isArray(tagsArray) ? tagsArray.join(' ') : '';

    return {
        ...baseVideoDetails,
        channelPhoto: "https://uncutmaza.com.co/wp-content/uploads/2024/11/cropped-UncutMaza-32x32.png",
        channelId: "Uncutmaza",
        hlsUrl: undefined,
        views: 0,
        channelName: "Uncutmaza",
        uploaded: mvideo.publishedOn ?? "",
        commentsCount: "0",
        suggestedVideos: videos,
        streamingRefrer: videoHeaders,
        streamingSources: streamingVariants,
        hashTags: tagsString

    };
}





async function handleDesiTube(mvideo: Video): Promise<VideoDescription> {
    const videoId = Number(mvideo.videoId);
    const bucket = Math.floor(videoId / 1000) * 1000;
    const headers: HeadersInit_ = {
        "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) " +
            "Chrome/122.0.0.0 Safari/537.36",
        Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        Referer: mvideo.pageUrl ?? "https://desi-porn.tube/",
    };
    // https://desi-porn.tube/api/json/video/86400/0/268000/268715.json
    const url = `https://desi-porn.tube/api/json/video/86400/0/${bucket}/${videoId}.json`;

    const response = await fetch(url, {
        method: "GET",
        headers,
    });
    const text = await response.text(); // ✅ function call
    const jsonObject = JSON.parse(text);
    const baseVideoDetails: VideoDescription = {
        title: mvideo.title,
        channelName: mvideo.channelName ?? "",
        channelPhoto: "",
        channelId: "",
        video: mvideo,
        hashTags: "",
        hlsUrl: undefined,
        views: 0,
        uploaded: "scrapper failed",
        subscriber: "",
        likes: "",
        dislikes: "",
        commentsCount: "00k",
        suggestedVideos: [],
    };

    const tags = ""

    const mvideos = await handleDesiPornTube(`https://desi-porn.tube/api/json/videos_related2/432000/20/0/${bucket}/${videoId}.all.1.json`)
    const responseVideoFiles = await fetch(`https://desi-porn.tube/api/videofile.php?video_id=${videoId}&lifetime=8640000`, {
        method: "GET",
        headers,
    });

    const text2 = await responseVideoFiles.text(); // ✅ function call
    const jsonObject2 = JSON.parse(text2);
    const streamingVariants: StreamVariant[] = []
    if (jsonObject2.length) {
        const firstUrlVariant = jsonObject2[0].video_url
        const realUrl = decodeVideoUrl(firstUrlVariant);
        streamingVariants.push(
            {
                type: "mp4",
                ref: realUrl,
                resolution: "HD"
            }
        )
        return {
            ...baseVideoDetails,
            channelPhoto: "https://desi-porn.tube/favicon.ico",
            channelId: "",
            hlsUrl: undefined,
            views: Number(jsonObject.video.statistics.viewed),
            channelName: "desi-porn",
            uploaded: mvideo.publishedOn ?? "",
            commentsCount: jsonObject.video.statistics.comments,
            suggestedVideos: mvideos,
            streamingRefrer: {},
            streamingSources: streamingVariants,
            hashTags: tags,
            likes: formatViews(jsonObject.video.statistics.likes),
            dislikes: formatViews(jsonObject.video.statistics.dislikes)
        };
    }

    return baseVideoDetails
}


export async function getVideoFileUrlAndDetails(video: Video): Promise<VideoDescription> {
    console.log(video);

    const mpageUrl = decodeLParam(video.pageUrl ?? "")

    const videoDetails: VideoDescription = {
        title: video.title,
        channelName: video.channelName ?? "",
        channelPhoto: "",
        channelId: "",
        video: video,
        hashTags: "",
        hlsUrl: undefined,
        views: 0,
        uploaded: "scrapper failed",
        subscriber: "",
        likes: "",
        dislikes: "",
        commentsCount: "0",
    }

    if ((mpageUrl ?? "").includes("xh.partners")) {
        return await xhamsterPlayerPage(video, mpageUrl ?? "");
    }

    if (video.pageUrl?.includes("xhamster")) {
        return await xhamsterPlayerPage(video, video.pageUrl ?? "");
    }

    if (video.pageUrl?.includes("uncutmaza")) {
        return await handleUncustMaza(video, video.pageUrl);
    }

    if (video.pageUrl?.includes("xmaza")) {
        return await handlexmaaza(video);
    }

    if (video.pageUrl?.includes("desi-porn")) {
        return await handleDesiTube(video);
    }

    return videoDetails

}
