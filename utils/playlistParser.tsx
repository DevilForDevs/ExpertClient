import { Video } from "./types";

type Path = (string | number)[];

function get<T = any>(
    obj: any,
    path: Path,
    defaultValue?: T
): T | undefined {
    try {
        let cur = obj;
        for (const key of path) {
            cur = cur[key];
        }
        return cur as T;
    } catch {
        return defaultValue;
    }
}

function getAny<T = any>(
    obj: any,
    paths: Path[],
    defaultValue?: T
): T | undefined {
    for (const path of paths) {
        const value = get<T>(obj, path);
        if (
            value !== undefined &&
            !(Array.isArray(value) && value.length === 0)
        ) {
            return value;
        }
    }
    return defaultValue;
}


interface PlaylistMetadata {
    title?: string;
    channelAvatar?: string;
    heroImage?: string;
    info1?: string;
    info2?: string;
    createdBy?: string,
    channelId: string
}

interface PlaylistData {
    videos: Video[];
    continuationToken?: string;
    metadata: PlaylistMetadata;
}

const initialItemsPath: Path = [
    "contents",
    "twoColumnBrowseResultsRenderer",
    "tabs", 0,
    "tabRenderer",
    "content",
    "sectionListRenderer",
    "contents", 0,
    "itemSectionRenderer",
    "contents",
    0,
    "playlistVideoListRenderer",
    "contents"
];

const continuationItemsPath: Path = [
    "onResponseReceivedActions", 0,
    "appendContinuationItemsAction",
    "continuationItems"
];

function extractPlaylistData(items: any): PlaylistData {
    const videos: Video[] = [];
    let continuationToken: string | undefined;

    const playlistItems =
        getAny<any[]>(items, [initialItemsPath, continuationItemsPath], []) ?? [];

    for (const item of playlistItems) {

        // 🎥 Video item
        if (item.playlistVideoRenderer) {
            const v = item.playlistVideoRenderer;

            videos.push({
                type: "video",
                videoId: get(v, ["videoId"]) ?? "",
                title: get(v, ["title", "runs", 0, "text"]) ?? "",
                duration: get(v, ["lengthText", "simpleText"]),
                views: get(v, ["videoInfo", "runs", 0, "text"]) ?? "",
                publishedOn: get(v, ["videoInfo", "runs", 2, "text"]),
                channelName: get(v, ["shortBylineText", "runs", 0, "text"]),
                channelUrl: (() => {
                    const base = get<string>(v, [
                        "shortBylineText",
                        "runs", 0,
                        "navigationEndpoint",
                        "browseEndpoint",
                        "canonicalBaseUrl"
                    ]);
                    return base ? `https://www.youtube.com${base}` : undefined;
                })()
            });
        }

        // 🔁 Continuation token
        else if (item.continuationItemRenderer) {
            continuationToken = getAny<string>(item, [
                [
                    "continuationItemRenderer",
                    "continuationEndpoint",
                    "continuationCommand",
                    "token"
                ],
                [
                    "continuationItemRenderer",
                    "continuationEndpoint",
                    "commandExecutorCommand",
                    "commands", 1,
                    "continuationCommand",
                    "token"
                ]
            ]);
        }
    }

    const heroSources =
        get<any[]>(items, [
            "header", "pageHeaderRenderer",
            "content", "pageHeaderViewModel",
            "heroImage",
            "contentPreviewImageViewModel",
            "image",
            "sources"
        ]) ?? [];

    const channelName: string = get(items, [
        "header",
        "pageHeaderRenderer",
        "content",
        "pageHeaderViewModel",
        "metadata",
        "contentMetadataViewModel",
        "metadataRows",
        0,
        "metadataParts",
        0,
        "avatarStack",
        "avatarStackViewModel",
        "text",
        "content"
    ]) ?? "";

    const channeId = get(items, [
        "header", "pageHeaderRenderer",
        "content", "pageHeaderViewModel",
        "metadata", "contentMetadataViewModel",
        "metadataRows", 0,
        "metadataParts", 0,
        "avatarStack", "avatarStackViewModel", "rendererContext",
        "commandContext", "onTap",
        "innertubeCommand", "browseEndpoint", "browseId"
    ])




    const metadata: PlaylistMetadata = {
        title: get(items, ["header", "pageHeaderRenderer", "pageTitle"]),

        channelAvatar: get(items, [
            "header", "pageHeaderRenderer",
            "content", "pageHeaderViewModel",
            "metadata", "contentMetadataViewModel",
            "metadataRows", 0,
            "metadataParts", 0,
            "avatarStack", "avatarStackViewModel",
            "avatars", 0,
            "avatarViewModel",
            "image",
            "sources", 0,
            "url"
        ]),

        info1: get(items, [
            "header", "pageHeaderRenderer",
            "content", "pageHeaderViewModel",
            "metadata", "contentMetadataViewModel",
            "metadataRows", 1,
            "metadataParts", 1,
            "text", "content"
        ]),

        info2: get(items, [
            "header", "pageHeaderRenderer",
            "content", "pageHeaderViewModel",
            "metadata", "contentMetadataViewModel",
            "metadataRows", 1,
            "metadataParts", 2,
            "text", "content"
        ]),

        heroImage:
            heroSources.length
                ? heroSources[heroSources.length - 1]?.url
                : undefined,
        createdBy: channelName,
        channelId: channeId
    };

    return {
        videos,
        continuationToken,
        metadata
    };
}

export { extractPlaylistData };
export type { PlaylistMetadata, PlaylistData };
