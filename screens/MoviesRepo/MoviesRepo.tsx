import {
    StyleSheet, Text, View, FlatList,
    ListRenderItem, ActivityIndicator, TouchableOpacity, Modal, Dimensions, Platform, StatusBar
} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { getFeeds } from './backEnds/apis';
import VideoRowItemView from './widgets/VideoRowItemView';
import { getVideoUrls } from './backEnds/utils';
import { CategoryList } from './widgets/CategoryList';
import { useVideoStoreForSearch } from '../../utils/Store';
import { Video, ShortVideo } from '../../utils/types';
import { useSafeAreaInsets } from "react-native-safe-area-context";


type NavigationProp = RouteProp<RootStackParamList, "CommanScreen">;

export default function MovieHub() {
    const insets = useSafeAreaInsets()
    const navigation = useNavigation<navStack>();
    const route = useRoute<NavigationProp>();
    const { site } = route.params;
    const [loading, setLoading] = useState(false);
    const [cats, setCats] = useState<Video[]>([]);
    const listRef = useRef<FlatList>(null);
    const onEndReachedCalledDuringMomentum = useRef(false);

    const {
        totalVideos,
        addVideo,
        clearVideos,
    } = useVideoStoreForSearch();

    async function loadItems() {
        if (loading) return;
        setLoading(true);
        try {
            const result = await getFeeds(site.url);
            console.log(result);
            result.items.forEach(element => {
                addVideo(element)
            });
            result.items.forEach((element) => addVideo(element));
            setCats(result.categories);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        clearVideos();
        loadItems();
    }, []);

    // Handle item click
    const handleItemClick = React.useCallback(
        async (item: Video | ShortVideo) => {
            if (item.type === "video") {
                navigation.navigate("CommanPlayerScreen", { arrivedVideo: item })
            }
        },
        []
    );

    const renderItem: ListRenderItem<Video | ShortVideo> = React.useCallback(
        ({ item }) => {
            if (item.type === "video") {
                return (
                    <VideoRowItemView
                        video={item}
                        onItemClick={() => handleItemClick(item)}
                    />
                );
            }
            return null;
        },
        [handleItemClick]
    );
    return (
        <View
            style={{
                flex: 1,
                paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
                paddingBottom: insets.bottom,
            }}
        >
            {loading && totalVideos.length === 0 ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <FlatList
                    ref={listRef}
                    data={totalVideos}
                    keyExtractor={(item, index) => index.toString() + item.videoId}
                    renderItem={renderItem}
                    initialNumToRender={6}
                    maxToRenderPerBatch={6}
                    windowSize={7}
                    updateCellsBatchingPeriod={50}
                    onEndReached={() => {
                        if (!onEndReachedCalledDuringMomentum.current) {
                            loadItems();
                            onEndReachedCalledDuringMomentum.current = true;
                        }
                    }}
                    onMomentumScrollBegin={() => {
                        onEndReachedCalledDuringMomentum.current = false;
                    }}

                    ListFooterComponent={
                        <>
                            <CategoryList
                                cats={cats}
                                onItemPress={(video) => {

                                    console.log(video)
                                    navigation.navigate("MoviesHubCatScreen", {
                                        arrivedVideo: video,
                                    })
                                }
                                }
                            />

                            {loading && (
                                <ActivityIndicator style={{ marginVertical: 16 }} />
                            )}
                        </>
                    }
                />
            )}


            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                <Text style={{ color: "white" }}>Back</Text>
            </TouchableOpacity>
        </View>
    );
}

const { height } = Dimensions.get("window");

const styles = StyleSheet.create({

    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
    backBtn: {
        position: "absolute",
        bottom: "7%",
        right: "7%",
        backgroundColor: "red",
        padding: 5,
        borderRadius: 5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "flex-end",
    },
    modalContainer: {
        height: height / 2, // half screen
        backgroundColor: "#fff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        gap: 10
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 12,
    },
    variantItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        paddingRight: 20
    },
    closeBtn: {
        backgroundColor: "red",
        padding: 10,
        borderRadius: 8,
        marginTop: 12,
        alignItems: "center",
    },
});