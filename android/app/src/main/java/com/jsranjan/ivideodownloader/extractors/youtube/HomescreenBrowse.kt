package com.jsranjan.ivideodownloader.extractors.youtube

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

object HomescreenBrowse {
    private const val CLIENT_VERSION = "2.20251222.01.00"

    private const val USER_AGENT =
        "Mozilla/5.0 (Linux; Android 15; CPH2665 Build/AP3A.240617.008; wv) " +
            "AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 " +
            "Chrome/143.0.7499.34 Mobile Safari/537.36"

    private val httpClient =
        OkHttpClient
            .Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .build()

    // -------------------- base context --------------------

    fun baseContext(
        visitorData: String,
        originalUrl: String,
    ): MutableMap<String, Any> =
        mutableMapOf(
            "context" to
                mapOf(
                    "client" to
                        mapOf(
                            "hl" to "en-GB",
                            "gl" to "NL",
                            "clientName" to "MWEB",
                            "clientVersion" to CLIENT_VERSION,
                            "platform" to "MOBILE",
                            "osName" to "Android",
                            "osVersion" to "15",
                            "browserName" to "Chrome Mobile Webview",
                            "browserVersion" to "143.0.7499.34",
                            "visitorData" to visitorData,
                            "userAgent" to USER_AGENT,
                            "clientFormFactor" to "SMALL_FORM_FACTOR",
                            "timeZone" to "Asia/Calcutta",
                            "originalUrl" to originalUrl,
                        ),
                ),
        )

    // -------------------- core POST --------------------

    private fun postYoutubei(
        endpoint: String,
        body: Map<String, Any>,
        referer: String,
        visitorData: String,
    ): JSONObject {
        val json = JSONObject(body).toString()
        val requestBody =
            json.toRequestBody("application/json; charset=utf-8".toMediaType())

        val request =
            Request
                .Builder()
                .url("https://m.youtube.com/youtubei/v1/$endpoint?prettyPrint=false")
                .post(requestBody)
                .addHeader("content-type", "application/json")
                .addHeader("origin", "https://m.youtube.com")
                .addHeader("referer", referer)
                .addHeader("user-agent", USER_AGENT)
                .addHeader("x-youtube-client-name", "2")
                .addHeader("x-youtube-client-version", CLIENT_VERSION)
                .addHeader("x-youtube-bootstrap-logged-in", "false")
                .addHeader("x-goog-visitor-id", visitorData)
                .build()

        httpClient.newCall(request).execute().use {
            return JSONObject(it.body?.string() ?: "{}")
        }
    }

    // -------------------- BROWSE (Home Feed) --------------------

    fun fetchBrowse(
        continuation: String?,
        visitorData: String,
    ): JSONObject {
        val body =
            baseContext(
                visitorData = visitorData,
                originalUrl = "https://m.youtube.com/",
            )

        if (continuation != null) {
            body["continuation"] = continuation
        }

        return postYoutubei(
            endpoint = "browse",
            body = body,
            referer = "https://m.youtube.com/",
            visitorData = visitorData,
        )
    }
}
