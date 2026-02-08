export const metaPornVideoSchema = {
    container: "div.card.group.relative.block.space-y-1",

    title: {
        tag: "a",
        selector: ".collection-title",
        attr: "text",
    },

    href: {
        tag: "a",
        selector: ".collection-title",
        attr: "href",
    },

    thumbnail: {
        tag: "img",
        selector: ".item-image",
        attr: "src",
    },
};

export const uncutmazaVideoSchema = {
    container: ".videos a.video",

    title: {
        selector: "h2.vtitle",
        attr: "text",
    },

    url: {
        selector: "",
        attr: "href",
    },

    thumbnail: {
        selector: "",
        attr: "data-bg",
    },

    duration: {
        selector: "span.time",
        attr: "text",
    },

    uploaded: {
        selector: "span.ago",
        attr: "text",
    },
};

export const xmazaSchema = {
    container: "article.loop-video",

    title: {
        selector: "header.entry-header span",
        attr: "text",
    },

    url: {
        selector: "a",
        attr: "href",
    },

    thumbnail: {
        selector: "img",
        attr: ["data-src", "src"],
    },

    duration: {
        selector: ".duration",
        attr: "text",
    },

    quality: {
        selector: ".hd-video",
        attr: "text",
    },

    postId: {
        selector: "article",
        attr: "data-post-id",
    },

    videoUid: {
        selector: "article",
        attr: "data-video-uid",
    },
}

export const schemaSarkariResultFeeds = {
    "$containers": {
        "hotjobs": {
            "selector": "p.gb-headline a:matchesOwn(.+)",
            "schema": {
                "title": { "attr": "text" },
                "url": { "attr": "href" }
            }
        },
        "cards": {
            "selector": "div.gb-container",
            "schema": {
                "title": { "selector": "p.gb-headline", "attr": "text" },
                "items": {
                    "container": "ul.wp-block-latest-posts__list li",
                    "schema": {
                        "title": { "selector": "a.wp-block-latest-posts__post-title", "attr": "text" },
                        "url": { "selector": "a.wp-block-latest-posts__post-title", "attr": "href" }
                    }
                },
                "viewMore": { "selector": "a.wp-block-button__link", "attr": "href" }
            }
        }
    }
}

// ================= COMMON SCHEMAS =================

const KV_LIST_SCHEMA = {
    schema: {
        label: {
            selector: "",
            attr: "text",
        },
        value: {
            selector: "strong, b",
            attr: "text",
        },
    },
} as const;

const CELL_SCHEMA = {
    text: {
        selector: "",
        attr: "text",
    },
    url: {
        selector: "a",
        attr: "href",
    },
    list: {
        container: "li",
        schema: {
            text: {
                selector: "",
                attr: "text",
            },
        },
    },
} as const;

// ================= PAGE SCHEMA =================

export const sarkariresultDetailsPageSchema = {
    $containers: {

        // -------- KEY–VALUE LIST SECTIONS --------

        important_dates: {
            ...KV_LIST_SCHEMA,
            selector: "div.gb-container-16a90584 ul li",
        },

        application_fees: {
            ...KV_LIST_SCHEMA,
            selector: "div.gb-container-fcbb81ff ul li",
        },

        applicable_ages: {
            ...KV_LIST_SCHEMA,
            selector: "div.gb-container-0f18d865 ul li",
        },

        // -------- TOTAL POST --------

        total_post: {
            selector: "div.gb-container-860b2712",
            schema: {
                label: {
                    selector: "h5",
                    attr: "text",
                },
                value: {
                    selector: "div.gb-headline",
                    attr: "text",
                },
            },
        },

        // -------- TABLES --------

        tables: {
            selector: "table",
            schema: {
                headers: {
                    container: "tr:first-child th, tr:first-child td",
                    schema: CELL_SCHEMA,
                },
                rows: {
                    container: "tr:not(:first-child)",
                    schema: {
                        cells: {
                            container: "th, td",
                            schema: CELL_SCHEMA,
                        },
                    },
                },
            },
        },

    },
} as const;




