import { Video } from "../../utils/types";
import {
    NativeModules
} from 'react-native'
import { get } from "../../utils/watchHtmlParser";



export async function findCategories(
    video: Video
): Promise<CategoryGroup[]> {

    const { MyNativeModule } = NativeModules;
    const categories: CategoryGroup[] = [];

    const jsonString = await MyNativeModule.getXhInitials(
        "https://xhamster1.desi/categories"
    );

    const result = JSON.parse(jsonString);

    const assignables = get<any[]>(result, [
        "pageStore",
        "popular",
        "assignable"
    ]) ?? [];

    const trending = get<any>(result, [
        "pageStore",
        "popular",
        "trending"
    ]);

    // ---------- TRENDING ----------
    if (trending && Array.isArray(trending.items)) {
        const trendingList: CategoryType[] = [];

        trending.items.forEach((item: Record<string, any>) => {
            trendingList.push({
                name: item.name ?? "",
                pageUrl: item.url ?? "",
                thumbnail: item.thumb ?? ""
            });
        });

        categories.push({
            name: trending.geoText ?? "Trending",
            categories: trendingList
        });
    }


    // ---------- ASSIGNABLE CATEGORIES ----------
    assignables.forEach((group: Record<string, any>) => {
        const items = Array.isArray(group.items) ? group.items : [];

        const localItems: CategoryType[] = [];

        items.forEach((item: Record<string, any>) => {
            localItems.push({
                name: item.name ?? "",
                pageUrl: item.url ?? "",
                thumbnail: item.thumb ?? ""
            });
        });

        categories.push({
            name: group.name ?? "",
            categories: localItems
        });
    });



    return categories;
}
