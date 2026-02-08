import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, BackHandler, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import { parseYTInitialData } from "../../utils/parseYTInitialData";
import combinedJsCode from "../../utils/rawJs";
import { useVideoStore } from "../../utils/Store";
import { Video } from "../../utils/types";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";



type NavigationProp = RouteProp<
  RootStackParamList,
  "BrowserScreen"
>;

export default function BrowserScreen() {
  const navigation = useNavigation<navStack>();
  const webViewRef = useRef<WebView>(null);
  const chunkBuffers = useRef<Record<string, string[]>>({});
  const route = useRoute<NavigationProp>();
  const { name } = route.params;
  const [canGoBack, setCanGoBack] = useState(false);



  const {
    addVideo,
    setContinuation,
    setVisitorData,
    totalVideos

  } = useVideoStore();


  useEffect(() => {
    if (Platform.OS !== "android") return;

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (canGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true; // ⛔ prevent screen pop
        }
        return false; // allow navigation stack to handle
      }
    );

    return () => backHandler.remove();
  }, [canGoBack]);



  function processVideoGroup(videoGroup: any, isInitial = false) {
    const freshShorts: Video[] = [];

    videoGroup.videos.forEach((element: any) => {
      if (!element.video_id) return;
      addVideo({
        type: "video",
        videoId: element.video_id,
        title: element.title ?? "",
        duration: element.duration ?? "",
        views: element.views ?? "null",
        channel: element.channel_photo ?? "",
        publishedOn: element.publishedOn,
        channelUrl: element.channel_url
      });
    });

    videoGroup.shorts.forEach((element: any) => {
      if (!element.video_id) return;

      freshShorts.push({
        type: "video",
        videoId: element.video_id,
        title: element.title ?? "",
        views: element.views ?? "null",
      });
    });

    if (freshShorts.length > 0) {
      addVideo({
        type: "shorts",
        videos: freshShorts,
        videoId: freshShorts[0].videoId,
      });
    }
    setContinuation(videoGroup.continuationTokens?.[0] ?? "");
    console.log("browserscreen")

    if (totalVideos.length != 0) {
      navigation.navigate("BottomNav");
    }

  }

  async function onMessage(event: any) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      const { type } = msg;

      // 1️⃣ Chunk handling
      if (msg.chunk !== undefined) {
        chunkBuffers.current[type] ??= [];
        chunkBuffers.current[type][msg.index] = msg.chunk;
        return;
      }

      // 2️⃣ Chunk done
      if (type?.endsWith("_DONE")) {
        const baseType = type.replace("_DONE", "");
        const chunks = chunkBuffers.current[baseType];
        if (!chunks) return;

        delete chunkBuffers.current[baseType];
        const payload = JSON.parse(chunks.join(""));

        if (baseType === "YT_INITIAL_DATA") {
          const videoGroup = parseYTInitialData(payload.data);
          setVisitorData(payload.data.responseContext.webResponseContextExtensionData.ytConfigData.visitorData);
          processVideoGroup(videoGroup, true);
        }
        return;
      }
    } catch (err) {
      console.warn("WebView message error:", err);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ flex: 1 }}>
        <WebView
          ref={webViewRef}
          source={{ uri: "https://www.youtube.com" }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          startInLoadingState
          allowsFullscreenVideo
          scalesPageToFit
          injectedJavaScript={combinedJsCode}
          onMessage={onMessage}
          onNavigationStateChange={(navState) =>
            setCanGoBack(navState.canGoBack)
          }
          style={{ flex: 1 }}
        />

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});
