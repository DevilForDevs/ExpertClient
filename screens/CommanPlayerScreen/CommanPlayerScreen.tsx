import {
    StyleSheet, Text, View, NativeModules, FlatList, ActivityIndicator,
    Pressable, StatusBar, Platform, Modal
} from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import Clipboard from '@react-native-clipboard/clipboard'
import { useVideoStoreForSearch } from '../../utils/Store';
import { Video, ShortVideo } from '../../utils/types';
import GridItem from '../CommanScreen/widgets/GridItem';
import { ListRenderItem } from 'react-native';
import { VideoDescription } from '../../utils/types';
import VideoDetails from '../VideoPlayerScreen/widgets/VideoDetails';
import { getVideoFileUrlAndDetails } from './backends/utils';
import Player from '../VideoPlayerScreen/widgets/Player';
import ResolutionBottomSheet from '../VideoPlayerScreen/widgets/ResolutionBottomSheet';
import AskVariantDialog from '../MoviesRepo/widgets/AskVariantDialog';


type NavigationProp = RouteProp<
    RootStackParamList,
    'CommanPlayerScreen'
>;

export default function CommanPlayerScreen() {
    const insets = useSafeAreaInsets();

    const route = useRoute<NavigationProp>();
    const { arrivedVideo } = route.params;
    const { MyNativeModule } = NativeModules;
    const [mediaUrl, setMediaUrl] = useState("")
    const [endedAsScreen, setEndedAsScreen] = useState(false);
    const [showFlatList, setFlatList] = useState(true);
    const listRef = useRef<FlatList>(null);
    const onEndReachedCalledDuringMomentum = useRef(false);
    const [pageNo, setPageNo] = useState(2);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [retryCount, setRetryCount] = useState(3);
    const [currentVideo, setCurrentVideo] = useState<VideoDescription>();
    const [tracks, setTracks] = useState<VideoTrack[]>([]);
    const [selectedTrack, setSelectedTrack] = useState<number | "auto">("auto");
    const [showBottomSheet, setShowBottomSheet] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [testedAllVariants, setTestedAllVariants] = useState(false);
    const [testedVariants, setTestedVariants] = useState<StreamVariant[]>([]);

    const {
        totalVideos,
        addVideo,
        clearVideos,
        setQuery,
        query,
    } = useVideoStoreForSearch();

    async function isUrlWorking(url: string): Promise<boolean> {
        try {
            const response = await fetch(url, { method: "HEAD" })
            return response.status === 200
        } catch (error) {
            return false
        }
    }


    async function loadData(mvideo: Video) {
        console.log(mvideo)
        clearVideos()
        const vid = await getVideoFileUrlAndDetails(mvideo);

        setCurrentVideo(vid);
        if (vid.hlsUrl == undefined) {

            if (arrivedVideo.pageUrl?.includes("mp4moviez")) {

                if (vid.streamingSources?.length) {
                    const sources = vid.streamingSources as StreamVariant[]


                    for (let i = sources.length - 1; i >= 0; i--) {
                        const variant = sources[i]
                        console.log("Checking varint", variant.resolution);
                        const result = await MyNativeModule.checkUrl(variant.ref)
                        if (result) {
                            if (mediaUrl != "") {
                                console.log(variant);
                                setMediaUrl(variant.ref)
                            }
                            setTestedVariants((prev) => [...prev, {
                                ...variant,
                                resolution: variant.resolution?.replace(vid.title ?? "", "") ?? ""
                            }]);
                        }

                    }
                    setTestedAllVariants(true)

                }

            } else {
                if (vid.streamingSources) {
                    setMediaUrl(vid.streamingSources[0].ref)
                }

            }

        } else {
            setMediaUrl(vid.hlsUrl ?? "")
        }

        vid.suggestedVideos?.forEach(element => {
            addVideo(element);
        });
    }

    useEffect(() => {
        loadData(arrivedVideo)
    }, []);

    useEffect(() => {
        console.log(mediaUrl);
    }, [mediaUrl])

    const toggleFlatList = () => {

        if (showFlatList) {
            setFlatList(false)
        } else {
            setFlatList(true)
        }

    }

    async function handleItemClick(item: Video | ShortVideo) {
        if (item.type == "video") {
            setPageNo(2);
            loadData(item);
        }
    }

    const renderItem: ListRenderItem<Video | ShortVideo> = ({ item }) => {
        if (item.type === 'video') {
            return <GridItem video={item} onItemClick={() => handleItemClick(item)} />;
        }
        return null;
    };


    const renderFooter = () => {
        if (isFetchingMore) {
            return (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" />
                </View>
            );
        }

        if (retryCount >= 3) {
            return (
                <View style={styles.centerState}>
                    <Text style={styles.retryText}>Something went wrong</Text>
                    <Pressable style={styles.retryBtn} onPress={() => console.log("retrying")}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </Pressable>
                </View>
            );
        }

        return null;
    };

    async function handleProgress() {

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
        if (arrivedVideo.pageUrl?.includes("mp4moviez")) {
            setModalVisible(true)
        } else {
            if (tracks.length === 0) return;
            setShowBottomSheet(true);
        }

    }

    return (
        <View style={{
            flex: 1,
            paddingTop: showFlatList
                ? Platform.OS === 'android'
                    ? StatusBar.currentHeight
                    : 0
                : 0,
        }}>
            <StatusBar hidden={!showFlatList} />
            <Player
                startAsScreen={endedAsScreen}
                url={mediaUrl}
                videoId={""}
                toggleFlatList={toggleFlatList}
                showMenu={handleMoreVert}
                onProgressSave={handleProgress}
                key={"Player"}
                distroyScreen={() => console.log("progressasve")}
                onToggle={(val) => console.log("progressasve")}
                videoEnded={(endedAsScreen) => {
                    setEndedAsScreen(endedAsScreen);

                }}
                pageUrl={arrivedVideo.pageUrl}
                videoHeaders={currentVideo?.streamingRefrer}
                onTracks={setTracks}
                selectedTrack={selectedTrack}
            />
            {
                showFlatList ? <View style={styles.secondroot}>
                    <FlatList
                        ref={listRef}
                        data={totalVideos}
                        numColumns={2}
                        keyExtractor={(_, index) => index.toString()}
                        renderItem={renderItem}
                        columnWrapperStyle={styles.columnWrapper}
                        contentContainerStyle={[
                            styles.contentContainer,
                            { paddingBottom: insets.bottom + 80 }, // ✅ nav buttons + gesture bar
                        ]}
                        removeClippedSubviews
                        initialNumToRender={6}
                        maxToRenderPerBatch={6}
                        windowSize={7}
                        onEndReached={() => {
                            if (!onEndReachedCalledDuringMomentum.current) {
                                onEndReachedCalledDuringMomentum.current = true;
                            }
                        }}
                        onMomentumScrollBegin={() => {
                            onEndReachedCalledDuringMomentum.current = false;
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={renderFooter}
                        ListHeaderComponent={
                            currentVideo ? (
                                <VideoDetails
                                    videoDes={currentVideo}
                                    onDownloadPress={() => {
                                        if (arrivedVideo.pageUrl) {
                                            Clipboard.setString(arrivedVideo.pageUrl)
                                            console.log("Copied:", arrivedVideo.pageUrl)
                                        }
                                    }}
                                    onChannelClick={() => console.log("channel click")}
                                />
                            ) : (
                                <ActivityIndicator size="large" color="red" style={{ margin: 20 }} />
                            )
                        }
                    />
                    <ResolutionBottomSheet
                        visible={showBottomSheet}
                        resolutions={tracks}
                        onSelect={changeResolution}
                        onClose={() => setShowBottomSheet(false)}
                    />
                </View>

                    : <></>
            }
            <Modal
                visible={modalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => {
                    setTestedVariants([])
                    setModalVisible(false)
                }}

            >
                <AskVariantDialog testedAllVariants={testedAllVariants}
                    testedVariants={testedVariants}
                    hideModal={() => setModalVisible(false)}
                    variantSelected={(variant) => setMediaUrl(variant.ref)}
                />
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    centerState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40
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
    columnWrapper: {
        gap: 20,
    },
    contentContainer: {
        gap: 10,
        marginHorizontal: 12,
    },

    root: {
    }
    ,
    secondroot: {
        alignItems: "center"
    }
})

