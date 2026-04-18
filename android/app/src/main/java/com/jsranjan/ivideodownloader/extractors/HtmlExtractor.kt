package com.jsranjan.ivideodownloader.extractors

import org.json.JSONArray
import org.json.JSONObject
import org.jsoup.Jsoup
import org.jsoup.nodes.Element

object HtmlExtractor {
    fun fetch(input: JSONObject): JSONObject {
        if (!input.has("url")) {
            return JSONObject().put("error", "missing url")
        }
        if (!input.has("schema")) {
            return JSONObject().put("error", "missing schema")
        }

        val headers = input.getJSONObject("schema").optJSONObject("headers") ?: JSONObject()

        var html: String
        try {
            val conn = Jsoup.connect(input.getString("url")).timeout(15_000)
            headers.keys().forEach { k ->
                conn.header(k, headers.getString(k))
            }
            html = conn.get().html()
        } catch (e: Exception) {
            return JSONObject().put("error", e.message)
        }
        return extract(html, input.getString("url"), input.getJSONObject("schema"))
    }

    private fun extract(
        html: String,
        baseUrl: String,
        schema: JSONObject,
    ): JSONObject {
        val doc = Jsoup.parse(html, baseUrl)
        val result = JSONObject()

        // -------- GLOBALS --------

        if (schema.has("globals")) {
            val globalsConf = schema.getJSONObject("globals")
            val globals = JSONObject()

            for (key in globalsConf.keys()) {
                val value = extractField(doc, globalsConf.getJSONObject(key))
                globals.put(key, value)
            }

            result.put("globals", globals)
        }

        // -------- SECTIONS --------

        if (schema.has("sections")) {
            val sectionSchemas = schema.getJSONArray("sections")
            val sectionsResult = JSONObject()

            for (i in 0 until sectionSchemas.length()) {
                val sectionConf = sectionSchemas.getJSONObject(i)

                val sectionKey = sectionConf.getString("key")
                val sectionResult = extractSections(doc, sectionConf, sectionKey)

                sectionsResult.put(sectionKey, sectionResult)
            }

            result.put("sections", sectionsResult)
        }

        return result
    }

    private fun extractField(
        parent: Element,
        conf: JSONObject,
    ): String {
        val selector = conf.optString("selector", "")
        val attr = conf.getString("attr")

        val target =
            if (selector.isBlank()) {
                parent
            } else {
                parent.selectFirst(selector)
                    ?: return ""
            }

        return when (attr) {
            "text" -> {
                target.text().trim()
            }

            "html" -> {
                target.html().trim()
            }

            else -> {
                // Try absolute URL first
                val abs = target.absUrl(attr)
                if (abs.isNotBlank()) abs else target.attr(attr)
            }
        }
    }

    private fun extractSections(
        parent: Element,
        conf: JSONObject,
        sectionKey: String,
    ): JSONObject {
        val debug = JSONArray()
        val result = JSONObject()

        val sectionElement =
            findSection(parent, conf, sectionKey, debug)
                ?: return JSONObject().put("_debug", debug)

        extractSectionFields(sectionElement, conf, sectionKey, result, debug)
        extractItemList(sectionElement, conf, sectionKey, result, debug)

        if (debug.length() > 0) result.put("_debug", debug)
        return result
    }

    private fun findSection(
        parent: Element,
        conf: JSONObject,
        sectionKey: String,
        debug: JSONArray,
    ): Element? {
        val selector = conf.getString("selector")
        val section = parent.selectFirst(selector)

        if (section == null) {
            recordError(debug, sectionKey, selector, "section not found")
        }

        return section
    }

    private fun extractSectionFields(
        section: Element,
        conf: JSONObject,
        sectionKey: String,
        result: JSONObject,
        debug: JSONArray,
    ) {
        if (!conf.has("fields")) return

        val fields = conf.getJSONObject("fields")

        for (key in fields.keys()) {
            val fieldConf = fields.getJSONObject(key)
            val selector = fieldConf.getString("selector")

            val value = extractField(section, fieldConf)
            if (value.isBlank()) {
                recordError(
                    debug,
                    "$sectionKey.$key",
                    selector,
                    "field not found",
                )
            }

            result.put(key, value)
        }
    }

    private fun extractItemList(
        section: Element,
        conf: JSONObject,
        sectionKey: String,
        result: JSONObject,
        debug: JSONArray,
    ) {
        if (!conf.has("items")) return

        val itemsConf = conf.getJSONObject("items")
        val itemSelector = itemsConf.getString("selector")
        val fieldsConf = itemsConf.getJSONObject("fields")

        val elements = section.select(itemSelector)
        if (elements.isEmpty()) {
            recordError(debug, "$sectionKey.items", itemSelector, "no items found")
            return
        }

        val itemsArray = JSONArray()
        for ((index, el) in elements.withIndex()) {
            itemsArray.put(
                extractItemFields(
                    el,
                    fieldsConf,
                    "$sectionKey.items[$index]",
                    debug,
                ),
            )
        }

        result.put("items", itemsArray)
    }

    private fun extractItemFields(
        itemElement: Element,
        fieldsConf: JSONObject,
        path: String,
        debug: JSONArray,
    ): JSONObject {
        val itemObj = JSONObject()

        for (key in fieldsConf.keys()) {
            val fieldConf = fieldsConf.getJSONObject(key)
            val selector = fieldConf.getString("selector")

            val value = extractField(itemElement, fieldConf)
            if (value.isBlank()) {
                recordError(
                    debug,
                    "$path.$key",
                    selector,
                    "field not found",
                )
            }

            itemObj.put(key, value)
        }

        return itemObj
    }

    private fun recordError(
        debug: JSONArray,
        path: String,
        selector: String,
        reason: String,
    ) {
        debug.put(
            JSONObject()
                .put("path", path)
                .put("selector", selector)
                .put("reason", reason),
        )
    }
}
