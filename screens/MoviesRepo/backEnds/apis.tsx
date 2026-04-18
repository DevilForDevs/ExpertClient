import { Video } from "../../../utils/types";

import {
    NativeModules
} from 'react-native'
export type Result = {
    items: Video[],
    categories: Video[],
    nextPageUrl?: string
}




async function getMP4MoviesFeeds(url: string): Promise<Result> {
    let jsonString: string;
    const { MyNativeModule } = NativeModules;
    const schema = {
        sections: [
            {
                key: "movie_list",
                selector: "body",
                items: {
                    selector: "div.fl",
                    fields: {
                        title: {
                            selector: "span.moviename",
                            attr: "text",
                        },
                        category: {
                            selector: "span.duration",
                            attr: "text",
                        },
                        format: {
                            selector: "span.description",
                            attr: "text",
                        },
                        detail_url: {
                            selector: "a",
                            attr: "href",
                            resolve_url: true,
                        },
                        poster: {
                            selector: "img",
                            attr: "src",

                        },
                    },
                },
            },
            {
                key: "movie_categories",
                selector: "body",
                items: {
                    selector: "div.movies, div.movie",
                    fields: {
                        name: {
                            selector: "a",
                            attr: "text",
                        },
                        url: {
                            selector: "a",
                            attr: "href",
                            resolve_url: true,
                        },
                        icon: {
                            selector: "img",
                            attr: "src",
                            resolve_url: true,
                        },
                        icon_alt: {
                            selector: "img",
                            attr: "alt",
                        },
                    },
                },
            },
            {
                key: "pagination",
                selector: "div.down",
                items: {
                    selector: "a",
                    fields: {
                        page_number: {
                            selector: "a",
                            attr: "text",
                        },
                        page_url: {
                            selector: "a",
                            attr: "href",
                            resolve_url: true,
                        },
                        type: {
                            selector: "a",
                            attr: "class",
                        },
                    },
                },
            }
        ],
    };

    try {
        jsonString = await MyNativeModule.htmlExtractor(
            JSON.stringify({
                url: url,
                schema: schema
            })
        );

    } catch (e) {
        console.log("Native call failed", e);
        return {
            items: [],
            categories: []
        }
    }

    const data = JSON.parse(jsonString);

    const videos: Video[] = [];
    const categories: Video[] = [];
    let nextPageUrl: string | undefined;

    const sections = data.sections ?? {};

    // 🔹 Movie List
    if (sections.movie_list?.items) {
        for (const item of sections.movie_list.items) {
            videos.push({
                type: "video",
                videoId: item.detail_url,
                views: item.format,
                title: item.title,
                pageUrl: item.detail_url,
                thumbnail: item.poster,
                publishedOn: item.category
            });
        }
    }

    // 🔹 Movie Categories
    if (sections.movie_categories?.items) {
        for (const item of sections.movie_categories.items) {
            categories.push({
                type: "video",
                videoId: item.url,
                views: "",
                title: item.name,
                pageUrl: item.url
            });
        }
    }

    // 🔹 Pagination
    if (sections.pagination?.items) {
        for (const item of sections.pagination.items) {
            if (item.page_number?.toLowerCase().includes("next")) {
                nextPageUrl = item.page_url;
                break;
            }
        }
    }
    console.log(categories);

    return {
        items: videos,
        categories: categories,
        nextPageUrl
    };
}

export async function getFeeds(url: string): Promise<Result> {

    if (url.includes("mp4moviez")) {
        return await getMP4MoviesFeeds(url);
    }

    return {
        items: [],
        categories: []
    };

}