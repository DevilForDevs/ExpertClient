import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList, NativeModules, Pressable } from "react-native";
import { useVideoStore } from "../../utils/Store";
import { Video, } from "../../utils/types";
import TopBar from "./widgets/TopBar/TopBar";
import { useNavigation } from "@react-navigation/native";
import Menu from "./widgets/TopBar/widgets/Menu";
import ShortsHeader from "./widgets/ShortsHeader/ShortsHeader";
import VideoItemView from "./widgets/VideoItemView/VideoItemView";
import ShortsItemView from "./widgets/ShortsItemView/ShortsItemView";
import { useAskFormat } from "../AskFormatContext";
import { parseYTInitialData } from "../../utils/parseYTInitialData";
import { ActivityIndicator } from "react-native";
export default function HomeScreen() {

  const navigation = useNavigation<navStack>();
  const { MyNativeModule } = NativeModules;
  const {
    totalVideos,
    addVideo,
    visitorData,
    continuation,
    setContinuation,
  } = useVideoStore();
  const { openAskFormat } = useAskFormat();
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [retryCount, setRetryCount] = useState(0);


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

  }

  function handleRetry() {
    setRetryCount(0);
    nextBroswe();
  }

  async function nextBroswe() {
    console.log("fetchingnext");
    if (retryCount >= 3) return;
    if (isFetchingMore || !continuation) return;
    if (continuation == "") return;

    setIsFetchingMore(true);

    try {
      const raw = await MyNativeModule.fetchFeed(null,
        continuation,
        visitorData
      );

      const videoGroup = parseYTInitialData(JSON.parse(raw));
      processVideoGroup(videoGroup);
    } catch (e) {
      console.error("Continuation fetch failed", e);
      setRetryCount(r => r + 1);
    } finally {
      setIsFetchingMore(false);
    }
  }



  return (
    <View style={styles.root}>
      <TopBar onLensPress={() => navigation.navigate("SearchScreen")} />
      <FlatList
        data={totalVideos}
        keyExtractor={(_, index) => index.toString()}
        ListHeaderComponent={<Menu />}
        ListFooterComponent={
          isFetchingMore ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" />
            </View>
          ) : retryCount >= 3 ? (
            <View style={styles.centerState}>
              <Text style={styles.retryText}>Something went wrong</Text>

              <Pressable style={styles.retryBtn} onPress={handleRetry}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : null
        }
        renderItem={({ item }) =>
          item.type === "video" ? (
            <VideoItemView onChannelClick={() => navigation.navigate("ChannelScreen", { channelUrl: item.channelUrl ?? "" })}
              item={item}
              progress={0}
              onItemPress={() =>
                navigation.navigate("VideoPlayerScreen", { arrivedVideo: item, playlistId: undefined })
              }
              onDownload={() => () => openAskFormat(item, () => {

              })}
            />
          ) : (
            <View style={styles.shortParentContainer}>
              <ShortsHeader />
              <FlatList
                data={item.videos}
                horizontal
                keyExtractor={(short) => short.videoId}
                renderItem={({ item: short }) => (
                  <ShortsItemView
                    item={short}
                    onItemPress={() =>
                      navigation.navigate("ShortsPlayerScreen", {
                        arrivedVideo: short,
                      })
                    }
                  />
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.shortsContainer}
              />
            </View>
          )
        }
        contentContainerStyle={{ gap: 10, marginTop: 10 }}
        onEndReached={nextBroswe}
        onEndReachedThreshold={0.5}
      />


    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    marginTop: 50,
  },
  shortParentContainer: {
    paddingLeft: 20,
  },
  shortsContainer: {
    gap: 10,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },

  retryText: {
    color: "#999",
    marginBottom: 12,
    fontSize: 14,
  },

  retryBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#ff0000", // YouTube red 😉
  },

  retryBtnText: {
    color: "#fff",
    fontWeight: "600",
  },

});
