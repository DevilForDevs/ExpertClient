package com.jsranjan.ivideodownloader.extractors.metaporn

import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import org.jsoup.Jsoup
import org.jsoup.nodes.Element
import java.net.URI
import java.util.regex.Pattern

object JsonHtmlBridge {
    private val client = OkHttpClient()

    // ================= PUBLIC API =================

    fun fetch(
        pageUrl: String,
        schema: JSONObject,
    ): String =
        try {
            val html = fetchHtml(pageUrl)
            if (html.startsWith("http error")) {
                html
            } else {
                extract(html, pageUrl, schema).toString()
            }
        } catch (e: Exception) {
            "error: ${e.message ?: "unknown error"}"
        }

    // ================= NETWORK =================

    private fun fetchHtml(url: String): String {
        val request =
            Request
                .Builder()
                .url(url)
                .header("User-Agent", "Mozilla/5.0")
                .header("Accept", "text/html")
                .build()

        client.newCall(request).execute().use { res ->
            if (!res.isSuccessful) return "http error: ${res.code}"
            return res.body?.string() ?: ""
        }
    }

    // ================= CORE =================

    private fun extract(
        html: String,
        baseUrl: String,
        schema: JSONObject,
    ): JSONObject {
        val doc = Jsoup.parse(html, baseUrl)

        val result = JSONObject()
        val globals = JSONObject()
        val legacyItems = JSONArray()

        // ---------- GLOBAL (document-level) ----------
        extractDocumentGlobals(doc, schema, globals)

        // ---------- $containers ----------
        schema.optJSONObject("\$containers")?.let { containersObj ->
            containersObj.keys().forEach { containerName ->

                val cfg = containersObj.optJSONObject(containerName) ?: return@forEach
                val selector = cfg.optString("selector")
                if (selector.isBlank()) return@forEach

                val subSchema = cfg.optJSONObject("schema") ?: JSONObject()
                val arr = JSONArray()

                var containerGlobalsExtracted = false
                val containerGlobals = JSONObject()

                for (el in doc.select(selector)) {
                    // extract container-globals ONCE
                    if (!containerGlobalsExtracted) {
                        extractContainerGlobals(el, subSchema, containerGlobals)
                        containerGlobalsExtracted = true
                    }

                    arr.put(extractFromElement(el, subSchema, baseUrl))
                }

                result.put(containerName, arr)

                if (containerGlobals.length() > 0) {
                    globals.put(containerName, containerGlobals)
                }
            }
        }

        // ---------- LEGACY container → items ----------
        schema.optString("container").takeIf { it.isNotBlank() }?.let { selector ->

            var legacyGlobalsExtracted = false
            val legacyGlobals = JSONObject()

            for (el in doc.select(selector)) {
                if (!legacyGlobalsExtracted) {
                    extractContainerGlobals(el, schema, legacyGlobals)
                    legacyGlobalsExtracted = true
                }

                legacyItems.put(extractFromElement(el, schema, baseUrl))
            }

            if (legacyItems.length() > 0) {
                result.put("items", legacyItems)
            }

            if (legacyGlobals.length() > 0) {
                globals.put("items", legacyGlobals)
            }
        }

        // ---------- REGEX VIDEO URLS ----------
        schema.optJSONObject("videoUrl")?.let {
            result.put("videoUrls", findVideoUrls(html, it))
        }

        if (globals.length() > 0) {
            result.put("globals", globals)
        }

        return result
    }

    // ================= GLOBAL HELPERS =================

    private fun extractDocumentGlobals(
        doc: org.jsoup.nodes.Document,
        schema: JSONObject,
        globals: JSONObject,
    ) {
        schema.keys().forEach { key ->
            val conf = schema.optJSONObject(key) ?: return@forEach
            if (conf.optString("scope") != "global") return@forEach

            val selector = conf.optString("selector")
            if (selector.isBlank()) return@forEach

            if (conf.optBoolean("multiple")) {
                val arr = JSONArray()
                for (el in doc.select(selector)) {
                    extractValue(el, conf)?.let { arr.put(it) }
                }
                globals.put(key, arr)
            } else {
                doc
                    .selectFirst(selector)
                    ?.let { extractValue(it, conf) }
                    ?.let { globals.put(key, it) }
            }
        }
    }

    private fun extractContainerGlobals(
        root: Element,
        schema: JSONObject,
        globals: JSONObject,
    ) {
        schema.keys().forEach { key ->
            val conf = schema.optJSONObject(key) ?: return@forEach
            if (conf.optString("scope") != "container-global") return@forEach

            val selector = conf.optString("selector")
            val node = if (selector.isBlank()) root else root.selectFirst(selector)

            node?.let {
                extractValue(it, conf)?.let { value ->
                    globals.put(key, value)
                }
            }
        }
    }

    // ================= ITEM EXTRACTION =================

    private fun extractFromElement(
        root: Element,
        schema: JSONObject,
        baseUrl: String,
    ): JSONObject {
        val obj = JSONObject()
        schema.keys().forEach { key ->
            if (key.startsWith("$") || key == "container") return@forEach

            val conf = schema.optJSONObject(key) ?: return@forEach

            // ---------- NESTED CONTAINER ----------
            // NEW: nested container support
            if (conf.has("container") && conf.has("schema")) {
                val arr = JSONArray()
                val sel = conf.optString("container")
                if (sel.isNotBlank()) {
                    for (child in root.select(sel)) {
                        arr.put(extractFromElement(child, conf.getJSONObject("schema"), baseUrl))
                    }
                }
                obj.put(key, arr)
                return@forEach
            }

            // ---------- SIMPLE FIELD ----------
            val selector = conf.optString("selector")
            val node = if (selector.isBlank()) root else root.selectFirst(selector)

            node?.let {
                extractValue(it, conf)?.let { value ->
                    obj.put(key, resolveUrl(key, value, baseUrl))
                }
            }
        }

        return obj
    }

    // ================= VALUE =================

    private fun extractValue(
        node: Element,
        conf: JSONObject,
    ): Any? {
        val attr = conf.opt("attr")

        return when (attr) {
            "text" -> {
                node.text().trim()
            }

            "html" -> {
                node.html()
            }

            is JSONArray -> {
                for (i in 0 until attr.length()) {
                    val a = attr.optString(i)
                    val v = node.attr(a)
                    if (v.isNotBlank()) return v
                }
                null
            }

            is String -> {
                node.attr(attr).takeIf { it.isNotBlank() }
            }

            else -> {
                null
            }
        }
    }

    private fun resolveUrl(
        key: String,
        value: Any,
        baseUrl: String,
    ): Any {
        if (value !is String) return value
        if ((key == "url" || key.endsWith("Url")) && value.startsWith("/")) {
            return URI(baseUrl).resolve(value).toString()
        }
        return value
    }

    // ================= REGEX =================

    private fun findVideoUrls(
        html: String,
        conf: JSONObject,
    ): JSONArray {
        val arr = JSONArray()
        val patternStr = conf.optString("pattern")
        if (patternStr.isBlank()) return arr

        val seen = HashSet<String>()
        val matcher = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE).matcher(html)

        while (matcher.find()) {
            val url = matcher.group()
            if (seen.add(url)) arr.put(url)
        }
        return arr
    }

    private fun extractFields(
        root: Element,
        fields: JSONObject,
        baseUrl: String,
    ): JSONObject {
        val obj = JSONObject()

        fields.keys().forEach { key ->
            val conf = fields.optJSONObject(key) ?: return@forEach
            val selector = conf.optString("selector")
            val node = if (selector.isBlank()) root else root.selectFirst(selector)

            node?.let {
                extractValue(it, conf)?.let { value ->
                    obj.put(key, resolveUrl(key, value, baseUrl))
                }
            }
        }

        return obj
    }
}
