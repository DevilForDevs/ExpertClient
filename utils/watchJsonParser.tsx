import { Video } from "./types";
const deepGet = (obj: any, path: (string | number)[], defaultValue: any = null): any => {
    try {
        return path.reduce((acc, key) => (acc != null ? acc[key] : undefined), obj) ?? defaultValue;
    } catch {
        return defaultValue;
    }
};



export interface VideoDetails {
    videoId?: string;
    title?: string;
    views?: string;
    likes?: string;
    dislikesLabel?: string;
    uploadedAgo?: string;
    channel?: Channel;
}

const extractVideoMetadata = (data: any): VideoDetails => {
    const contents = data?.contents ?? [];

    // TITLE
    const title = deepGet(
        contents,
        [0, "slimVideoInformationRenderer", "title", "runs", 0, "text"]
    );

    // VIDEO ID
    const videoId = contents?.[contents.length - 1]?.videoId;

    // OWNER / CHANNEL
    const owner =
        contents.find((c: any) => c.slimOwnerRenderer)?.slimOwnerRenderer ?? {};

    const channel: Channel = {
        name: deepGet(owner, ["title", "runs", 0, "text"]),
        subscribers: deepGet(owner, ["expandedSubtitle", "runs", 0, "text"]),
        canonicalUrl: deepGet(owner, [
            "navigationEndpoint",
            "browseEndpoint",
            "canonicalBaseUrl",
        ]),
        photo: deepGet(owner, ["thumbnail", "thumbnails"], [])?.slice(-1)?.[0]
            ?.url,
    };

    // ACTION BAR (LIKES)
    const actionBar =
        contents.find((c: any) => c.slimVideoActionBarRenderer)
            ?.slimVideoActionBarRenderer ?? {};

    const buttons = actionBar.buttons ?? [];

    const likeButton = buttons.find(
        (b: any) =>
            b?.slimMetadataButtonRenderer?.button
                ?.segmentedLikeDislikeButtonViewModel
    );

    const likes = deepGet(likeButton, [
        "slimMetadataButtonRenderer",
        "button",
        "segmentedLikeDislikeButtonViewModel",
        "likeButtonViewModel",
        "likeButtonViewModel",
        "toggleButtonViewModel",
        "toggleButtonViewModel",
        "defaultButtonViewModel",
        "buttonViewModel",
        "title",
    ]);

    return {
        videoId,
        title,
        likes,
        dislikesLabel: "Dislike", // YT no longer exposes numbers
        channel,
    };
};


// Extract comment count from carousel
const extractCommentCountFromCarousel = (vmc: any): string | null => {
    const titles = vmc.carouselTitles ?? [];
    if (!titles.length) return null;
    return titles[0]?.carouselTitleViewModel?.subtitle ?? null;
};

const extractVideoWithContext = (v: any): Video => {
    const vw = v.videoWithContextRenderer;
    if (!vw) throw new Error("Invalid videoWithContextRenderer");

    const channelRun = vw.shortBylineText?.runs?.[0];

    const channelName = channelRun?.text ?? "";

    const channelUrl =
        channelRun?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl ??
        vw.channelThumbnail?.channelThumbnailWithLinkRenderer
            ?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl ??
        "";

    const channelPhoto =
        vw.channelThumbnail?.channelThumbnailWithLinkRenderer
            ?.thumbnail?.thumbnails?.slice(-1)?.[0]?.url ??
        "";

    return {
        type: "video",
        videoId:
            vw.videoId ??
            vw.navigationEndpoint?.watchEndpoint?.videoId ??
            "",
        title: vw.headline?.runs?.[0]?.text ?? "",
        duration: vw.lengthText?.runs?.[0]?.text,
        views: vw.shortViewCountText?.runs?.[0]?.text ?? "0 views",

        channel: channelPhoto,      // ✅ name

        publishedOn: channelName     // ❌ not available here
    };
};



// Extract Shorts data
const extractShortsData = (item: any): Video => {
    const shorts = item.shortsLockupViewModel;
    if (!shorts) throw new Error("Invalid shortsLockupViewModel");

    const title = shorts.overlayMetadata?.primaryText?.content ?? shorts.accessibilityText;
    const videoId = shorts.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId
        ?? shorts.inlinePlayerData?.onVisible?.innertubeCommand?.watchEndpoint?.videoId;

    // parse views from accessibility
    let views = "0 views";
    const accText = shorts.accessibilityText;
    if (accText) {
        const match = accText.match(/(\d+(?:\.\d+)?)\s*(million|billion|thousand)?\s+views/i);
        if (match) views = match[0];
    }

    return {
        type: "video",
        videoId: videoId ?? "",
        title: title ?? "",
        views,
    };
};

// Extract continuation token
const extractContinuationFromSection = (sec: any): string | null => {
    return sec.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token ?? null;
};

export interface WatchNextBundle {
    videoDetails?: VideoDetails;
    commentCount?: string | null;
    relatedVideos: Video[];
    shorts: Video[];
    nextToken?: string | null;
}

// Handle continuation items (watch-next pagination)
const extractFromContinuationItems = (
    items: any[] = [],
    bundle: WatchNextBundle
) => {
    for (const sec of items) {
        if (sec.videoWithContextRenderer) {
            const v = extractVideoWithContext(sec);
            if (v) bundle.relatedVideos.push(v);
        }
        else if (sec.continuationItemRenderer) {
            bundle.nextToken = extractContinuationFromSection(sec);
        }
    }
};

// Main bundle extractor
export const extractWatchNextBundle = (data: any): WatchNextBundle => {
    const bundle: WatchNextBundle = {
        videoDetails: undefined,
        relatedVideos: [],
        shorts: [],
        commentCount: null,
        nextToken: null,
    };

    /* ───────────── INITIAL WATCH PAGE ───────────── */

    const contents =
        data?.contents?.singleColumnWatchNextResults?.results?.results
            ?.contents ?? [];

    for (const block of contents) {
        // main video metadata
        if (block.slimVideoMetadataSectionRenderer) {
            bundle.videoDetails = extractVideoMetadata(
                block.slimVideoMetadataSectionRenderer
            );
        }

        const sections = block.itemSectionRenderer?.contents ?? [];
        for (const sec of sections) {
            if (sec.videoMetadataCarouselViewModel) {
                bundle.commentCount =
                    extractCommentCountFromCarousel(
                        sec.videoMetadataCarouselViewModel
                    );
            }
            else if (sec.videoWithContextRenderer) {

                const v = extractVideoWithContext(sec);

                if (v) bundle.relatedVideos.push(v);
            }
            else if (sec.continuationItemRenderer) {
                bundle.nextToken =
                    extractContinuationFromSection(sec);
            }
        }
    }

    /* ───────────── CONTINUATIONS (SCROLL) ───────────── */

    for (const ep of data?.onResponseReceivedEndpoints ?? []) {
        const items =
            ep?.appendContinuationItemsAction?.continuationItems ?? [];

        extractFromContinuationItems(items, bundle);
    }

    /* ───────────── SHORTS ───────────── */

    for (const panel of data?.engagementPanels ?? []) {
        const items =
            panel?.engagementPanelSectionListRenderer?.content
                ?.structuredDescriptionContentRenderer?.items ?? [];

        for (const item of items) {
            if (!item.reelShelfRenderer) continue;

            for (const s of item.reelShelfRenderer.items ?? []) {
                const short = extractShortsData(s);
                if (short) bundle.shorts.push(short);
            }
        }
    }

    return bundle;
};


