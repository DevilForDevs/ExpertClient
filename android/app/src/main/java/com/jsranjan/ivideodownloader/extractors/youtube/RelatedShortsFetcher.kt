package com.jsranjan.ivideodownloader.extractors.youtube

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray

object RelatedShortsFetcher {
    private val client by lazy { OkHttpClient() }

    @Throws(Exception::class)
    fun fetch(videoId: String): JSONArray {
        val url = "https://www.youtube.com/shorts/$videoId"

        val request =
            Request
                .Builder()
                .url(url)
                .get()
                .header("User-Agent", "Mozilla/5.0")
                .header("Accept", "text/html")
                .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) {
            throw Exception("HTTP ${response.code}")
        }

        val html = response.body?.string() ?: throw Exception("Empty response")

        val ids = extractVideoIds(html, videoId)

        return JSONArray().apply {
            ids.forEach { put(it) }
        }
    }

    // -------------------- helpers --------------------

    private fun extractVideoIds(
        html: String,
        originalVideoId: String,
    ): Set<String> {
        val resultSet = mutableSetOf<String>()

        // 1️⃣ Standard JSON: "videoId":"XXXX"
        Regex(""""videoId":"([a-zA-Z0-9_-]{11})"""")
            .findAll(html)
            .forEach { resultSet.add(it.groupValues[1]) }

        // 2️⃣ Escaped quotes: \"videoId\":\"XXXX\"
        Regex("""\\"videoId\\":\\"([a-zA-Z0-9_-]{11})\\"""")
            .findAll(html)
            .forEach { resultSet.add(it.groupValues[1]) }

        // 3️⃣ Hex escaped: \x22videoId\x22:\x22XXXX\x22
        Regex("""\\x22videoId\\x22:\\x22([a-zA-Z0-9_-]{11})\\x22""")
            .findAll(html)
            .forEach { resultSet.add(it.groupValues[1]) }

        // Remove current short
        resultSet.remove(originalVideoId)

        return resultSet
    }
}
