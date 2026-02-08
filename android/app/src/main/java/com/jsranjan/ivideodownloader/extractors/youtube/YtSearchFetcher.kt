package com.jsranjan.ivideodownloader.extractors.youtube

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

object YtSearchFetcher {
    private val client by lazy { OkHttpClient() }

    private const val SEARCH_URL =
        "https://www.youtube.com/youtubei/v1/search?prettyPrint=false"

    fun fetch(
        query: String,
        continuation: String? = null,
        params: String? = null,
    ): String =
        try {
            val jsonBody =
                if (continuation != null) {
                    JSONObject().put("continuation", continuation)
                } else {
                    JSONObject()
                        .put("query", query)
                        .apply {
                            if (params != null) put("params", params)
                        }
                }

            jsonBody.put(
                "context",
                JSONObject()
                    .put(
                        "request",
                        JSONObject()
                            .put("useSsl", true),
                    ).put(
                        "client",
                        JSONObject()
                            .put("utcOffsetMinutes", 0)
                            .put("hl", "en-GB")
                            .put("gl", "IN")
                            .put("clientName", "WEB")
                            .put("originalUrl", "https://www.youtube.com")
                            .put("clientVersion", "2.20250613.00.00")
                            .put("platform", "DESKTOP"),
                    ).put(
                        "user",
                        JSONObject().put("lockedSafetyMode", false),
                    ),
            )

            val body =
                jsonBody
                    .toString()
                    .toRequestBody("application/json".toMediaType())

            val request =
                Request
                    .Builder()
                    .url(SEARCH_URL)
                    .post(body)
                    .header("Origin", "https://www.youtube.com")
                    .header("Referer", "https://www.youtube.com")
                    .header("X-YouTube-Client-Version", "2.20250613.00.00")
                    .header("X-YouTube-Client-Name", "1")
                    .header("Content-Type", "application/json")
                    .header("Accept-Language", "en-GB,en;q=0.9")
                    .build()

            val response = client.newCall(request).execute()

            // ✅ ALWAYS return body if present
            response.body?.string()
                ?: JSONObject()
                    .put("error", "EMPTY_RESPONSE")
                    .put("httpStatus", response.code)
                    .toString()
        } catch (e: Exception) {
            // ✅ Network / JSON / SSL errors
            JSONObject()
                .put("error", "REQUEST_FAILED")
                .put("message", e.message)
                .toString()
        }
}
