import { NativeModules } from 'react-native'

function extractBracketContent(str: string): string | null {
    // Matches the first [...] including spaces, numbers, letters, symbols
    const match = str.match(/\[([^\[\]]+)]/);
    return match ? match[1].trim() : null;
}

function buildHdMovieUrl(inputUrl: string): string | null {
    try {
        // Extract origin manually
        const originMatch = inputUrl.match(/^https?:\/\/[^/]+/);
        if (!originMatch) return null;

        const origin = originMatch[0];
        const path = inputUrl.replace(origin, "");

        // match /c3160/
        const match = path.match(/\/c(\d+)\//);
        if (!match) return null;

        const id = match[1];

        // remove /c3160/
        let newPath = path.replace(/\/c\d+\//, "/");

        // insert -hd-id before .html
        newPath = newPath.replace(/\.html$/, `-hd-${id}.html`);

        // encode safely
        const safePath = encodeURI(newPath);

        return origin + safePath;
    } catch {
        return null;
    }
}

const mp4moviesDetailschema = {
    sections: [
        {
            key: "download_links",
            selector: "body",

            items: {
                // 🔥 Only mast divs containing nofollow link
                selector: "div.mast:has(a[rel='nofollow'])",

                fields: {
                    title: {
                        selector: "a[rel='nofollow']",
                        attr: "text"
                    },

                    url: {
                        selector: "a[rel='nofollow']",
                        attr: "href"
                    },

                    size: {
                        selector: "",
                        attr: "text",
                    }
                }
            }
        }
    ]
};



export async function getVideoUrls(url: string): Promise<StreamVariant[]> {
    const durl = buildHdMovieUrl(url);
    const { MyNativeModule } = NativeModules;
    console.log(durl);
    console.log("extracting");

    const jsonString = await MyNativeModule.htmlExtractor(
        JSON.stringify({
            url: durl,
            schema: mp4moviesDetailschema
        })
    );
    const variants: StreamVariant[] = []
    const requiredJson = JSON.parse(jsonString);
    if (requiredJson.sections?.download_links?.items) {
        for (const item of requiredJson.sections.download_links.items) {
            variants.push({
                type: "mp4",
                ref: item.url,
                resolution: item.title,
            })
        }
    }
    return variants;
}

export function getTitleFromUrl(url: string): string {
    try {
        // Extract the last segment after the last slash
        const lastSegment = url.split("/").pop() || "";

        // Remove file extension if present
        const withoutExtension = lastSegment.replace(/\.[^/.]+$/, "");

        // Replace hyphens or underscores with spaces
        const formattedTitle = withoutExtension.replace(/[-_]+/g, " ");

        // Optional: Capitalize first letter of each word
        const title = formattedTitle.replace(/\b\w/g, (char) => char.toUpperCase());

        return title;
    } catch (error) {
        console.error("Error extracting title from URL:", error);
        return "";
    }
}