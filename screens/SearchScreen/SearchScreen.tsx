import {
    StyleSheet, TextInput, TouchableOpacity,
    View, ActivityIndicator, NativeModules,
    FlatList, Text, Pressable

} from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/Ionicons';
import IconMat from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "BottomNav">;
import { videoId } from '../../utils/Interact';
import { useAskFormat } from '../AskFormatContext';
import { parseSearchResponse } from '../../utils/EndPoints';
import { useVideoStoreForSearch } from '../../utils/Store';
import VideoItemView from '../HomeScreen/widgets/VideoItemView/VideoItemView';
import ShortsItemView from '../HomeScreen/widgets/ShortsItemView/ShortsItemView';
import ShortsHeader from '../HomeScreen/widgets/ShortsHeader/ShortsHeader';

export default function SearchScreen() {
    const navigation = useNavigation<NavigationProp>();
    const [query, setquery] = useState("");
    const [loading, setLoading] = useState(false);
    const { MyNativeModule } = NativeModules;
    const { openAskFormat } = useAskFormat();
    const { addVideo, totalVideos, continuation, setContinuation, clearVideos, setQuery } = useVideoStoreForSearch();
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const onEndReachedCalledDuringMomentum = React.useRef(false);
    const isPlaylist = (q: string) =>
        q.includes("list=") || q.startsWith("PL") || q.startsWith("OL");
    const listRef = React.useRef<FlatList<any>>(null);



    const handleSubmit = async () => {
        const trimmed = query.trim();
        if (!trimmed) return;

        clearVideos();
        setRetryCount(0);
        setContinuation("");

        // 🔼 move list to top
        listRef.current?.scrollToOffset({
            offset: 0,
            animated: false,
        });

        setLoading(true);

        try {
            const vid = videoId(trimmed);
            if (vid) {
                setLoading(false);
                () => console.log("not supported")
                return;
            }

            if (isPlaylist(trimmed)) {
                setLoading(false);
                return;
            }

            const raw = await MyNativeModule.searchYoutube(trimmed, null, null);
            const result = parseSearchResponse(raw);

            result.videos.forEach(addVideo);
            setContinuation(result.continuation ?? "");
            setQuery(trimmed);

        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setLoading(false);
        }
    };



    function handleRetry() {
        setRetryCount(0);
        nextBroswe();
    }

    async function nextBroswe() {
        if (loading) return;
        if (isFetchingMore) return;
        if (!continuation) return;
        if (retryCount >= 3) return;

        setIsFetchingMore(true);

        try {
            const raw = await MyNativeModule.searchYoutube(
                query,
                continuation,
                null
            );

            const result = parseSearchResponse(raw);
            result.videos.forEach(addVideo);

            // 🧠 prevent infinite loop
            if (result.continuation === continuation) return;

            setContinuation(result.continuation ?? "");

        } catch (e) {
            console.error("Continuation fetch failed", e);
            setRetryCount(r => r + 1);
        } finally {
            setIsFetchingMore(false);
        }
    }


    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => navigation.navigate("BottomNav")}>
                    <Icon name="arrow-back" size={26} color="black" />
                </TouchableOpacity>
                <TextInput placeholder='Search Youtube' value={query}
                    onChangeText={setquery}
                    returnKeyType="search"
                    onSubmitEditing={handleSubmit} style={styles.txtInput} />
                <View style={styles.iconContainer}>
                    <Icon name="mic" size={26} color="black" />
                </View>
                <View>
                    <IconMat name="cast" size={26} color="black" />
                </View>

            </View>
            {loading && totalVideos.length === 0 && (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="large" color="#FF0000" />
                </View>
            )}
            <FlatList
                ref={listRef}
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
                        <VideoItemView
                            item={item}
                            onChannelClick={() => navigation.navigate("ChannelScreen", { channelUrl: item.channelUrl })}
                            progress={0}
                            onItemPress={() =>
                                navigation.navigate("VideoPlayerScreen", { arrivedVideo: item, playlistId: undefined })
                            }
                            onDownload={() => console.log("not supported")}

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
                onMomentumScrollBegin={() => {
                    onEndReachedCalledDuringMomentum.current = false;
                }}
                onEndReached={() => {
                    if (!onEndReachedCalledDuringMomentum.current) {
                        onEndReachedCalledDuringMomentum.current = true;
                        nextBroswe();
                    }
                }}
                onEndReachedThreshold={0.7}
            />

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 10,
        paddingTop: 10
    }
    ,
    txtInput: {
        backgroundColor: "#ECECEC",
        borderRadius: 50,
        paddingLeft: 10,
        flex: 1,
        fontFamily: "Roboto-Medium",
        fontSize: 16
    }
    ,
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10
    }
    ,
    iconContainer: {
        backgroundColor: "#ECECEC",
        padding: 5,
        borderRadius: 50
    }
    ,
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