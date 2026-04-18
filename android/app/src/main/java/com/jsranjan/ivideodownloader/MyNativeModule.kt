package com.jsranjan.ivideodownloader

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.jsranjan.ivideodownloader.extractors.HtmlExtractor
import com.jsranjan.ivideodownloader.extractors.metaporn.JsonHtmlBridge
import com.jsranjan.ivideodownloader.extractors.xhamster.XhInitialsFetcher
import com.jsranjan.ivideodownloader.extractors.xhamster.XhRelatedFetcher
import com.jsranjan.ivideodownloader.extractors.youtube.FeedRouter
import com.jsranjan.ivideodownloader.extractors.youtube.NativeFileDownloader
import com.jsranjan.ivideodownloader.extractors.youtube.RelatedShortsFetcher
import com.jsranjan.ivideodownloader.extractors.youtube.ShortMetaFetcher
import com.jsranjan.ivideodownloader.extractors.youtube.YtInitialDataFetcher
import com.jsranjan.ivideodownloader.extractors.youtube.YtPlaylistBrowseFetcher
import com.jsranjan.ivideodownloader.extractors.youtube.YtSearchFetcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.util.concurrent.ConcurrentHashMap

@ReactModule(name = MyNativeModule.NAME)
class MyNativeModule(
    private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
    companion object {
        const val NAME = "MyNativeModule"
    }

    val backThread = CoroutineScope(Dispatchers.IO)
    private val activeDownloads =
        ConcurrentHashMap<String, Pair<NativeFileDownloader, Job>>()

    @ReactMethod
    fun fetchFeed(
        videoId: String?,
        continuation: String?,
        visitorData: String,
        promise: Promise,
    ) {
        backThread.launch {
            try {
                val result =
                    FeedRouter.fetch(
                        videoId = videoId,
                        continuation = continuation,
                        visitorData = visitorData,
                    )

                promise.resolve(result.toString())
            } catch (e: Exception) {
                promise.reject("ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getShortMeta(
        videoId: String,
        promise: Promise,
    ) {
        backThread.launch {
            try {
                val result = ShortMetaFetcher.fetch(videoId)
                promise.resolve(result.toString())
            } catch (e: Exception) {
                promise.reject("ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getRelatedShortVideoIds(
        videoId: String,
        promise: Promise,
    ) {
        backThread.launch {
            try {
                val result = RelatedShortsFetcher.fetch(videoId)
                promise.resolve(result.toString())
            } catch (e: Exception) {
                promise.reject("ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getXhInitials(
        pageUrl: String,
        promise: Promise,
    ) {
        backThread.launch(Dispatchers.IO) {
            val result = XhInitialsFetcher.fetch(pageUrl)
            promise.resolve(result)
        }
    }

    @ReactMethod
    fun htmlJsonBridge(
        pageUrl: String,
        schemaJson: String,
        promise: Promise,
    ) {
        backThread.launch(Dispatchers.IO) {
            try {
                val schema = JSONObject(schemaJson)
                val result = JsonHtmlBridge.fetch(pageUrl, schema)
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject(
                    "META_PORN_SCHEMA_ERROR",
                    e.message ?: "invalid schema",
                )
            }
        }
    }

    @ReactMethod
    fun htmlExtractor(
        schemaJson: String,
        promise: Promise,
    ) {
        backThread.launch(Dispatchers.IO) {
            try {
                val schemaObj = JSONObject(schemaJson)
                val result = HtmlExtractor.fetch(schemaObj)
                promise.resolve(result.toString())
            } catch (e: Exception) {
                promise.reject(
                    "EXTRACT_ERROR",
                    e.message ?: "Invalid schema or extraction failed",
                )
            }
        }
    }

    @ReactMethod
    fun getXhRelated(
        paramsJsonString: String,
        pageUrl: String,
        promise: Promise,
    ) {
        backThread.launch(Dispatchers.IO) {
            try {
                val paramsJson = JSONObject(paramsJsonString)

                val headers =
                    mapOf(
                        "User-Agent" to
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                        "Accept" to "application/json",
                        "X-Requested-With" to "XMLHttpRequest",
                        "Referer" to pageUrl,
                        "Sec-Fetch-Mode" to "cors",
                        "Sec-Fetch-Site" to "same-origin",
                    )

                val result =
                    XhRelatedFetcher.fetch(
                        paramsJson = paramsJson,
                        headers = headers,
                    )

                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject(
                    "XH_RELATED_ERROR",
                    e.message ?: "unknown error",
                )
            }
        }
    }

    @ReactMethod
    fun getYtInitialData(
        watchUrl: String,
        promise: Promise,
    ) {
        backThread.launch(Dispatchers.IO) {
            try {
                val result = YtInitialDataFetcher.fetch(watchUrl)
                promise.resolve(result.toString())
            } catch (e: Exception) {
                promise.reject("ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun getYtPlaylistBrowse(
        key: String, // "browseId" or "continuation"
        value: String, // VL... or continuation token
        paras: String?, // optional "params"
        promise: Promise,
    ) {
        backThread.launch(Dispatchers.IO) {
            try {
                // Pass paras to the fetcher (it handles null automatically)
                val result = YtPlaylistBrowseFetcher.fetch(key, value, paras)
                promise.resolve(result) // ALWAYS returns a string
            } catch (e: Exception) {
                // Failsafe: should never happen
                promise.resolve(
                    """{"error":"bridge_exception","message":"${e.message}"}""",
                )
            }
        }
    }

    @ReactMethod
    fun searchYoutube(
        query: String,
        continuation: String?,
        params: String?,
        promise: Promise,
    ) {
        backThread.launch(Dispatchers.IO) {
            try {
                val result =
                    YtSearchFetcher.fetch(
                        query = query,
                        continuation = continuation,
                        params = params,
                    )

                promise.resolve(result) // ✅ raw string
            } catch (e: Exception) {
                promise.reject("ERROR", e.message, e)
            }
        }
    }

    @ReactMethod
    fun native_fileDownloader(
        videoInformation: String,
        audioInformation: String,
        videoId: String,
        fileName: String,
    ) {
        if (activeDownloads.containsKey(videoId)) return

        backThread.launch {
            val job = coroutineContext[Job]!!

            val downloader =
                NativeFileDownloader(reactContext) { id, progress, percent, speed, message ->
                    CoroutineScope(Dispatchers.Main).launch {
                        sendProgressUpdate(id, progress, percent, speed, message)
                    }
                }

            activeDownloads[videoId] = Pair(downloader, job)

            try {
                downloader.download(
                    videoInformation,
                    audioInformation,
                    videoId,
                    fileName,
                )
            } finally {
                activeDownloads.remove(videoId)
            }
        }
    }

    @ReactMethod
    fun checkUrl(
        url: String,
        promise: Promise,
    ) {
        backThread.launch {
            val client = OkHttpClient()
            try {
                val request =
                    Request
                        .Builder()
                        .url(url)
                        .head() // 👈 use HEAD instead of GET (faster)
                        .build()

                client.newCall(request).execute().use { response ->
                    promise.resolve(response.code == 200)
                }
            } catch (e: Exception) {
                promise.resolve(false)
            }
        }
    }

    @ReactMethod
    fun cancelDownload(videoId: String) {
        activeDownloads[videoId]?.let { (downloader, job) ->
            downloader.cancel() // stop IO loop
            job.cancel() // stop coroutine
            activeDownloads.remove(videoId)
        }
    }

    private fun sendProgressUpdate(
        videoId: String,
        progress: String,
        percent: Int,
        speed: String,
        message: String,
    ) {
        val params =
            Arguments.createMap().apply {
                putString("videoId", videoId)
                putString("progress", progress)
                putInt("percent", percent)
                putString("speed", speed)
                putString("message", message)
            }
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("DownloadProgress", params)
    }

    override fun getName(): String = NAME

    @ReactMethod
    fun addListener(eventName: String?) {
        // Required for RN >= 0.65
    }

    @ReactMethod
    fun removeListeners(count: Int) {
        // Required for RN >= 0.65
    }
}
