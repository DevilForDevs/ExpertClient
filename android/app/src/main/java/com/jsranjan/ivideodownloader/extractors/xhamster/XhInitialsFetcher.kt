package com.jsranjan.ivideodownloader.extractors.xhamster

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

object XhInitialsFetcher {
    private val client by lazy { OkHttpClient() }

    /**
     * Always returns a String:
     * - JSON string (window.initials + optional hlsUrl + mp4Url)
     * - Error message otherwise
     */
    fun fetch(pageUrl: String): String =
        try {
            val html = fetchHtml(pageUrl)

            val initialsJsonStr =
                extractWindowInitials(html)
                    ?: return "window.initials not found"

            val hlsUrl = extractM3u8Url(html)
            val mp4Url = extractH264Mp4Url(html)

            injectUrlsIntoJson(initialsJsonStr, hlsUrl, mp4Url)
        } catch (e: Exception) {
            "error: ${e.message ?: "unknown error"}"
        }

    // -------------------- network --------------------

    private fun fetchHtml(url: String): String {
        val request =
            Request
                .Builder()
                .url(url)
                .get()
                .header(
                    "User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                ).header("Accept", "text/html")
                .build()

        client.newCall(request).execute().use { response ->
            if (!response.isSuccessful) {
                return "http error: ${response.code}"
            }
            return response.body?.string() ?: "empty response body"
        }
    }

    // -------------------- extraction --------------------

    private fun extractWindowInitials(html: String): String? {
        val marker = "window.initials"
        val start = html.indexOf(marker)
        if (start == -1) return null

        val braceStart = html.indexOf("{", start)
        if (braceStart == -1) return null

        var braceCount = 0
        var endIndex = -1

        for (i in braceStart until html.length) {
            when (html[i]) {
                '{' -> {
                    braceCount++
                }

                '}' -> {
                    braceCount--
                    if (braceCount == 0) {
                        endIndex = i
                        break
                    }
                }
            }
        }

        if (endIndex == -1) return null

        val jsonStr = html.substring(braceStart, endIndex + 1)

        return try {
            JSONObject(jsonStr)
            jsonStr
        } catch (_: Exception) {
            null
        }
    }

    private fun extractM3u8Url(html: String): String? {
        val regex = """https?://[^\s'"<>]+\.m3u8""".toRegex()
        return regex.find(html)?.value
    }

    private fun extractH264Mp4Url(html: String): String? {
        val regex = """https?://[^\s'"<>]+h264\.mp4""".toRegex()
        return regex.find(html)?.value
    }

    // -------------------- merge --------------------

    private fun injectUrlsIntoJson(
        initialsJsonStr: String,
        hlsUrl: String?,
        mp4Url: String?,
    ): String =
        try {
            val json = JSONObject(initialsJsonStr)
            if (hlsUrl != null) json.put("hlsUrl", hlsUrl)
            if (mp4Url != null) json.put("mp4Url", mp4Url)
            json.toString()
        } catch (_: Exception) {
            initialsJsonStr
        }
}
