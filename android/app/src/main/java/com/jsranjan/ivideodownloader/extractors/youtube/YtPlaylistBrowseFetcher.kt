package com.jsranjan.ivideodownloader.extractors.youtube

import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject

object YtPlaylistBrowseFetcher {
    private val client by lazy { OkHttpClient() }

    private const val BROWSE_URL =
        "https://www.youtube.com/youtubei/v1/browse?prettyPrint=false"

    private val JSON = "application/json; charset=utf-8".toMediaType()

    fun fetch(
        key: String,
        value: String,
        paras: String? = null,
    ): String {
        val payload =
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

                // Always add the dynamic key/value
                put(key, value)

                // Only add "params" if it is non-null
                if (!paras.isNullOrEmpty()) {
                    put("params", paras)
                }
            }

        val body = payload.toString().toRequestBody(JSON)

        val request =
            Request
                .Builder()
                .url(BROWSE_URL)
                .post(body)
                .header("Content-Type", "application/json")
                .header("X-Youtube-Client-Name", "1")
                .header("X-Youtube-Client-Version", "2.20260101.00.00")
                .header("Origin", "https://www.youtube.com")
                .header("Referer", "https://www.youtube.com/")
                .build()

        return try {
            client.newCall(request).execute().use { response ->
                response.body?.string()
                    ?: """{"error":"empty response","code":${response.code}}"""
            }
        } catch (e: Exception) {
            """{"error":"exception","message":"${e.message}"}"""
        }
    }
}
