package com.jsranjan.ivideodownloader.extractors.xhamster

import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

object XhRelatedFetcher {
    private val client by lazy { OkHttpClient() }

    private const val API_URL =
        "https://xhamster1.desi/api/front/video/related"

    fun fetch(
        paramsJson: JSONObject,
        headers: Map<String, String>,
    ): String =
        try {
            val url =
                API_URL
                    .toHttpUrlOrNull()
                    ?.newBuilder()
                    ?.addQueryParameter("params", paramsJson.toString())
                    ?.build()
                    ?: return "invalid url"

            val request =
                Request
                    .Builder()
                    .url(url)
                    .get()
                    .headers(buildHeaders(headers))
                    .build()

            client.newCall(request).execute().use { response ->
                if (!response.isSuccessful) {
                    return "http error: ${response.code}"
                }
                response.body?.string() ?: "empty response body"
            }
        } catch (e: Exception) {
            "error: ${e.message ?: "unknown error"}"
        }

    private fun buildHeaders(headers: Map<String, String>) =
        okhttp3.Headers
            .Builder()
            .apply {
                headers.forEach { (key, value) ->
                    set(key, value) // important
                }
            }.build()
}
