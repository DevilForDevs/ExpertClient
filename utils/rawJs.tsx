const combinedJsCode = `
(function () {
  const CHUNK_SIZE = 50000;
  let sentForUrl = new Set();

  function waitForRNWebView(callback) {
    if (window.ReactNativeWebView) {
      callback();
      return;
    }
    setTimeout(() => waitForRNWebView(callback), 100);
  }

  function postInChunks(type, payload) {
    try {
      const jsonString = JSON.stringify(payload);
      const total = Math.ceil(jsonString.length / CHUNK_SIZE);

      for (let i = 0; i < total; i++) {
        const chunk = jsonString.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type,
            index: i,
            total,
            chunk,
            url: window.location.href,
          })
        );
      }

      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: type + "_DONE",
          total,
          url: window.location.href,
        })
      );
    } catch (error) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "ERROR",
          error: error.message,
        })
      );
    }
  }

  function trySendYtInitialData() {
    try {
      const url = window.location.href;
      if (sentForUrl.has(url)) return;

      const ytData =
        window.ytInitialData ||
        window.ytInitialPlayerResponse ||
        window.ytplayer;

      if (!ytData) {
        setTimeout(trySendYtInitialData, 500);
        return;
      }

      sentForUrl.add(url);

      postInChunks("YT_INITIAL_DATA", {
        data: ytData,
        url,
        title: document.title,
      });
    } catch (err) {
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: "YT_DATA_ERROR",
          error: err.message,
        })
      );
    }
  }

  function setupFetchInterceptor() {
    const originalFetch = window.fetch;

    function wrappedFetch(input, init) {
      const req = input instanceof Request ? input : new Request(input, init);

      return originalFetch(req).then((response) => {
        try {
          const ct = response.headers.get("content-type") || "";
          if (
            ct.includes("application/json") &&
            response.url.includes("/youtubei/v1/")
          ) {
            response.clone().json().then((data) => {
              const jsonStr = JSON.stringify(data);
              if (jsonStr.length > CHUNK_SIZE) {
                postInChunks("YT_FETCH_JSON", { url: response.url, data });
              } else {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({
                    type: "YT_FETCH_JSON",
                    url: response.url,
                    data,
                  })
                );
              }
            }).catch(() => {});
          }
        } catch (_) {}

        return response;
      });
    }

    wrappedFetch.toString = () => originalFetch.toString();
    window.fetch = wrappedFetch;
  }

  waitForRNWebView(() => {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: "SCRIPT_LOADED" })
    );

    setupFetchInterceptor();
    trySendYtInitialData();

    let lastUrl = window.location.href;
    new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        setTimeout(trySendYtInitialData, 1000);
      }
    }).observe(document.body, { childList: true, subtree: true });
  });
})();
`;

export default combinedJsCode;