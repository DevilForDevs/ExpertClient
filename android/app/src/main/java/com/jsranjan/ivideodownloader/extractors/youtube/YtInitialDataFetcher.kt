package com.jsranjan.ivideodownloader.extractors.youtube

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

object YtInitialDataFetcher {
    private val client by lazy { OkHttpClient() }

    private val regex1 =
        Regex("""ytInitialData"\]\s*=\s*(\{.*?\});""", RegexOption.DOT_MATCHES_ALL)
    private val regex2 =
        Regex("""ytInitialData\s*=\s*(\{.*?\});""", RegexOption.DOT_MATCHES_ALL)

    @Throws(Exception::class)
    fun fetch(watchUrl: String): JSONObject {
        val html = fetchHtml(watchUrl)
        return extractInitialData(html)
    }

    // -------------------- network --------------------

    private fun fetchHtml(url: String): String {
        val request =
            Request
                .Builder()
                .url(url)
                .get()
                .header("Accept", "text/html")
                .build()

        val response = client.newCall(request).execute()
        if (!response.isSuccessful) {
            throw Exception("HTTP ${response.code}")
        }

        return response.body?.string() ?: throw Exception("Empty response")
    }

    // -------------------- extraction only --------------------

    private fun extractInitialData(html: String): JSONObject {
        val match =
            regex1.find(html) ?: regex2.find(html)
                ?: throw Exception("ytInitialData not found")

        return JSONObject(match.groupValues[1])
    }
}
