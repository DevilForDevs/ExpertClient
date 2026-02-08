
import { ShortVideo, Video } from "./types";

export const get = <T = any>(
    obj: any,
    path: (string | number)[]
): T | undefined =>
    path.reduce((acc: any, key) => {
        if (acc == null) return undefined;

        // 🔹 Support -1 for last array item
        if (key === -1 && Array.isArray(acc)) {
            return acc.length > 0 ? acc[acc.length - 1] : undefined;
        }

        return acc[key] !== undefined ? acc[key] : undefined;
    }, obj);


export type WatchItem = Video | ShortVideo;

export interface ParseResult {
    items: (Video | ShortVideo)[];
    continuation: string | null;
    visitorData: string;
    channelinfo: VideoDetails
}

export interface VideoDetails {
    subscriberCount: string;
    channelName: string;
    channelUrl: string;
    likes: string;
    dislikes: string;
    commentsCount: string;
    channelPhoto: string
}

function extractVideoDetails(root: any): VideoDetails {
    const contents = get<any[]>(root, [
        "contents",
        "twoColumnWatchNextResults",
        "results",
        "results",
        "contents",
    ]) ?? [];

    const videoPrimaryInfo = get<any>(contents, [
        0,
        "videoPrimaryInfoRenderer",
    ]);



    const videoSecondaryInfo = get<any>(contents, [
        1,
        "videoSecondaryInfoRenderer",
    ]);



    const owner = get<any>(videoSecondaryInfo, [
        "owner",
        "videoOwnerRenderer",
    ]);

    const channelphoto = get<any>(videoSecondaryInfo, [
        "owner",
        "videoOwnerRenderer",
        "thumbnail",
        "thumbnails", -1, "url"
    ]);


    const subscriberCount =
        get<string>(owner, [
            "subscriberCountText",
            "simpleText"
        ]) ?? "";

    const titleRun = get<any>(owner, [
        "title",
        "runs",
        0,
    ]);

    const channelName =
        get<string>(titleRun, ["text"]) ?? "";

    const channelUrl =
        get<string>(titleRun, [
            "navigationEndpoint",
            "browseEndpoint",
            "canonicalBaseUrl",
        ]) ?? "";

    const topButtons = get<any[]>(videoPrimaryInfo, [
        "videoActions",
        "menuRenderer",
        "topLevelButtons",
    ]) ?? [];

    const likes =
        get<string>(topButtons, [
            0,
            "segmentedLikeDislikeButtonViewModel",
            "likeButtonViewModel",
            "likeButtonViewModel",
            "toggleButtonViewModel",
            "toggleButtonViewModel",
            "defaultButtonViewModel",
            "buttonViewModel",
            "title",
        ]) ?? "";

    const dislikes =
        get<string>(topButtons, [
            0,
            "segmentedLikeDislikeButtonViewModel",
            "dislikeButtonViewModel",
            "dislikeButtonViewModel",
            "toggleButtonViewModel",
            "toggleButtonViewModel",
            "defaultButtonViewModel",
            "buttonViewModel",
            "title",
        ]) ?? "";

    const commentsCount = extractCommentsCount(root);

    return {
        subscriberCount,
        channelName,
        channelUrl,
        likes,
        dislikes,
        commentsCount,
        channelPhoto: channelphoto
    };
}

function extractCommentsCount(root: any): string {
    const panels = get<any[]>(root, ["engagementPanels"]);
    if (!panels) return "";

    for (let i = 0; i < panels.length; i++) {
        const contextualInfo =
            get<any>(panels[i], [
                "engagementPanelSectionListRenderer",
                "header",
                "engagementPanelTitleHeaderRenderer",
                "contextualInfo",
            ]);

        // 🔹 Normalize to runs array
        const runs: any[] | undefined = Array.isArray(contextualInfo)
            ? contextualInfo
            : contextualInfo?.runs;

        if (runs && runs.length > 0) {
            return runs[0]?.text ?? "";
        }
    }

    return "";
}


function processWatchItems(
    items: any[],
    videos: (Video | ShortVideo)[],
    setContinuation: (t: string) => void
) {
    for (const r of items) {
        /* ================= VIDEO ================= */
        if (r.lockupViewModel) {
            const title = get<string>(r, [
                "lockupViewModel",
                "metadata",
                "lockupMetadataViewModel",
                "title",
                "content",
            ]);

            const views = get<string>(r, [
                "lockupViewModel",
                "metadata",
                "lockupMetadataViewModel",
                "metadata",
                "contentMetadataViewModel",
                "metadataRows",
                1,
                "metadataParts",
                0,
                "text",
                "content",
            ]);

            const uploadedAgo = get<string>(r, [
                "lockupViewModel",
                "metadata",
                "lockupMetadataViewModel",
                "metadata",
                "contentMetadataViewModel",
                "metadataRows",
                1,
                "metadataParts",
                1,
                "text",
                "content",
            ]);

            const channelPhoto = get<string>(r, [
                "lockupViewModel",
                "metadata",
                "lockupMetadataViewModel",
                "image",
                "decoratedAvatarViewModel",
                "avatar",
                "avatarViewModel",
                "image",
                "sources",
                0,
                "url",
            ]);

            const duration = get<string>(r, [
                "lockupViewModel",
                "contentImage",
                "thumbnailViewModel",
                "overlays", 0,
                "thumbnailOverlayBadgeViewModel",
                "thumbnailBadges", 0,
                "thumbnailBadgeViewModel",
                "text"

            ]);
            const channelName = get<string>(r, [
                "lockupViewModel",
                "metadata",
                "lockupMetadataViewModel",
                "metadata",
                "contentMetadataViewModel",
                "metadataRows",
                0,
                "metadataParts",
                0,
                "text",
                "content",
            ]);

            const channelUrl = get<string>(r, [
                "lockupViewModel",
                "metadata",
                "lockupMetadataViewModel",
                "image",
                "decoratedAvatarViewModel",
                "rendererContext",
                "commandContext",
                "onTap",
                "innertubeCommand",
                "browseEndpoint",
                "browseId",
            ]);

            videos.push({
                type: "video",
                videoId: r.lockupViewModel.contentId,
                title: title ?? "",
                views: views ?? "",
                publishedOn: uploadedAgo,
                channel: channelPhoto,
                channelName,
                channelUrl,
                duration
            });
        }

        /* ================= SHORTS ================= */
        if (r.reelShelfRenderer) {
            const shortsItems = r.reelShelfRenderer.items ?? [];
            const shorts: Video[] = [];

            for (const s of shortsItems) {
                const videoId = get<string>(s, [
                    "shortsLockupViewModel",
                    "entityId",
                ])?.replace("shorts-shelf-item-", "");

                const title = get<string>(s, [
                    "shortsLockupViewModel",
                    "overlayMetadata",
                    "primaryText",
                    "content",
                ]);

                const views = get<string>(s, [
                    "shortsLockupViewModel",
                    "overlayMetadata",
                    "secondaryText",
                    "content",
                ]);

                if (!videoId || !title || !views) continue;

                shorts.push({ type: "video", videoId, title, views });
            }

            if (shorts.length) {
                videos.push({
                    type: "shorts",
                    videos: shorts,
                    videoId: shorts[0].videoId,
                });
            }
        }

        /* ================= CONTINUATION ================= */
        if (r.continuationItemRenderer) {
            const token = get<string>(r, [
                "continuationItemRenderer",
                "continuationEndpoint",
                "continuationCommand",
                "token",
            ]);
            if (token) setContinuation(token);
        }
    }
}

export function parseWatchHtml(data: any): ParseResult {
    let continuation: string | null = null;
    let visitorData = "";
    const videos: (Video | ShortVideo)[] = [];

    /* ================= VISITOR DATA ================= */
    visitorData =
        get<string>(data, [
            "responseContext",
            "webResponseContextExtensionData",
            "ytConfigData",
            "visitorData",
        ]) ?? "";

    /* ================= INITIAL WATCH RESULTS ================= */
    const results =
        get<any[]>(data, [
            "contents",
            "twoColumnWatchNextResults",
            "secondaryResults",
            "secondaryResults",
            "results",
        ]) ?? [];

    processWatchItems(results, videos, t => (continuation = t));

    /* ================= CONTINUATION APPEND ================= */
    const continuationItems =
        get<any[]>(data, [
            "onResponseReceivedEndpoints",
            0,
            "appendContinuationItemsAction",
            "continuationItems",
        ]) ?? [];

    processWatchItems(continuationItems, videos, t => (continuation = t));

    /* ================= CHANNEL DETAILS ================= */
    const channelDetails = extractVideoDetails(data);

    return {
        continuation,
        visitorData,
        items: videos,
        channelinfo: channelDetails,
    };
}

