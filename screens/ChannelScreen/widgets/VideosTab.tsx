import React, { useState, useEffect } from 'react'
import {
    FlatList, Text, View, StyleSheet,
    ActivityIndicator, Pressable, NativeModules
} from 'react-native'
import { channelTabs, parseVideosTab } from '../../../utils/channelVideosParser'
import { useChannelTab } from '../../../utils/Store'
import { useAskFormat } from '../../AskFormatContext'
import VideoItemView from '../../HomeScreen/widgets/VideoItemView/VideoItemView'
import ShortsItemView from '../../HomeScreen/widgets/ShortsItemView/ShortsItemView'
import ShortsHeader from '../../HomeScreen/widgets/ShortsHeader/ShortsHeader'
import { useNavigation } from "@react-navigation/native";
type Props = {
    tab: channelTabs,
}

export default function VideosTab({ tab }: Props) {
    const { totalVideos, addVideo, continuation, setContinuation, clearVideos } = useChannelTab("videos")
    const { openAskFormat } = useAskFormat();
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const navigation = useNavigation<navStack>();
    const { MyNativeModule } = NativeModules;
    const [avtar, setAvtar] = useState("");

    async function nextBroswe() {
        if (continuation == "") return;
        if (retryCount >= 3 || isFetchingMore || !continuation) return;
        setIsFetchingMore(true);

        try {
            const jsonString = await MyNativeModule.getYtPlaylistBrowse(
                "continuation",
                continuation, tab.paras
            );
            const result = parseVideosTab(JSON.parse(jsonString), tab.tabIndex);
            result.videos.forEach(element => {
                addVideo({
                    ...element,
                    channel: avtar,
                });
            });

            setContinuation(result.continuation ?? "");
        } catch (e) {
            console.error("Continuation fetch failed", e);
            setRetryCount(r => r + 1);
        } finally {
            setIsFetchingMore(false);
        }
    }

    function handleRetry() {
        setRetryCount(0);
        nextBroswe();
    }

    // Show full-screen loader if there are no videos yet
    if (totalVideos.length === 0 && isFetchingMore) {
        return (
            <View style={styles.centerScreen}>
                <ActivityIndicator size="large" />
            </View>
        )
    }

    async function fetchVideos() {

        const jsonString = await MyNativeModule.getYtPlaylistBrowse(
            "browseId",
            tab.browseId, tab.paras
        );
        const result = parseVideosTab(JSON.parse(jsonString), tab.tabIndex);
        result.videos.forEach(element => {
            addVideo(element);
            if (avtar == "") {
                setAvtar(element.channel ?? "");
            }
        });
        setContinuation(result.continuation ?? "");
    }

    useEffect(() => {
        clearVideos();
        setContinuation("");
        fetchVideos();
    }, [tab]);

    return (
        <View style={{ flex: 1 }}>
            <FlatList
                data={totalVideos}
                keyExtractor={(_, index) => index.toString()}
                ListFooterComponent={
                    retryCount >= 3 ? (
                        <View style={styles.centerState}>
                            <Text style={styles.retryText}>Something went wrong</Text>
                            <Pressable style={styles.retryBtn} onPress={handleRetry}>
                                <Text style={styles.retryBtnText}>Retry</Text>
                            </Pressable>
                        </View>
                    ) : isFetchingMore ? (
                        <ActivityIndicator size="large" style={{ marginVertical: 20 }} />
                    ) : null
                }
                renderItem={({ item }) =>
                    item.type === "video" ? (
                        <VideoItemView
                            item={item}
                            progress={0}
                            onChannelClick={() => console.log("alreadyinside")}
                            onItemPress={() =>
                                navigation.navigate("VideoPlayerScreen", { arrivedVideo: item, playlistId: undefined })
                            }
                            onDownload={() => openAskFormat(item)}
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
    )
}

const styles = StyleSheet.create({
    centerScreen: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
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
        backgroundColor: "#ff0000",
    },
    retryBtnText: {
        color: "#fff",
        fontWeight: "600",
    },
})

