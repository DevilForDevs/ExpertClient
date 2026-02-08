import React, { useState, useEffect } from 'react'
import {
    FlatList, Text, View, StyleSheet,
    ActivityIndicator, Pressable, NativeModules
} from 'react-native'
import { channelTabs } from '../../../utils/channelVideosParser'
import { useChannelTab } from '../../../utils/Store'
import { useNavigation } from "@react-navigation/native";
import { extractPlaylistsFromBrowse } from '../../../utils/channeplaylistidsextractor'
import PlaylistCard from './PlaylistCard'

type Props = {
    tab: channelTabs,
}
export default function PlaylistTab({ tab }: Props) {
    const { clearVideos, totalVideos, addVideo, continuation, setContinuation } = useChannelTab("playlists")
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const navigation = useNavigation<navStack>();
    const { MyNativeModule } = NativeModules;

    async function nextBroswe() {

        if (continuation == "") return;
        if (retryCount >= 3) return;
        if (isFetchingMore || !continuation) return;
        if (continuation == "") return;

        setIsFetchingMore(true);

        try {

            const jsonString = await MyNativeModule.getYtPlaylistBrowse(
                "continuation",
                continuation, tab.paras
            );
            const result = extractPlaylistsFromBrowse(JSON.parse(jsonString), tab.tabIndex)
            result.playlists.forEach(element => {
                addVideo(element);
            });
            setContinuation(result.continuationToken ?? "");

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

    async function fetchVideos() {

        const jsonString = await MyNativeModule.getYtPlaylistBrowse(
            "browseId",
            tab.browseId, tab.paras
        );
        const result = extractPlaylistsFromBrowse(JSON.parse(jsonString), tab.tabIndex)
        result.playlists.forEach(element => {
            addVideo(element);
        });
        setContinuation(result.continuationToken ?? "");
    }

    useEffect(() => {
        clearVideos();
        setContinuation("");
        fetchVideos()
    }, [tab]);


    return (
        <View>
            <FlatList
                data={totalVideos}
                keyExtractor={(_, index) => index.toString()}
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
                        <PlaylistCard item={item} onPress={() => navigation.navigate("PlaylistScreen", { playlistlink: `https://www.youtube.com/playlist?list=${item.channel}` })} />
                    ) : <></>

                }
                contentContainerStyle={{ gap: 10, marginTop: 10 }}
                onEndReached={nextBroswe}
                onEndReachedThreshold={0.5}
            />

        </View>
    )
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
})