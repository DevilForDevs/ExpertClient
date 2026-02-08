export const HOME_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Suggested Sites</title>

<style>
    body {
        margin: 0;
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        background: #f4f6fb;
    }

    header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    h1 {
        margin: 0;
        font-size: 22px;
        color: #222;
    }

    button {
        border: none;
        background: #4f46e5;
        color: #fff;
        padding: 8px 14px;
        border-radius: 10px;
        font-size: 14px;
        cursor: pointer;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
    }

    .card {
        background: #fff;
        border-radius: 16px;
        padding: 20px;
        text-align: center;
        color: #000;
        box-shadow: 0 10px 25px rgba(0,0,0,0.08);
        cursor: pointer;
        user-select: none;
    }

    .icon {
        font-size: 32px;
        margin-bottom: 10px;
    }

    .title {
        font-weight: 600;
        font-size: 15px;
    }

    .modal {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.4);
        display: none;
        align-items: center;
        justify-content: center;
    }

    .modal-content {
        background: #fff;
        padding: 20px;
        width: 90%;
        max-width: 320px;
        border-radius: 16px;
    }

    input {
        width: 100%;
        padding: 10px;
        margin-bottom: 12px;
        border-radius: 10px;
        border: 1px solid #ccc;
        font-size: 14px;
    }
</style>
</head>

<body>

<header>
    <h1>🌐 Suggested Sites</h1>
</header>

<div class="grid" id="sites"></div>

<div class="modal" id="modal">
    <div class="modal-content">
        <h3>Add Website</h3>
        <input id="name" placeholder="Site name" />
        <input id="url" placeholder="https://example.com" />
       <button type="button" onclick="addSite()">Save</button>
<button type="button" onclick="closeModal()" style="background:#999;margin-left:8px;">
    Cancel
</button>

    </div>
</div>

<script>
    const DEFAULT_SITES = [
        { name: "YouTube", url: "https://www.youtube.com", icon: "📺" },
        { name: "Wikipedia", url: "https://www.wikipedia.org", icon: "📚" },
        { name: "Sarkari Result", url: "https://www.sarkariresult.com", icon: "📝" },
        { name: "Google", url: "https://www.google.com", icon: "🔍" }
    ];

    function getSites() {
        try {
            const stored = localStorage.getItem("sites");
            if (!stored) {
                localStorage.setItem("sites", JSON.stringify(DEFAULT_SITES));
                return DEFAULT_SITES;
            }
            return JSON.parse(stored);
        } catch {
            return DEFAULT_SITES;
        }
    }

    function saveSites(sites) {
        localStorage.setItem("sites", JSON.stringify(sites));
    }

    function renderSites() {
        const container = document.getElementById("sites");
        container.innerHTML = "";

        getSites().forEach(site => {
            const card = document.createElement("div");
            card.className = "card";
            card.onclick = () => window.location.href = site.url;

            card.innerHTML = \`
                <div class="icon">\${site.icon || "🌍"}</div>
                <div class="title">\${site.name}</div>
            \`;

            container.appendChild(card);
        });
    }

    function openModal() {
        document.getElementById("modal").style.display = "flex";
    }

    function closeModal() {
        document.getElementById("modal").style.display = "none";
    }

    function addSite() {
        const name = document.getElementById("name").value.trim();
        let url = document.getElementById("url").value.trim();

        if (!name || !url) {
            alert("Fill all fields");
            return;
        }

        if (!url.startsWith("http")) {
            url = "https://" + url;
        }

        const sites = getSites();
        sites.push({ name, url, icon: "⭐" });
        saveSites(sites);
        closeModal();
        renderSites();
    }

    renderSites();
</script>

</body>
</html>
`;

