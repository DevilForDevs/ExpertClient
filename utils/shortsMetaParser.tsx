

export type AnyJson = Record<string, any>

export const deepGet = <T = any>(
    obj: AnyJson | null | undefined,
    path: Array<string | number>,
    def?: T
): T | undefined => {
    let current: any = obj

    for (const key of path) {
        if (
            current === null ||
            current === undefined ||
            typeof current !== "object"
        ) {
            return def
        }
        current = current[key]
    }

    return (current ?? def) as T | undefined
}


export interface ShortMeta {
    title: string
    likes: string
    comments: string
    channelName: string
    channelThumbnail: string
    canonicalUrl: string
}


export const parseShortMeta = (
    json: any
): ShortMeta => {
    const comments = deepGet<string>(
        json,
        [
            "engagementPanels",
            0,
            "engagementPanelSectionListRenderer",
            "header",
            "engagementPanelTitleHeaderRenderer",
            "contextualInfo",
            "runs",
            0,
            "text",
        ],
        ""
    )

    const header = deepGet<AnyJson>(
        json,
        [
            "engagementPanels",
            1,
            "engagementPanelSectionListRenderer",
            "content",
            "structuredDescriptionContentRenderer",
            "items",
            0,
            "videoDescriptionHeaderRenderer",
        ],
        {}
    )

    const title = deepGet<string>(
        header,
        ["title", "runs", 0, "text"],
        ""
    )

    const likes = deepGet<string>(
        header,
        ["factoid", 0, "factoidRenderer", "value", "simpleText"],
        ""
    )

    const channelName = deepGet<string>(
        header,
        ["channel", "simpleText"],
        ""
    )

    const channelThumbnail = deepGet<string>(
        header,
        ["channelThumbnail", "thumbnails", 0, "url"],
        ""
    )

    const canonicalUrl = deepGet<string>(
        header,
        [
            "channelNavigationEndpoint",
            "browseEndpoint",
            "browseId",
        ],
        ""
    )


    return {
        title: title ?? "Broken Response",
        likes: likes ?? "",
        comments: comments ?? "",
        channelName: channelName ?? "",
        channelThumbnail: channelThumbnail ?? "",
        canonicalUrl: canonicalUrl ?? "",
    }
}

