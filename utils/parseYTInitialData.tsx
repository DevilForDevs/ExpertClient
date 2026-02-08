

type AnyObj = Record<string, any>;





function safeGet(obj: any, path: (string | number)[], defaultVal: any = null) {
    let cur = obj;
    try {
        for (const p of path) {
            if (cur == null) return defaultVal;
            cur = cur[p];
        }
        return cur ?? defaultVal;
    } catch {
        return defaultVal;
    }
}


function extractContinuationToken(item: AnyObj): string | null {
    return (
        item?.continuationItemRenderer
            ?.continuationEndpoint
            ?.continuationCommand
            ?.token ?? null
    );
}

function extractShortsData(item: AnyObj): ShortsData {
    const shorts = item?.shortsLockupViewModel;

    if (!shorts) {
        return {
            title: null,
            video_id: null,
            views: null,
        };
    }

    return {
        // ✅ title
        title:
            safeGet(shorts, ["overlayMetadata", "primaryText", "content"]) ||
            safeGet(shorts, ["accessibilityText"]),

        // ✅ video id (safe fallbacks)
        video_id:
            safeGet(shorts, ["onTap", "innertubeCommand", "reelWatchEndpoint", "videoId"]) ||
            safeGet(shorts, [
                "inlinePlayerData",
                "onVisible",
                "innertubeCommand",
                "watchEndpoint",
                "videoId",
            ]),

        // ❌ shorts often don’t expose views
        views:
            safeGet(shorts, ["viewCountText", "runs", 0, "text"]) ||
            safeGet(shorts, ["shortViewCountText", "runs", 0, "text"]),
    };
}

function extractVideoData(item: AnyObj): VideoData {
    const video =
        item?.richItemRenderer
            ?.content
            ?.videoWithContextRenderer;

    if (!video) {
        return {
            title: null,
            video_id: null,
            views: null,
            channel_name: null,
            channel_photo: null,
            channel_url: null,
            duration: null,
        };
    }
    const rawViews = safeGet(video, ["shortViewCountText", "runs", 0, "text"]);
    const views =
        typeof rawViews === "string"
            ? rawViews.replace(/\u00a0/g, " ")
            : null;

    return {
        title: safeGet(video, ["headline", "runs", 0, "text"]),

        video_id:
            video.videoId ||
            safeGet(video, ["navigationEndpoint", "watchEndpoint", "videoId"]),

        views,

        channel_name: safeGet(video, ["shortBylineText", "runs", 0, "text"]),

        channel_photo: safeGet(video, [
            "channelThumbnail",
            "channelThumbnailWithLinkRenderer",
            "thumbnail",
            "thumbnails",
            0,
            "url",
        ]),

        channel_url: safeGet(video, [
            "channelThumbnail",
            "channelThumbnailWithLinkRenderer", "navigationEndpoint",
            "browseEndpoint",
            "browseId"
        ]),
        duration: safeGet(video, ["lengthText", "runs", 0, "text"]),
        publishedOn: safeGet(video, ["publishedTimeText", "runs", 0, "text"])
    };
}

export function parseYTInitialData(data: AnyObj) {
    const results: initialData = {
        videos: [],
        shorts: [],
        continuationTokens: [],
    };

    const responseActions =
        data?.onResponseReceivedActions;

    let contents: AnyObj[] = [];

    if (Array.isArray(responseActions)) {
        contents =
            responseActions[0]
                ?.appendContinuationItemsAction
                ?.continuationItems || [];
    } else {
        contents =
            data?.contents
                ?.singleColumnBrowseResultsRenderer
                ?.tabs?.[0]
                ?.tabRenderer
                ?.content
                ?.richGridRenderer
                ?.contents || [];
    }

    for (const item of contents) {
        if (item.richItemRenderer) {
            results.videos.push(extractVideoData(item));
        }
        if (item.richSectionRenderer) {
            const shorts =
                item.richSectionRenderer
                    ?.content
                    ?.gridShelfViewModel
                    ?.contents || [];

            for (const s of shorts) {
                results.shorts.push(extractShortsData(s));
            }
        }

        if (item.continuationItemRenderer) {
            const token = extractContinuationToken(item);
            if (token) results.continuationTokens.push(token);
        }
    }

    return results;
}
