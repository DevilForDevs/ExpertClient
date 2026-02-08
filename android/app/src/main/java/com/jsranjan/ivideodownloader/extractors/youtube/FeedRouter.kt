package com.jsranjan.ivideodownloader.extractors.youtube

import org.json.JSONObject

object FeedRouter {
    fun fetch(
        videoId: String?,
        continuation: String?,
        visitorData: String,
    ): JSONObject {
        // Case 3️⃣ : homepage / shorts browse
        if (videoId == null && continuation != null) {
            return HomescreenBrowse.fetchBrowse(
                continuation = continuation,
                visitorData = visitorData,
            )
        }

        if (videoId != null && continuation != null) {
            return WatchNextBrowse.fetch(
                videoId = videoId,
                continuation = continuation,
                visitorData = visitorData,
            )
        }

        throw IllegalArgumentException("Invalid parameters")
    }
}
