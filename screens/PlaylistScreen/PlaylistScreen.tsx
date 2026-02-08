import {
    StyleSheet,
    View,
    ActivityIndicator, FlatList,
    Text, Pressable, NativeModules
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import PlaylistInfo from './widgets/PlaylistInfo'
import PlaylistItemView from './widgets/PlaylistItemView'
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { extractPlaylistData, PlaylistMetadata } from '../../utils/playlistParser'
import { useVideoStoreForPlaylist } from '../../utils/Store'
import { useAskFormat } from '../AskFormatContext'

type NavigationProp = RouteProp<
    RootStackParamList,
    "PlaylistScreen"
>;

export default function PlaylistScreen() {
    const route = useRoute<NavigationProp>();
    const { playlistlink } = route.params;
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [metaData, setMetaData] = useState<PlaylistMetadata>();
    const { MyNativeModule } = NativeModules;
    const { openAskFormat } = useAskFormat();
    const navigation = useNavigation<navStack>();


    const { visitorData,
        setVisitorData,
        addVideo,
        clearVideos,
        continuation,
        setContinuation,
        totalVideos
    } = useVideoStoreForPlaylist();

    function handleRetry() {
        setRetryCount(0);
        nextBrowse();
    }

    async function nextBrowse() {
        if (!continuation) return;
        if (isFetchingMore) return;
        if (retryCount >= 3) return;
        if (continuation == "") return;

        setIsFetchingMore(true);

        try {
            const jsonString = await MyNativeModule.getYtPlaylistBrowse(
                "continuation",
                continuation, null
            );
            const result = extractPlaylistData(JSON.parse(jsonString));
            result.videos.forEach(element => {
                addVideo(element);
            });
            setContinuation(result.continuationToken ?? "")

        } catch (e) {
            console.error("Watch continuation failed", e);
            setRetryCount(r => r + 1);
        } finally {
            setIsFetchingMore(false);
        }
    }

    const extractPlaylistId = (url: string): string | undefined => {
        const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
        return match ? match[1] : undefined;
    };


    async function fetchPlaylistInfo() {
        const playlistId = extractPlaylistId(playlistlink);
        const browseId = `VL${playlistId}`;
        const jsonString = await MyNativeModule.getYtPlaylistBrowse(
            "browseId",
            browseId, null
        );
        const result = extractPlaylistData(JSON.parse(jsonString));
        result.videos.forEach(element => {
            addVideo(element);
        });
        setContinuation(result.continuationToken ?? "")
        setMetaData(result.metadata);
    }

    useEffect(() => {
        if (playlistlink) {
            fetchPlaylistInfo();
        }
    }, [playlistlink]);

    async function onClickPlay() {
        const firstVideo = totalVideos.find(el => el.type === "video");

        if (!firstVideo) return;

        navigation.navigate("VideoPlayerScreen", {
            arrivedVideo: firstVideo,
            playlistId: extractPlaylistId(playlistlink),
        });
    }


    return (
        <SafeAreaView style={styles.root}>
            {(!metaData || totalVideos.length === 0) ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <>
                    <FlatList
                        data={totalVideos}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={({ item, index }) => {
                            if (item.type === "video") {
                                return <PlaylistItemView video={item} onItemClick={() => navigation.navigate("VideoPlayerScreen", { arrivedVideo: item, playlistId: undefined })} onMenuClick={() => openAskFormat(item)} />;
                            } else {
                                return <View />;
                            }
                        }}
                        ListHeaderComponent={
                            <PlaylistInfo info={metaData} onClickPlay={onClickPlay} onChannelClick={() => navigation.navigate("ChannelScreen", { channelUrl: metaData.channelId })} />
                        }

                        contentContainerStyle={{ gap: 10 }}
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
                        onEndReached={nextBrowse}
                        onEndReachedThreshold={0.5}
                    />
                </>
            )}
        </SafeAreaView>
    )

}

const styles = StyleSheet.create({
    root: {
        paddingHorizontal: 10
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