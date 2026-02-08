// playlistExtractor.ts

import { Video } from "./types";

type AnyObj = Record<string, any>;



export type ExtractResult = {
    playlists: Video[];
    continuationToken?: string;
};

/**
 * Safe deep getter (Python get() equivalent)
 */
export function get(
    obj: any,
    path: (string | number)[],
    defaultVal: any = undefined
) {
    try {
        for (const p of path) {
            obj = obj[p];
        }
        return obj ?? defaultVal;
    } catch {
        return defaultVal;
    }
}

/**
 * Extract a playlist from lockupViewModel
 */
export function extractPlaylist(lockup: AnyObj): Video | null {
    const playlistId =
        get(lockup, ["contentId"]) ||
        get(lockup, [
            "metadata",
            "lockupMetadataViewModel",
            "metadata",
            "contentMetadataViewModel",
            "metadataRows",
            0,
            "metadataParts",
            0,
            "text",
            "commandRuns",
            0,
            "onTap",
            "innertubeCommand",
            "browseEndpoint",
            "browseId",
        ]);

    if (!playlistId) return null;

    return {
        type: "video",
        title: get(lockup, [
            "metadata",
            "lockupMetadataViewModel",
            "title",
            "content",
        ]),
        videoId: get(lockup, [
            "itemPlayback",
            "inlinePlayerData",
            "onSelect",
            "innertubeCommand",
            "watchEndpoint",
            "videoId",
        ]),
        views: get(lockup, [
            "contentImage",
            "collectionThumbnailViewModel",
            "primaryThumbnail",
            "thumbnailViewModel",
            "overlays",
            0,
            "thumbnailOverlayBadgeViewModel",
            "thumbnailBadges",
            0,
            "thumbnailBadgeViewModel",
            "text",
        ]),
        channel: playlistId
    };
}

/**
 * Main extractor
 * Works for BOTH initial browse + continuation responses
 */
export function extractPlaylistsFromBrowse(
    json: AnyObj,
    tabIndex: number
): ExtractResult {
    const playlists: Video[] = [];
    let continuationToken: string | undefined;

    // 1️⃣ Initial grid items
    const gridItems =
        get(json, [
            "contents",
            "twoColumnBrowseResultsRenderer",
            "tabs",
            tabIndex,
            "tabRenderer",
            "content",
            "sectionListRenderer",
            "contents",
            0,
            "itemSectionRenderer",
            "contents",
            0,
            "gridRenderer",
            "items",
        ]) ?? [];

    // 2️⃣ Continuation items (if this is a continuation response)
    const continuationItems =
        get(json, [
            "onResponseReceivedActions",
            0,
            "appendContinuationItemsAction",
            "continuationItems",
        ]) ?? [];

    const allItems = [...gridItems, ...continuationItems];

    for (const item of allItems) {
        // Continuation token
        if (item.continuationItemRenderer) {
            continuationToken = get(item, [
                "continuationItemRenderer",
                "continuationEndpoint",
                "continuationCommand",
                "token",
            ]);
            continue;
        }

        // Playlist
        const lockup = item.lockupViewModel;
        if (!lockup) continue;

        const pl = extractPlaylist(lockup);
        if (pl) playlists.push(pl);
    }

    return { playlists, continuationToken };
}
