import React, { useEffect, useRef, useState } from "react";
import {
    StyleSheet,
    View,
    ActivityIndicator,
    StatusBar, FlatList, NativeModules,
    Text, Pressable
} from "react-native";
import { BackHandler, Platform } from "react-native";

import VideoItemView from "../HomeScreen/widgets/VideoItemView/VideoItemView";
import ShortsHeader from "../HomeScreen/widgets/ShortsHeader/ShortsHeader";
import ShortsItemView from "../HomeScreen/widgets/ShortsItemView/ShortsItemView";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { parseWatchHtml } from "../../utils/watchHtmlParser";
import { getIosPlayerResponse } from "../../utils/EndPoints";
import VideoDetails from "./widgets/VideoDetails";
import { Video, VideoDescription } from "../../utils/types";
import ResolutionBottomSheet from "./widgets/ResolutionBottomSheet";
import { useAskFormat } from "../AskFormatContext";
import { useVideoStoreForWatch } from "../../utils/Store";
import { extractPlaylistData } from "../../utils/playlistParser";
import { addHistory } from "../SavedScreen/backend/dbo";
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { initDB } from "../../utils/dbfunctions";
import Player from "./widgets/Player";
import { useSafeAreaInsets } from 'react-native-safe-area-context';




type NavigationProp = RouteProp<
    RootStackParamList,
    "VideoPlayerScreen"
>;

const formatHMS = (seconds?: string | number): string => {
    const s = Number(seconds) || 0;

    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60)
        .toString()
        .padStart(2, "0");
    const secs = Math.floor(s % 60)
        .toString()
        .padStart(2, "0");

    return hrs > 0
        ? `${hrs}:${mins}:${secs}`
        : `${mins}:${secs}`;
};



export default function VideoPlayerScreen() {
    const insets = useSafeAreaInsets();
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const { visitorData: watchVisitorData,
        setVisitorData: setWvisid,
        addVideo,
        clearVideos,
        continuation,
        setContinuation,
        totalVideos
    } = useVideoStoreForWatch();



    const route = useRoute<NavigationProp>();
    const { arrivedVideo, playlistId } = route.params;
    const navigation = useNavigation<navStack>();
    const { MyNativeModule } = NativeModules;
    const [currentVideo, setCurrentVideo] = useState<VideoDescription>();
    const [mediaUrl, setMediaUrl] = useState("")
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [showFlatList, setFlatList] = useState(true);
    const [savedPositions, setSavedPositions] = useState<Record<string, number>>({});
    const seekTo = savedPositions[currentVideo?.video.videoId ?? ""] ?? 0;
    const { openAskFormat } = useAskFormat();
    const historyRef = useRef<Video[]>([]);
    const isGoingBackRef = useRef(false);
    const backLockRef = useRef(false);
    const currentVideoRef = useRef<Video | null>(null);
    const [autoplayEnabled, setAutoplayEnabled] = useState(true);
    const listRef = useRef<FlatList>(null);
    const [endedAsScreen, setEndedAsScreen] = useState(false);
    const [db, setDb] = useState<SQLiteDatabase | null>(null);
    const [tracks, setTracks] = useState<VideoTrack[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<number | "auto">("auto");





    useEffect(() => {
        const onBackPress = () => {
            if (backLockRef.current) {
                return true; // swallow extra presses
            }

            const history = historyRef.current;
            console.log("BACK PRESS BEFORE POP:", history.length);

            if (history.length === 0) {
                return false;
            }

            backLockRef.current = true; // 🔒 LOCK

            const lastVideo = history[history.length - 1];
            historyRef.current = history.slice(0, -1);

            console.log("AFTER POP:", historyRef.current.length);

            isGoingBackRef.current = true;

            loadData(lastVideo).finally(() => {
                // 🔓 UNLOCK after async completes
                backLockRef.current = false;
            });

            return true;
        };

        const sub = BackHandler.addEventListener(
            "hardwareBackPress",
            onBackPress
        );

        return () => sub.remove();
    }, []);


    async function loadPlaylist() {
        const browseId = `VL${playlistId}`;
        const jsonString = await MyNativeModule.getYtPlaylistBrowse(
            "browseId",
            browseId,
            null
        );

        const result = extractPlaylistData(JSON.parse(jsonString));
        result.videos.forEach(element => {
            addVideo(element);
        });
        setContinuation(result.continuationToken ?? "")
    }

    async function loadData(mvideo: Video) {

        let database = db;
        if (!database) {
            database = await initDB();
            setDb(database);
        }

        if (!isGoingBackRef.current && currentVideoRef.current) {
            historyRef.current.push(currentVideoRef.current);
        }

        isGoingBackRef.current = false;
        setCurrentVideo(undefined);
        if (playlistId == undefined) {
            clearVideos()
        }
        try {
            const playerResponse = await getIosPlayerResponse(mvideo.videoId);
            const streamingData = playerResponse.streamingData
            const videoDetails = playerResponse.videoDetails
            setMediaUrl(streamingData.hlsManifestUrl);
            try {

                const jsonString = await MyNativeModule.getYtInitialData(
                    'https://www.youtube.com/watch?v=' + mvideo.videoId
                )
                const ytInitialData = JSON.parse(jsonString);
                const parseResult = parseWatchHtml(ytInitialData)

                if (playlistId == undefined) {
                    setWvisid(parseResult.visitorData)
                    setContinuation(parseResult.continuation ?? "")
                    parseResult.items.forEach(element => {
                        addVideo(element)
                    });
                }

                const videoDes2: VideoDescription = {
                    title: videoDetails.title,
                    uploaded: mvideo.publishedOn ? mvideo.publishedOn : "",
                    hashTags: Array.isArray(videoDetails.keywords)
                        ? videoDetails.keywords.join(" ")
                        : "",
                    dislikes: "Dislikes",
                    views: Number(videoDetails.viewCount),
                    subscriber: parseResult.channelinfo.subscriberCount,
                    likes: parseResult.channelinfo.likes,
                    commentsCount: parseResult.channelinfo.commentsCount ?? "",
                    channelName: parseResult.channelinfo.channelName,
                    channelPhoto: parseResult.channelinfo.channelPhoto,
                    video: mvideo,
                    channelId: videoDetails.channelId
                }

                setCurrentVideo(videoDes2);
                currentVideoRef.current = mvideo;

                await addHistory(
                    database,
                    mvideo.videoId,
                    videoDetails.title,
                    parseResult.channelinfo.channelName ?? "",
                    formatHMS(videoDetails.lengthSeconds)
                )


            } catch (e) {
                console.log(e);
            }

        } catch (e) {
            console.error(e);
        }
    }
    useEffect(() => {
        loadData(arrivedVideo);
        if (playlistId != undefined) {
            loadPlaylist()
        }

    }, []);

    function handleRetry() {
        setRetryCount(0);
        nextBrowse();
    }

    function changeResolution(res: VideoTrack) {
        const index = res.trakIndex ?? 0;

        // native player
        setSelectedTrack(index);

        // update local track state
        setTracks(prev =>
            prev.map(t => ({
                ...t,
                selected: t.trakIndex === index,
            }))
        );

        setShowBottomSheet(false);
    }


    function handleMoreVert() {
        if (tracks.length === 0) return;
        setShowBottomSheet(true);
    }


    const handleThreeDotClick = async (item: Video) => {
        openAskFormat(item, () => {

        });

    };

    const toggleFlatList = () => {

        if (showFlatList) {
            setFlatList(false)
        } else {
            setFlatList(true)
        }

    }
    function handleProgressSave(videoId: string, position: number) {
        setSavedPositions(prev => ({
            ...prev,
            [videoId]: position,
        }));

    }

    async function nextBrowse() {
        if (!currentVideo?.video?.videoId) return;
        if (!continuation) return;
        if (isFetchingMore) return;
        if (retryCount >= 3) return;

        setIsFetchingMore(true);

        try {

            if (playlistId == undefined) {
                const raw = await MyNativeModule.fetchFeed(
                    currentVideoRef.current?.videoId ?? null,
                    continuation,
                    watchVisitorData
                );

                const ytInitialData = JSON.parse(raw);
                const parseResult = parseWatchHtml(ytInitialData);

                // 🔹 append items
                for (const item of parseResult.items) {
                    addVideo(item);
                }

                // 🔹 update continuation
                setContinuation(parseResult.continuation ?? "");
            } else {
                const jsonString = await MyNativeModule.getYtPlaylistBrowse(
                    "continuation",
                    continuation, null
                );
                const result = extractPlaylistData(JSON.parse(jsonString));
                result.videos.forEach(element => {
                    addVideo(element);
                });
                setContinuation(result.continuationToken ?? "")
            }

        } catch (e) {
            console.error("Watch continuation failed", e);
            setRetryCount(r => r + 1);
        } finally {
            setIsFetchingMore(false);
        }
    }




    function playBackfinished() {

        if (!autoplayEnabled) return;

        // find index of current video
        const currentIndex = totalVideos.findIndex(
            (v) => v.type === "video" && v.videoId === currentVideo?.video.videoId
        );

        // get next video
        const nextVideo = totalVideos.slice(currentIndex + 1).find(v => v.type === "video");

        if (!nextVideo) {
            console.log("No next video to autoplay");
            return;
        }

        // load the next video
        loadData(nextVideo);
    }


    return (
        <View
            style={{
                flex: 1,
                paddingTop: showFlatList
                    ? Platform.OS === 'android'
                        ? StatusBar.currentHeight
                        : insets.top
                    : 0,
                paddingBottom: insets.bottom, // ✅ handles nav buttons
            }}
        >
            <StatusBar hidden={!showFlatList} />
            <Player
                startAsScreen={endedAsScreen}
                url={mediaUrl}
                videoId={currentVideo?.video.videoId ?? ""}
                toggleFlatList={toggleFlatList}
                showMenu={handleMoreVert}
                onProgressSave={handleProgressSave}
                seekTo={seekTo}
                key={currentVideo?.video.videoId}   // ✅ stable
                distroyScreen={() => navigation.pop()}
                onToggle={(val) => setAutoplayEnabled(val)}
                videoEnded={(endedAsScreen) => {
                    setEndedAsScreen(endedAsScreen);
                    playBackfinished();
                }}
                onTracks={setTracks}
                selectedTrack={selectedTrack}
            />

            {
                showFlatList ? <View>
                    <View>
                        <FlatList
                            ref={listRef}
                            data={totalVideos}
                            keyExtractor={(_, index) => index.toString()}
                            renderItem={({ item, index }) => {
                                if (item.type === "video") {
                                    return (
                                        <VideoItemView
                                            item={item}
                                            progress={0}
                                            onItemPress={() => loadData(item)}
                                            onDownload={() => () => openAskFormat(item, () => {

                                            })}
                                            onChannelClick={() => navigation.navigate("ChannelScreen", { channelUrl: item.channelUrl })}
                                        />
                                    );
                                } else {
                                    return (
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
                                                                arrivedVideo: short
                                                            })
                                                        }
                                                    />
                                                )}
                                                showsHorizontalScrollIndicator={false}
                                                contentContainerStyle={styles.shortsContainer}
                                            />
                                        </View>
                                    );
                                }
                            }}
                            contentContainerStyle={{ gap: 10, paddingBottom: 250, }}
                            ListHeaderComponent={
                                currentVideo ? (
                                    <VideoDetails
                                        videoDes={currentVideo}
                                        onDownloadPress={() =>
                                            handleThreeDotClick(currentVideo.video)
                                        }
                                        onChannelClick={() => navigation.navigate("ChannelScreen", { channelUrl: currentVideo.channelId ?? "" })}
                                    />
                                ) : (
                                    <ActivityIndicator size="large" color="red" style={{ margin: 20 }} />
                                )
                            }
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
                    </View>
                    <ResolutionBottomSheet
                        visible={showBottomSheet}
                        resolutions={tracks}
                        onSelect={changeResolution}
                        onClose={() => setShowBottomSheet(false)}
                    />
                </View> : <View />
            }

        </View>


    );

}

const styles = StyleSheet.create({
    shortsContainer: {
        gap: 10,
    },
    shortParentContainer: {
        paddingLeft: 20,
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



// onDownload={() => openAskFormat(item, () => {

// })}


