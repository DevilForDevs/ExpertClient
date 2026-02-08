package com.jsranjan.ivideodownloader.extractors.youtube

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

object ShortMetaFetcher {
    private val client by lazy { OkHttpClient() }

    private const val API_URL =
        "https://www.youtube.com/youtubei/v1/reel/reel_item_watch?prettyPrint=false"

    /**
     * Always returns response body as String
     * (even for non-200 responses)
     */
    @Throws(Exception::class)
    fun fetch(videoId: String): String {
        val payload = buildPayload(videoId)

        val request =
            Request
                .Builder()
                .url(API_URL)
                .post(payload.toRequestBody("application/json".toMediaType()))
                .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                .header("Content-Type", "application/json")
                .header("Origin", "https://www.youtube.com")
                .header("Referer", "https://www.youtube.com/shorts/$videoId")
                .header("X-Youtube-Client-Name", "1")
                .header("X-Youtube-Client-Version", "2.20260101.00.00")
                .build()

        client.newCall(request).execute().use { response ->
            // ✅ Return body whether status is 200 or not
            return response.body?.string()
                ?: "EMPTY_RESPONSE (HTTP ${response.code})"
        }
    }

    // -------------------- helpers --------------------

    private fun buildPayload(videoId: String): String {
        val json =
            JSONObject().apply {
                put(
                    "context",
                    JSONObject().apply {
                        put(
                            "client",
                            JSONObject().apply {
                                put("clientName", "WEB")
                                put("clientVersion", "2.20260101.00.00")
                                put("hl", "en")
                                put("gl", "IN")
                            },
                        )
                    },
                )

                // 🔑 videoId section
                put(
                    "playerRequest",
                    JSONObject().apply {
                        put("videoId", videoId)
                    },
                )

                put("disablePlayerResponse", true)
            }

        return json.toString()
    }
}
