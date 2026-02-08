package com.jsranjan.ivideodownloader.extractors.youtube

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object WatchNextBrowse {
    private const val CLIENT_VERSION = "2.20251222.04.00"

    private const val USER_AGENT =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/143.0.0.0"

    private val httpClient =
        OkHttpClient
            .Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

    // -------------------- core --------------------

    fun fetch(
        videoId: String,
        continuation: String?,
        visitorData: String,
    ): JSONObject {
        val body =
            mutableMapOf<String, Any>(
                "context" to
                    mapOf(
                        "client" to
                            mapOf(
                                "hl" to "en",
                                "gl" to "IN",
                                "clientName" to "WEB",
                                "clientVersion" to CLIENT_VERSION,
                                "platform" to "DESKTOP",
                                "osName" to "Windows",
                                "osVersion" to "10.0",
                                "timeZone" to "Asia/Calcutta",
                                "userAgent" to USER_AGENT,
                                "userInterfaceTheme" to "USER_INTERFACE_THEME_DARK",
                                "visitorData" to visitorData,
                            ),
                    ),
                "videoId" to videoId,
            )

        if (continuation != null) {
            body["continuation"] = continuation
        }

        val json = JSONObject(body).toString()
        val requestBody =
            json.toRequestBody("application/json; charset=utf-8".toMediaType())

        val request =
            Request
                .Builder()
                .url("https://www.youtube.com/youtubei/v1/next?prettyPrint=false")
                .post(requestBody)
                .addHeader("content-type", "application/json")
                .addHeader("origin", "https://www.youtube.com")
                .addHeader("referer", "https://www.youtube.com/watch?v=$videoId")
                .addHeader("user-agent", USER_AGENT)
                .addHeader("x-youtube-client-name", "1")
                .addHeader("x-youtube-client-version", CLIENT_VERSION)
                .addHeader("x-youtube-bootstrap-logged-in", "false")
                .addHeader("x-goog-visitor-id", visitorData)
                .build()

        httpClient.newCall(request).execute().use {
            return JSONObject(it.body?.string() ?: "{}")
        }
    }
}
