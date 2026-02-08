import {
    NativeModules
} from 'react-native'

async function handleUncutMaza(site: string): Promise<CategoryType[]> {
    const { MyNativeModule } = NativeModules;
    const categoryItems: CategoryType[] = [];
    const taxonomySchema = {
        container: "article.taxonomy-card",

        title: {
            selector: "h2",
            attr: "text"
        },

        url: {
            selector: "a.taxonomy-link",
            attr: "href"
        },

        count: {
            selector: ".taxonomy-count",
            attr: "text"
        },

        dataName: {
            selector: "",
            attr: "data-name"
        },

        dataLetter: {
            selector: "",
            attr: "data-letter"
        }
    };


    const jsonString = await MyNativeModule.htmlJsonBridge(
        site,
        JSON.stringify(taxonomySchema)
    );
    let data: any;

    // 2️⃣ Safe JSON parse
    try {
        data = JSON.parse(jsonString);
        for (const item of data.items) {
            categoryItems.push({
                name: item.title,
                pageUrl: item.url,
                videoCount: item.count,
                thumbnail: undefined
            });
        }
        return categoryItems;

    } catch (e) {
        console.error("JSON parse failed", jsonString);
        return [];
    }

    return []

}

async function getCategoryListOfXmaaz(site: string): Promise<CategoryType[]> {
    const { MyNativeModule } = NativeModules;
    const categoryItems: CategoryType[] = [];

    const tagSchema = {
        $containers: {
            tags: {
                selector: "#primary a.tag-cloud-link",
                schema: {
                    title: {
                        selector: "",
                        attr: "text"
                    },
                    url: {
                        selector: "",
                        attr: "href"
                    }
                }
            },

            categories: {
                selector: "article.thumb-block",
                schema: {
                    url: {
                        selector: "a",
                        attr: "href"
                    },
                    title: {
                        selector: "img",
                        attr: "alt"
                    },
                    thumbnail: {
                        selector: "img",
                        attr: "src"
                    },
                    category: {
                        selector: ".cat-title",
                        attr: "text"
                    }
                }
            }
        }
    };

    const jsonString = await MyNativeModule.htmlJsonBridge(
        site,
        JSON.stringify(tagSchema)
    );
    let data: any;
    try {
        data = JSON.parse(jsonString);
        for (const item of data.globals.categories) {
            if (item.thumbnail && item.thumbnail.toLowerCase().endsWith(".gif")) {
                categoryItems.push({
                    name: item.title,
                    pageUrl: item.url,
                    videoCount: "",
                    thumbnail: undefined
                });
            } else {
                categoryItems.push({
                    name: item.title,
                    pageUrl: item.url,
                    videoCount: "",
                    thumbnail: item.thumbnail
                });
            }

        }

        for (const item of data.globals.tags) {
            categoryItems.push({
                name: item.title,
                pageUrl: item.url,
                videoCount: "",
                thumbnail: undefined
            });
        }

        return categoryItems;

    } catch (e) {
        console.error("JSON parse failed", jsonString);
        return [];
    }
}

export async function getCategorylist(site: string): Promise<CategoryType[]> {
    console.log(site);
    if (site.includes("uncutmaza")) {
        return await handleUncutMaza(site)
    }
    if (site.includes("xmaza")) {
        return await getCategoryListOfXmaaz(site)
    }
    return []
}

async function categoryPages(site: Site): Promise<pageItem[]> {
    const { MyNativeModule } = NativeModules;
    const categoriesList: pageItem[] = []
    const menuSchema = {
        container: ".menu a",

        title: {
            selector: "",
            attr: "text"
        },

        url: {
            selector: "",
            attr: "href"
        }
    };

    const jsonString = await MyNativeModule.htmlJsonBridge(
        site.url,
        JSON.stringify(menuSchema)
    );
    let data: any;

    // 2️⃣ Safe JSON parse
    try {
        data = JSON.parse(jsonString);
        for (const item of data.items) {

            const title = String(item.title).trim();

            if (title.toLowerCase() === "home") continue;

            categoriesList.push({
                title: String(item.title),
                link: item.url
            });
        }
        return categoriesList
    } catch (e) {
        console.error("JSON parse failed", jsonString);
        return [];
    }
    return [];
}

async function handleXmaaz(site: Site): Promise<pageItem[]> {
    const { MyNativeModule } = NativeModules;
    const categoriesList: pageItem[] = []
    const menuSchema = {
        container: "#menu-main-menu li a", // selects all <a> tags inside the menu

        title: {
            selector: "",   // empty means use the container itself
            attr: "text"    // get the visible text of the link
        },

        url: {
            selector: "",   // empty means use the container itself
            attr: "href"    // get the href attribute
        }
    };

    const jsonString = await MyNativeModule.htmlJsonBridge(
        site.url,
        JSON.stringify(menuSchema)
    );
    let data: any;

    // 2️⃣ Safe JSON parse
    try {
        data = JSON.parse(jsonString);
        for (const item of data.items) {

            const title = String(item.title).trim();

            if (title.toLowerCase() === "home") continue;

            categoriesList.push({
                title: String(item.title),
                link: item.url
            });
        }
        return categoriesList
    } catch (e) {
        console.error("JSON parse failed", jsonString);
        return [];
    }
    return []
}

export async function getpages(site: Site): Promise<pageItem[]> {
    if (site.url.includes("uncutmaza")) {
        return await categoryPages(site);
    }
    if (site.url.includes("xmaza")) {
        return await handleXmaaz(site);
    }
    return []
}