import org.jsoup.Jsoup
import org.jsoup.nodes.Document
import org.jsoup.nodes.Element
import java.io.IOException
import java.net.URL
import java.util.regex.Pattern

object HtmlExtractor {

    // ================== PUBLIC API ==================
    fun fetch(url: String, schema: Map<String, Any>): Map<String, Any> {
        return try {
            val html = fetchHtml(url)
            if (html.startsWith("http error")) {
                mapOf("error" to html)
            } else {
                extract(html, url, schema)
            }
        } catch (e: Exception) {
            mapOf("error" to e.message.toString())
        }
    }

    fun fetchHtml(url: String): String {
        return try {
            Jsoup.connect(url)
                .userAgent("Mozilla/5.0")
                .timeout(15000)
                .get()
                .html()
        } catch (e: IOException) {
            "http error: ${e.message}"
        }
    }

    // ================== CORE EXTRACTION ==================
    fun extract(html: String, baseUrl: String, schema: Map<String, Any>): Map<String, Any> {
        val doc = Jsoup.parse(html, baseUrl)
        val result = mutableMapOf<String, Any>()

        // ---------- GLOBALS ----------
        val globalsObj = mutableMapOf<String, Any>()
        val globals = schema["globals"] as? Map<String, Map<String, Any>> ?: emptyMap()
        for ((key, conf) in globals) {
            val value = extractField(doc, conf, baseUrl)
            if (value != null) globalsObj[key] = value
        }
        if (globalsObj.isNotEmpty()) result["globals"] = globalsObj

        // ---------- SECTIONS ----------
        val sectionsList = mutableListOf<Map<String, Any>>()
        val sections = schema["sections"] as? List<Map<String, Any>> ?: emptyList()
        for (sectionConf in sections) {
            val section = extractSection(doc, baseUrl, sectionConf)
            if (section != null) sectionsList.add(section)
        }
        if (sectionsList.isNotEmpty()) result["sections"] = sectionsList

        // ---------- LEGACY ITEMS ----------
        val legacySelector = schema["legacy_items"] as? String
        if (legacySelector != null) {
            val items = mutableListOf<Map<String, Any>>()
            val fields = schema["fields"] as? Map<String, Map<String, Any>> ?: emptyMap()
            for (el in doc.select(adaptSelector(legacySelector))) {
                val item = extractItem(el, baseUrl, fields)
                if (item.isNotEmpty()) items.add(item)
            }
            result["legacy_items"] = items
        }

        return result
    }

    // ================== SECTION EXTRACTION ==================
    fun extractSection(root: Element, baseUrl: String, conf: Map<String, Any>): Map<String, Any>? {
        val selector = conf["selector"] as? String ?: return null
        val sectionRoot = root.selectFirst(adaptSelector(selector)) ?: return null
        val sectionObj = mutableMapOf<String, Any>()

        conf["name"]?.let { sectionObj["name"] = it }

        // Metadata
        val metadataConf = conf["metadata"] as? Map<String, Map<String, Any>> ?: emptyMap()
        val metadata = mutableMapOf<String, Any>()
        for ((key, fieldConf) in metadataConf) {
            val valField = extractField(sectionRoot, fieldConf, baseUrl)
            if (valField != null) metadata[key] = valField
        }
        if (metadata.isNotEmpty()) sectionObj["metadata"] = metadata

        // Items
        val itemsConf = conf["items"] as? Map<String, Any>
        val items = mutableListOf<Map<String, Any>>()
        if (itemsConf != null) {
            val itemSelector = itemsConf["selector"] as? String
            val fields = itemsConf["fields"] as? Map<String, Map<String, Any>> ?: emptyMap()
            val nestedItems = itemsConf["nested_items"] as? List<Map<String, Any>> ?: emptyList()
            if (itemSelector != null) {
                for (el in sectionRoot.select(adaptSelector(itemSelector))) {
                    val item = extractItem(el, baseUrl, fields, nestedItems)
                    if (item.isNotEmpty()) items.add(item)
                }
            }
        }
        sectionObj["items"] = items

        // Sub-sections
        val subSectionsConf = conf["sub_sections"] as? List<Map<String, Any>> ?: emptyList()
        val subSections = mutableListOf<Map<String, Any>>()
        for (subConf in subSectionsConf) {
            val subSec = extractSection(sectionRoot, baseUrl, subConf)
            if (subSec != null) subSections.add(subSec)
        }
        if (subSections.isNotEmpty()) sectionObj["sub_sections"] = subSections

        return sectionObj
    }

    // ================== ITEM EXTRACTION ==================
    fun extractItem(
        root: Element,
        baseUrl: String,
        fields: Map<String, Map<String, Any>>,
        nestedItems: List<Map<String, Any>> = emptyList()
    ): Map<String, Any> {
        val obj = mutableMapOf<String, Any>()

        // Fields
        for ((key, fieldConf) in fields) {
            val valField = extractField(root, fieldConf, baseUrl)
            if (valField != null) obj[key] = valField
        }

        // Nested items
        val nestedList = mutableListOf<Map<String, Any>>()
        for (niConf in nestedItems) {
            val niSelector = niConf["selector"] as? String ?: continue
            val niFields = niConf["fields"] as? Map<String, Map<String, Any>> ?: emptyMap()
            val niNested = niConf["nested_items"] as? List<Map<String, Any>> ?: emptyList()
            for (el in root.select(adaptSelector(niSelector))) {
                val niObj = extractItem(el, baseUrl, niFields, niNested)
                if (niObj.isNotEmpty()) nestedList.add(niObj)
            }
        }
        if (nestedList.isNotEmpty()) obj["nested_items"] = nestedList

        return obj
    }

    // ================== FIELD EXTRACTION ==================
    fun extractField(node: Element, conf: Map<String, Any>, baseUrl: String): Any? {
        val sel = conf["selector"] as? String
        val targetNode = if (sel != null) node.selectFirst(adaptSelector(sel)) else node
        if (targetNode == null) return null

        val attr = conf["attr"]
        var value: String? = when (attr) {
            "text", null -> targetNode.text().trim()
            "html" -> targetNode.html()
            is String -> targetNode.attr(attr)
            is List<*> -> {
                var v: String? = null
                for (a in attr) {
                    if (a is String) {
                        v = targetNode.attr(a)
                        if (!v.isNullOrEmpty()) break
                    }
                }
                v
            }
            else -> null
        }
        if (value.isNullOrEmpty()) return null

        // Regex
        val regex = conf["regex"] as? String
        if (regex != null) {
            val m = Pattern.compile(regex).matcher(value)
            value = if (m.find()) m.group(0) else null
        }

        // Post-processing (simple example)
        val postFn = conf["post_process"] as? (String) -> Any
        if (postFn != null && value != null) value = postFn(value).toString()

        // Resolve URLs
        val resolveUrl = conf["resolve_url"] as? Boolean ?: false
        if ((attr == "href" || resolveUrl) && value != null) {
            value = URL(URL(baseUrl), value).toString()
        }

        return value
    }

    // ================== BS4 → Jsoup ADAPTER ==================
    private fun adaptSelector(selector: String): String {
        // Basic replacements; extend as needed
        return selector
            .replace(":contains(", ":matchesOwn(") // bs4 contains → jsoup matchesOwn
            .replace(":has(", ":has(") // jsoup also supports :has
            .replace(":nth-of-type", ":nth-child") // approximate mapping
    }
}
