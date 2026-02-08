import { Video } from "./types"

// ---------- SAFE GET (supports negative index) ----------
const get = <T = any>(
    obj: any,
    path: (string | number)[],
    defaultValue: T | null = null
): T | null => {
    try {
        return path.reduce((acc: any, key) => {
            if (acc == null) return undefined

            // handle negative index for arrays
            if (typeof key === "number" && Array.isArray(acc)) {
                const index = key < 0 ? acc.length + key : key
                return acc[index]
            }

            return acc[key]
        }, obj) as T
    } catch {
        return defaultValue
    }
}


// ---------- EXTRACT VIDEO ----------
function extractVideo(
    item: any,
    channelTitle: string | null,
    channelAvatar: string | null
): Video {
    const vr =
        get(item, ["richItemRenderer", "content", "videoRenderer"], {}) ?? {}

    const views =
        get(vr, ["shortViewCountText", "simpleText"]) ??
        get(vr, ["viewCountText", "simpleText"])

    return {
        type: "video",
        videoId: get(vr, ["videoId"]) ?? "",
        title: get(vr, ["title", "runs", 0, "text"]) ?? "",
        duration: get(vr, ["lengthText", "simpleText"]) ?? "",
        views,
        publishedOn: get(vr, ["publishedTimeText", "simpleText"]) ?? "",
        channel: channelAvatar ?? "",
        channelName: channelTitle ?? ""
    }
}

type channelResult = {
    continuation?: string,
    videos: Video[]
}

export type channelTabs = {
    tabIndex: number,
    browseId?: string,
    paras?: string,
    title: string
}

export function parseChannelInfo(data: any): Channel {
    const channelTabs: channelTabs[] = []
    const channelTitle = get<string>(data, [
        "header",
        "pageHeaderRenderer",
        "pageTitle",
    ])

    const channelAvatar = get<string>(data, [
        "header",
        "pageHeaderRenderer",
        "content",
        "pageHeaderViewModel",
        "image",
        "decoratedAvatarViewModel",
        "avatar",
        "avatarViewModel",
        "image",
        "sources",
        -1,
        "url",
    ])

    const subscriberCount = get<string>(data, [
        "header",
        "pageHeaderRenderer",
        "content",
        "pageHeaderViewModel",
        "metadata",
        "contentMetadataViewModel",
        "metadataRows", 1,
        "metadataParts", 0,
        "text",
        "content",
    ])

    const totalVideos = get<string>(data, [
        "header",
        "pageHeaderRenderer",
        "content",
        "pageHeaderViewModel",
        "metadata",
        "contentMetadataViewModel",
        "metadataRows", 1,
        "metadataParts", 1,
        "text",
        "content",
    ])

    const posterImage = get<string>(data, [
        "header",
        "pageHeaderRenderer",
        "content",
        "pageHeaderViewModel",
        "banner",
        "imageBannerViewModel",
        "image",
        "sources",
        -1,
        "url",
    ])



    const tabs =
        get<any[]>(
            data,
            [
                "contents",
                "twoColumnBrowseResultsRenderer",
                "tabs"
            ],
            []
        ) ?? []

    for (const item of tabs) {
        const paras = get<string>(item, ["tabRenderer",
            "endpoint", "browseEndpoint", "params"
        ])
        const browseId = get<string>(item, ["tabRenderer",
            "endpoint", "browseEndpoint", "browseId"
        ])
        const title = get<string>(item, ["tabRenderer",
            "title"
        ])
        channelTabs.push({
            tabIndex: tabs.indexOf(item),
            paras: paras ?? undefined,
            browseId: browseId ?? undefined,
            title: title ?? ""
        });
    }



    return {
        name: channelTitle ?? "",
        subscribers: subscriberCount ?? "",
        totalVideos: totalVideos ?? "",
        photo: channelAvatar ?? "",
        posterUrl: posterImage ?? "",
        channelTabs: channelTabs ?? []
    }
}



export function parseVideosTab(data: any, tabIndex: number): channelResult {
    const videos: Video[] = [];
    let continuationToken: string | null = null;

    const channelTitle = get<string>(data, ["header", "pageHeaderRenderer", "pageTitle"]);
    const channelAvatar = get<string>(data, [
        "header",
        "pageHeaderRenderer",
        "content",
        "pageHeaderViewModel",
        "image",
        "decoratedAvatarViewModel",
        "avatar",
        "avatarViewModel",
        "image",
        "sources",
        -1,
        "url",
    ]);

    // Helper function to extract videos and continuation token
    const processItems = (items: any[]) => {
        for (const item of items) {
            if (item.richItemRenderer) {
                videos.push(extractVideo(item, channelTitle, channelAvatar));
            }
            if (item.continuationItemRenderer) {
                continuationToken = get<string>(item, [
                    "continuationItemRenderer",
                    "continuationEndpoint",
                    "continuationCommand",
                    "token",
                ]);
            }
        }
    };

    // 1️⃣ Process initial grid items
    const gridItems = get<any[]>(data, [
        "contents",
        "twoColumnBrowseResultsRenderer",
        "tabs",
        tabIndex,
        "tabRenderer",
        "content",
        "richGridRenderer",
        "contents",
    ]) ?? [];
    processItems(gridItems);

    // 2️⃣ Process continuation items
    const continuationItems = get<any[]>(data, [
        "onResponseReceivedActions",
        0,
        "appendContinuationItemsAction",
        "continuationItems",
    ]) ?? [];
    processItems(continuationItems);

    return { videos, continuation: continuationToken ?? undefined };
}
