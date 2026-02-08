
import { Video } from "./types";
export function get<T = any>(
    obj: any,
    path: (string | number)[],
    defaultValue: T | null = null
): T | null {
    try {
        let cur = obj;
        for (const p of path) {
            cur = cur[p];
        }
        return cur as T;
    } catch {
        return defaultValue;
    }
}

export function extractShorts(data: any, tabIndex: number): {
    items: Video[];
    continuationToken: string | null;
} {
    let rawItems: any[] = [];

    // 1️⃣ Initial Shorts tab (first load)
    const initialItems =
        get<any[]>(
            data,
            [
                "contents",
                "twoColumnBrowseResultsRenderer",
                "tabs",
                tabIndex, // Shorts tab index
                "tabRenderer",
                "content",
                "richGridRenderer",
                "contents",
            ],
            []
        ) ?? [];

    // 2️⃣ Continuation response
    const continuationItems =
        get<any[]>(
            data,
            [
                "onResponseReceivedActions",
                0,
                "appendContinuationItemsAction",
                "continuationItems",
            ],
            []
        ) ?? [];

    // Prefer continuation if present
    rawItems = continuationItems.length
        ? continuationItems
        : initialItems;

    const items: Video[] = [];
    let continuationToken: string | null = null;

    for (const item of rawItems) {
        // 🔁 continuation token
        if (item.continuationItemRenderer) {
            continuationToken = get<string>(
                item,
                [
                    "continuationItemRenderer",
                    "continuationEndpoint",
                    "continuationCommand",
                    "token",
                ]
            );
            continue;
        }

        const rich = item.richItemRenderer;
        if (!rich) continue;

        const lockup =
            rich.content?.shortsLockupViewModel;
        if (!lockup) continue;

        const videoId = get<string>(
            lockup,
            ["onTap", "innertubeCommand", "reelWatchEndpoint", "videoId"]
        );
        if (!videoId) continue;

        const title = get<string>(
            lockup,
            ["overlayMetadata", "primaryText", "content"]
        );

        const views = get<string>(
            lockup,
            ["overlayMetadata", "secondaryText", "content"]
        );

        items.push({
            type: "video",
            videoId,
            title: title ?? "",
            views: views ?? "",
        });
    }

    return { items, continuationToken };
}
