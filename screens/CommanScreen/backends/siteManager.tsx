import { Video } from "../../../utils/types";
import {
    NativeModules
} from 'react-native'
import { extractItems, metaPornCatSimplifiers, metaPornSimplifiers } from "./xhmparsers/parser";
import { metaPornVideoSchema, uncutmazaVideoSchema, xmazaSchema } from "./schemas";


async function handleMetaPornFeeds(link: string): Promise<Video[]> {
    const { MyNativeModule } = NativeModules;
    const BASE_URL = "https://www.metaporn.com";

    const jsonString = await MyNativeModule.htmlJsonBridge(
        "https://www.metaporn.com/",
        JSON.stringify(metaPornVideoSchema)
    );

    const parsed = JSON.parse(jsonString);

    parsed.items = parsed.items.map((item: any) => ({
        ...item,
        href: item.href
            ? new URL(item.href, BASE_URL).toString()
            : null,
        thumbnail: item.thumbnail
            ? new URL(item.thumbnail, BASE_URL).toString()
            : null,
    }));

    return metaPornSimplifiers(JSON.stringify(parsed));
}

async function handleUncustMaza(link: string): Promise<Video[]> {


    const { MyNativeModule } = NativeModules;

    let jsonString: string;

    try {
        jsonString = await MyNativeModule.htmlJsonBridge(
            link,
            JSON.stringify(uncutmazaVideoSchema)
        );
    } catch (e) {
        console.log("Native call failed", e);
        return [];
    }

    // 1️⃣ Basic sanity check
    if (!jsonString || typeof jsonString !== "string") {
        console.warn("Invalid response:", jsonString);
        return [];
    }

    // Native side returns "error: ..."
    if (jsonString.startsWith("error:") || jsonString.startsWith("http error")) {
        console.warn("Extractor error:", jsonString);
        return [];
    }

    let data: any;

    // 2️⃣ Safe JSON parse
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.log("JSON parse failed", jsonString);
        return [];
    }

    // 3️⃣ Validate structure
    if (!data || !Array.isArray(data.items)) {
        console.warn("Invalid JSON structure:", data);
        return [];
    }

    // 4️⃣ Map items → Video[]
    const videos: Video[] = [];

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

    return videos;
}


async function handleXmaaza(url: string) {
    const { MyNativeModule } = NativeModules;
    const videos: Video[] = [];
    let jsonString: string;

    try {
        jsonString = await MyNativeModule.htmlJsonBridge(
            url,
            JSON.stringify(xmazaSchema)
        );
    } catch (e) {
        console.log("Native call failed", e);
        return [];
    }

    let data: any;

    // 2️⃣ Safe JSON parse
    try {
        data = JSON.parse(jsonString);
    } catch (e) {
        console.log("JSON parse failed", jsonString);
        return [];
    }

    // 3️⃣ Validate structure
    if (!data || !Array.isArray(data.items)) {
        console.warn("Invalid JSON structure:", data);
        return [];
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

    return videos;
}

export function formatViews(value: number | string): string {
    const num = Number(value);
    if (isNaN(num)) return "0";

    if (num >= 1_000_000_000)
        return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, "") + "B";

    if (num >= 1_000_000)
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";

    if (num >= 1_000)
        return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";

    return num.toString();
}

function timeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime(); // ms difference

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
    if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    if (days < 30) return `${days} day${days !== 1 ? "s" : ""} ago`;
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
    return `${years} year${years !== 1 ? "s" : ""} ago`;
}



export async function handleDesiPornTube(url: string): Promise<Video[]> {
    const videos: Video[] = [];


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
        Referer: "https://desi-porn.tube/",
    };

    const response = await fetch(url, {
        method: "GET",
        headers,
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const text = await response.text(); // same as response.text in Python
    const jsonObject = JSON.parse(text);


    /*
  [
    "time.sphinx",
    "time.sql",
    "time.api",
    "params",
    "total_count",
    "sphinx",
    "pages",
    "videos"

    console.log(Object.keys(jsonObject));
]
*/

    for (const item of jsonObject.videos) {
        videos.push({
            title: String(item.title),
            thumbnail: item.scr, // ✅ correct
            duration: item.duration ?? "",
            publishedOn: timeAgo(item.post_date),
            views: formatViews(item.video_viewed) ?? "0",
            type: "video",
            pageUrl: `https://desi-porn.tube/video/${item.video_id}/${item.dir}/`,
            videoId: item.video_id,
        });
    }
    return videos

}



export async function feeds(params: string): Promise<Video[]> {
    const videos: Video[] = [];
    const { MyNativeModule } = NativeModules;

    if (params.includes("xhamster1")) {
        const jsonString = await MyNativeModule.getXhInitials(
            'https://xhamster1.desi/'
        );
        const result = extractItems(JSON.parse(jsonString));
        return result.videos
    }
    if (params.includes("metaporn")) {
        return await handleMetaPornFeeds(params)
    }

    if (params.includes("uncutmaza")) {
        return await handleUncustMaza(params);
    }

    if (params.includes("xmaza")) {
        return await handleXmaaza(params);
    }

    if (params.includes("desi-porn")) {
        return await handleDesiPornTube("https://desi-porn.tube/api/json/videos2/14400/str/latest-updates/20/top-country.in.1.all...json");
    }

    return videos;
}


export async function nextBrowseContinuation(baseUrl: string, currentPage: number, currentCategory: string, query: string): Promise<Video[]> {
    console.log("browisng");
    const videos: Video[] = [];
    const { MyNativeModule } = NativeModules;

    if (baseUrl.includes("xhamster1")) {
        let url = '';
        if (query) {
            url = `https://xhamster1.desi/search/${encodeURIComponent(query)}?page=${currentPage}`;
        } else {
            url = `https://xhamster1.desi/${currentPage}`;
        }
        const jsonString = await MyNativeModule.getXhInitials(url);
        const result = extractItems(JSON.parse(jsonString));
        return result.videos
    }

    if (baseUrl.includes("metaporn")) {

        if (currentCategory == "") {
            return videos;
        }

    }

    if (baseUrl.includes("uncutmaza")) {
        return await handleUncustMaza(baseUrl + `${currentPage}/`);
    }

    if (baseUrl.includes("xmaza")) {
        return await handleXmaaza(baseUrl + `page/${currentPage}/`);
    }

    if (baseUrl.includes("desi-porn")) {
        return await handleDesiPornTube(`https://desi-porn.tube/api/json/videos2/86400/str/latest-updates/60/..${currentPage}.all...json`);
    }


    return videos;
}


export async function searchApi(baseUrl: string, trimmed: string) {
    const { MyNativeModule } = NativeModules;
    const videos: Video[] = [];
    if (baseUrl.includes("xhamster1")) {
        const url = `https://xhamster1.desi/search/${encodeURIComponent(
            trimmed
        )}`;
        const jsonString = await MyNativeModule.getXhInitials(url);
        const result = extractItems(JSON.parse(jsonString));
        return result.videos
    }

    if (baseUrl.includes("metaporn")) {

    }
    return videos;
}



export async function categoryItems(baseUrl: string, pageNo: number): Promise<Video[]> {
    console.log(baseUrl + `page/${pageNo}/`);
    const { MyNativeModule } = NativeModules;
    const videos: Video[] = [];
    if (baseUrl.includes("xhamster1")) {

    }

    if (baseUrl.includes("uncutmaza")) {
        if (pageNo == 1) {
            return await handleUncustMaza(baseUrl)
        } else {
            return await handleUncustMaza(baseUrl + `page/${pageNo}/`)
        }
    }

    if (baseUrl.includes("xmaza")) {
        console.log(pageNo);
        if (pageNo == 1) {
            return await handleXmaaza(baseUrl)
        } else {
            return await handleXmaaza(baseUrl + `page/${pageNo}/`)
        }

    }

    if (baseUrl.includes("metaporn")) {
        const BASE_URL = "https://www.metaporn.com";
        const metaPornVideoSchema = {
            container: "div.card.sub",

            title: {
                tag: "a",
                selector: ".item-title",
                attr: "text",
            },

            thumbnail: {
                tag: "img",
                selector: ".item-image",
                attr: "src",
            },
            host: {
                tag: "a",
                selector: ".item-source",
                attr: "text",
            },

            outUrl: {
                tag: "a",
                selector: ".item-link.rate-link",
                attr: "href",
            },
        };
        if (pageNo == 1) {
            const jsonString = await MyNativeModule.htmlJsonBridge(
                baseUrl,
                JSON.stringify(metaPornVideoSchema)

            );

            const parsed = JSON.parse(jsonString);

            parsed.items = parsed.items.map((item: any) => ({
                ...item,
                outUrl: item.outUrl
                    ? new URL(item.outUrl, BASE_URL).toString()
                    : null,
                thumbnail: item.thumbnail
                    ? new URL(item.thumbnail, BASE_URL).toString()
                    : null,
            }));

            return metaPornCatSimplifiers(JSON.stringify(parsed));
        } else {
            const jsonString = await MyNativeModule.htmlJsonBridge(
                baseUrl + `?page=${pageNo}`,
                JSON.stringify(metaPornVideoSchema)

            );

            const parsed = JSON.parse(jsonString);

            parsed.items = parsed.items.map((item: any) => ({
                ...item,
                outUrl: item.outUrl
                    ? new URL(item.outUrl, BASE_URL).toString()
                    : null,
                thumbnail: item.thumbnail
                    ? new URL(item.thumbnail, BASE_URL).toString()
                    : null,
            }));

            return metaPornCatSimplifiers(JSON.stringify(parsed));
        }
    }
    return videos;
}