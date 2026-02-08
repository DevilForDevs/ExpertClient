import {
    StyleSheet, Text, View, Pressable,
    ActivityIndicator, TouchableOpacity,
    NativeModules
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import IconMat from 'react-native-vector-icons/MaterialCommunityIcons';
import Video, { OnLoadData, OnProgressData } from "react-native-video";
import RightControls from './RightControls';
import BottomControls from './BottomControls';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { VideoDescription } from "../../utils/types";
type NavigationProp = RouteProp<RootStackParamList, "ShortsPlayerScreen">;
type Navstack = NativeStackNavigationProp<RootStackParamList, "BottomNav">;
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { createResolutionPlaylistsRN } from '../../utils/createResolutionPlaylists';
import RNFS from 'react-native-fs';
import { fetchHlsUrl } from '../../utils/downloadFunctions';
import { useAskFormat } from '../AskFormatContext';
import { parseShortMeta } from '../../utils/shortsMetaParser';
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { initDB } from "../../utils/dbfunctions";
import { addHistory } from '../SavedScreen/backend/dbo';
import ResolutionBottomSheet from '../VideoPlayerScreen/widgets/ResolutionBottomSheet';
import {
    SelectedVideoTrackType,
} from "react-native-video";

export default function ShortsPlayer() {
    const route = useRoute<NavigationProp>();
    const navigation = useNavigation<Navstack>();
    const { arrivedVideo } = route.params;
    const [currentVideoId, setCurrentVideoId] = useState("")
    const [mediaUrl, setMediaUrl] = useState("");
    const [paused, setPaused] = useState(false);
    const [showPlayIcon, setShowPlayIcon] = useState(false);
    const [buffering, setBuffering] = useState(false);
    const { MyNativeModule } = NativeModules
    const [currentVideoInfo, setCurrentVideoInfo] = useState<VideoDescription>();
    const [resolutions, setResolutions] = useState<string[]>([]);
    const [currentResolutionIndex, setCurrentResolutionIndex] = useState(0);
    const [unusedIds, setUnusedIds] = useState<string[]>([]);
    const [nextVideoInfo, setNextVideoInfo] = useState<VideoDescription>();
    const [prevStack, setPrevStack] = useState<VideoDescription[]>([]);
    const { openAskFormat } = useAskFormat();
    const [db, setDb] = useState<SQLiteDatabase | null>(null);
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [tracks, setTracks] = useState<VideoTrack[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<number | "auto">("auto");



    async function playVideo(hlsUrl: string, videoId: string) {

        const resolutions = await createResolutionPlaylistsRN(
            hlsUrl,
            RNFS.DocumentDirectoryPath,
            videoId
        );
        if (resolutions.length > 0) {

            let appropriateResolution: string | undefined;
            let selectedIndex = -1;

            for (let i = 0; i < resolutions.length; i++) {
                const res = resolutions[i];


                const height = Number(res.split("x")[0]);
                if (height === 480) {
                    appropriateResolution = res;
                    selectedIndex = i;
                    break;
                }
            }



            if (!appropriateResolution) {
                // fallback (max 360/480, avoid 720+)
                selectedIndex = Math.max(resolutions.length - 1, 0);
                appropriateResolution = resolutions[selectedIndex];
            }

            const localM3u8Path =
                `${RNFS.DocumentDirectoryPath}/${videoId}(${appropriateResolution}).m3u8`;

            setCurrentResolutionIndex(selectedIndex);
            setMediaUrl(hlsUrl);
            // setMediaUrl(`file://${localM3u8Path}`);
            setResolutions(resolutions);
            setCurrentVideoId(videoId);

        } else {
            console.log("fallbackHappened");
            // fallback to original manifest
            setMediaUrl(hlsUrl);
        }

        let database = db;
        if (!database) {
            database = await initDB();
            setDb(database);
        }

        await addHistory(
            database,
            videoId,
            currentVideoInfo?.title ?? "",
            currentVideoInfo?.channelName ?? "",
            currentVideoInfo?.video.duration ?? "Short"
        )

    }


    async function safeGetShortMeta(videoId: string): Promise<any | null> {
        try {
            const raw = await MyNativeModule.getShortMeta(videoId);
            return typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch (err) {
            return null;
        }
    }

    const refillUnusedIds = async (seedVideoId?: string): Promise<string[]> => {
        const raw = await MyNativeModule.getRelatedShortVideoIds(
            seedVideoId ?? currentVideoId
        );

        let ids: string[] = [];

        try {
            ids = typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch {
            if (typeof raw === "string" && raw.length === 11) ids = [raw];
        }

        return ids.filter(id => typeof id === "string" && id.length === 11);
    };

    async function playPrev() {
        if (prevStack.length === 0) {
            console.warn("No previous video");
            return;
        }

        const last = prevStack[prevStack.length - 1];
        const remaining = prevStack.slice(0, -1);

        // push current back into "next" slot
        setNextVideoInfo(currentVideoInfo);

        setPrevStack(remaining);
        setCurrentVideoInfo(last);

        await playVideo(
            last.hlsUrl ?? "",
            last.video.videoId
        );
    }


    async function playNextVideo() {
        if (!nextVideoInfo || !nextVideoInfo.hlsUrl) {
            console.warn("Next video not ready yet");
            return;
        }

        setPrevStack(prev => [...prev, currentVideoInfo!]);
        setCurrentVideoInfo(nextVideoInfo);

        await playVideo(
            nextVideoInfo.hlsUrl,
            nextVideoInfo.video.videoId
        );

        preloadNextFromQueue(nextVideoInfo.video.videoId);
    }


    async function preloadNextFromQueue(baseVideoId: string) {
        let queue = [...unusedIds];

        if (queue.length === 0) {
            queue = await refillUnusedIds(baseVideoId);
        }

        while (queue.length > 0) {
            const id = queue.shift()!; // remove immediately

            const result = await safeGetShortMeta(id);
            const meta = parseShortMeta(result);

            if (!meta) continue;

            const hlsUrl = await fetchHlsUrl(id);
            if (!hlsUrl) continue;

            setNextVideoInfo({
                title: meta.title ?? "",
                views: 0,
                uploaded: "unknown",
                hashTags: "",
                likes: meta.likes ?? "",
                dislikes: "",
                subscriber: "",
                commentsCount: meta.comments ?? "",
                channelName: meta.channelName ?? "",
                channelPhoto: meta.channelThumbnail ?? "",
                video: {
                    type: "video",
                    videoId: id,
                    title: meta.title ?? "",
                    views: "",
                },
                hlsUrl,
                channelId: meta.canonicalUrl
            });

            setUnusedIds(queue); // ✅ clean queue
            console.log("next video ready");
            return;
        }

        setUnusedIds([]);
    }



    const swipeGesture = Gesture.Pan()
        .activeOffsetY([-20, 20])
        .failOffsetX([-20, 20])
        .onEnd((e) => {
            if (e.translationY < -60) {
                if (!buffering) {
                    playNextVideo()
                }
            } else if (e.translationY > 60) {
                playPrev()
            }
        });

    async function loadInitial() {


        const videoId = arrivedVideo.videoId;
        const meta = await safeGetShortMeta(videoId);
        const result = parseShortMeta(meta);
        if (!meta) return;
        const hlsUrl = await fetchHlsUrl(videoId);

        if (!hlsUrl) console.log("streamingData not found");
        setCurrentVideoInfo({
            title: result.title,
            views: 0,
            uploaded: "unknown",
            hashTags: "",
            likes: result.likes,
            dislikes: "",
            subscriber: "",
            commentsCount: result.comments,
            channelName: result.channelName,
            channelPhoto: result.channelThumbnail,
            video: {
                type: "video",
                videoId,
                title: result.title,
                views: "",
            },
            hlsUrl: hlsUrl ?? "",
            channelId: result.canonicalUrl
        });

        playVideo(hlsUrl ?? "", videoId);





        const ids = await refillUnusedIds(videoId);
        const remaining: string[] = [];

        for (const id of ids) {
            console.log("loading next", id);

            const jsonString = await safeGetShortMeta(id);
            const nextMeta = parseShortMeta(jsonString);
            if (!nextMeta) {
                console.log(`Dropping videoId ${id}`);
                continue; // ❌ removed
            }

            const nextHlsUrl = await fetchHlsUrl(id);
            if (!nextHlsUrl) {
                console.log(`Dropping videoId ${id}`);
                continue; // ❌ removed
            }

            setNextVideoInfo({
                title: nextMeta.title ?? "",
                views: 0,
                uploaded: "unknown",
                hashTags: "",
                likes: nextMeta.likes ?? "",
                dislikes: "",
                subscriber: "",
                commentsCount: nextMeta.comments ?? "",
                channelName: nextMeta.channelName ?? "",
                channelPhoto: nextMeta.channelThumbnail ?? "",
                video: {
                    type: "video",
                    videoId: id,
                    title: nextMeta.title ?? "",
                    views: "",
                },
                hlsUrl: nextHlsUrl,
                channelId: nextMeta.canonicalUrl
            });

            console.log("loaded next video");

            // everything AFTER this stays
            const index = ids.indexOf(id);
            remaining.push(...ids.slice(index + 1));
            break;
        }

        setUnusedIds(remaining);
    }



    useEffect(() => {
        setCurrentVideoId(arrivedVideo.videoId);
        setBuffering(true);
        loadInitial()
    }, []);

    const togglePlayPause = () => {
        setPaused(prev => !prev);
        setShowPlayIcon(true);
        setTimeout(() => setShowPlayIcon(false), 800);
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


    function onLoad(data: OnLoadData) {

        if (!data.videoTracks?.length) return;

        const naturalHeight = data.naturalSize?.height;
        const naturalWidth = data.naturalSize?.width;

        const unique = new Map<number, VideoTrack>();

        data.videoTracks.forEach((t) => {
            if (!t.height) return;

            const existing = unique.get(t.height);

            // mark as active if this track matches naturalSize
            const isActive =
                t.height === naturalHeight && t.width === naturalWidth;

            const isBetterBitrate =
                !existing || (t.bitrate ?? 0) > (existing.bitrate ?? 0);

            if (isBetterBitrate) {
                unique.set(t.height, {
                    width: t.width,
                    height: t.height,
                    bitrate: t.bitrate,
                    trakIndex: t.index,
                    selected: isActive,
                });
            } else if (isActive && existing) {
                existing.selected = true;
            }
        });

        const tracks: VideoTrack[] = Array.from(unique.values()).sort(
            (a, b) => (a.height ?? 0) - (b.height ?? 0)
        );
        setTracks(tracks);
    }





    return (
        <SafeAreaView style={styles.root}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name='arrow-back' size={28} color="white" />
                </TouchableOpacity>
                <IconMat name='camera-outline' size={28} color="white" />
            </View>

            <GestureDetector gesture={swipeGesture}>
                <View style={styles.videoContainer}>
                    <Video
                        source={{ uri: mediaUrl }}
                        poster={`https://i.ytimg.com/vi/${currentVideoId}/hqdefault.jpg`}
                        posterResizeMode="cover"
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        paused={paused}
                        repeat={true}
                        onBuffer={({ isBuffering }) => setBuffering(isBuffering)}
                        onLoadStart={() => setBuffering(true)}
                        onLoad={onLoad}
                        onError={(e) => {
                            const error = e?.error;
                            console.log(error);

                            //24003
                            const isBadHttp =
                                error?.errorCode === "22004" ||
                                error?.errorString?.includes("BAD_HTTP_STATUS");

                            if (isBadHttp) {
                                playNextVideo()
                            }
                        }}
                        selectedVideoTrack={
                            selectedTrack === "auto" || selectedTrack == null
                                ? { type: SelectedVideoTrackType.AUTO }
                                : {
                                    type: SelectedVideoTrackType.INDEX,
                                    value: selectedTrack,
                                }
                        }
                    />

                    <Pressable
                        onPress={togglePlayPause}
                        style={StyleSheet.absoluteFill} // covers full video
                    >
                        {showPlayIcon && (
                            <View style={styles.centerIcon}>
                                <Icon
                                    name={paused ? "play-circle-outline" : "pause-circle-outline"}
                                    size={80}
                                    color="white"
                                />
                            </View>
                        )}
                    </Pressable>

                    {buffering && (
                        <View style={styles.centerIcon}>
                            <ActivityIndicator size="large" color="red" />
                        </View>
                    )}

                    <RightControls
                        likes={currentVideoInfo?.likes ?? "No likes"}
                        commentCount={currentVideoInfo?.commentsCount ?? ""}
                        onDownload={() => openAskFormat(currentVideoInfo?.video!!, () => {

                        })}
                        onMenuPress={handleMoreVert}
                    />

                    <BottomControls
                        channelName={currentVideoInfo?.channelName ?? ""}
                        channelThumbnail={currentVideoInfo?.channelPhoto ?? ""}
                        title={currentVideoInfo?.title ?? "Loading..."}
                        onChannePress={() => navigation.navigate("ChannelScreen", { channelUrl: currentVideoInfo?.channelId ?? "" })}
                    />

                </View>
            </GestureDetector>

            <ResolutionBottomSheet
                visible={showBottomSheet}
                resolutions={tracks}
                onSelect={changeResolution}
                onClose={() => setShowBottomSheet(false)}
            />
        </SafeAreaView>
    )
}
const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#0A0A0A",
    },
    topBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#0A0A0A",
        paddingVertical: 10,
        paddingHorizontal: 10
    },
    videoContainer: {
        position: 'relative',
        backgroundColor: 'black',
        height: "90%"
    },
    centerIcon: {
        position: 'absolute',
        top: '45%',
        left: '45%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: '#00000066',
    },
    bottomSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        padding: 10,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },

    swithResolution: {
        backgroundColor: "white",
        padding: 7,
        borderRadius: 7
    }
});
