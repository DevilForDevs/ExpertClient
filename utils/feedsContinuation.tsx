export async function fetchBrowse(token: string, visitorId: string) {
    const payload = {
        context: {
            client: {
                hl: "en-GB",
                gl: "NL",
                clientName: "MWEB",
                clientVersion: "2.20251222.01.00",
                platform: "MOBILE",
                osName: "Android",
                osVersion: "15",
                browserName: "Chrome Mobile",
                browserVersion: "143.0.0.0",
                deviceMake: "OPPO",
                deviceModel: "CPH2665",
                visitorData: visitorId,
                userAgent:
                    "Mozilla/5.0 (Linux; Android 15; Mobile) AppleWebKit/537.36 Chrome/143.0.0.0 Mobile Safari/537.36",
                screenPixelDensity: 2,
                clientFormFactor: "SMALL_FORM_FACTOR",
                windowWidthPoints: 980,
                timeZone: "Asia/Calcutta",
                originalUrl: "https://m.youtube.com/",
            },
        },
        continuation: token,
    };

    try {
        const response = await fetch(
            "https://m.youtube.com/youtubei/v1/browse?prettyPrint=false",
            {
                method: "POST",
                headers: {
                    accept: "*/*",
                    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
                    "accept-encoding": "gzip",
                    "content-type": "application/json",
                    referer: "https://m.youtube.com/",

                    "user-agent":
                        "Mozilla/5.0 (Linux; Android 15; Mobile) AppleWebKit/537.36 Chrome/143.0.0.0 Mobile Safari/537.36",

                    "x-youtube-client-name": "2",
                    "x-youtube-client-version": "2.20251222.01.00",
                    "x-youtube-bootstrap-logged-in": "false",
                    "x-requested-with": "com.myapp",
                },
                body: JSON.stringify(payload),
            }
        );

        if (!response.ok) {
            console.error("HTTP ERROR:", response.status);
            return null;
        }
        console.log(response.text())
    } catch (err) {
        console.error("RN Fetch failed:", err);
        return null;
    }
}
