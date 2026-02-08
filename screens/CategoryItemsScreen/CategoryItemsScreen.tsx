import {
    StyleSheet, Text, View, FlatList,
    Pressable, ActivityIndicator, ListRenderItem, ToastAndroid

} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoStoreForPlaylist } from '../../utils/Store';
import GridItem from '../CommanScreen/widgets/GridItem';
import { ShortVideo, Video } from '../../utils/types'
import { categoryItems } from '../CommanScreen/backends/siteManager';


type NavigationProp = RouteProp<
    RootStackParamList,
    "CategoryItemsScreen"
>;

function getTitleFromLink(link: string): string {
    return decodeURIComponent(
        link
            .replace(/^https?:\/\/[^/]+/i, "") // remove domain
            .replace(/^\/|\/$/g, "")           // trim slashes
    )
        .split("/")
        .pop() ?? "Category";
}



export default function CategoryItemsScreen() {
    const route = useRoute<NavigationProp>();
    const { link } = route.params;
    const {
        totalVideos,
        addVideo,
        clearVideos,
        setQuery,
        query,
    } = useVideoStoreForPlaylist();
    const listRef = useRef<FlatList>(null);
    const onEndReachedCalledDuringMomentum = useRef(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [pageNo, setPageNo] = useState(2);

    const [isReachedEnd, setReachedEnd] = useState(false);
    const navigation = useNavigation<navStack>();

    useEffect(() => {
        clearVideos();
        loadHome();
    }, []);

    async function loadHome() {
        const items = await categoryItems(link, 1);
        items.forEach(element => {
            addVideo(element);
        });

    }

    async function nextBrowse() {
        if (isReachedEnd) {
            ToastAndroid.show("Reached End", ToastAndroid.SHORT);
            return; // ✅ STOP HERE
        }

        if (isFetchingMore) return;

        try {
            setIsFetchingMore(true);

            const continuationItems = await categoryItems(link, pageNo);

            if (continuationItems.length === 0) {
                setReachedEnd(true);
                setRetryCount(0);
            } else {
                continuationItems.forEach(addVideo);
                setPageNo(prev => prev + 1);
                setRetryCount(0);
            }
        } catch (e) {
            if (retryCount < 3) {
                setRetryCount(prev => prev + 1);
                nextBrowse();
            }
            console.log(e);
        } finally {
            setIsFetchingMore(false);
        }
    }

    const renderItem: ListRenderItem<Video | ShortVideo> = ({ item }) => {
        if (item.type === 'video') {
            return <GridItem video={item} onItemClick={() => handleItemClick(item)} />;
        }
        return null;
    };




    async function handleItemClick(item: Video | ShortVideo) {
        if (item.type == "video") {
            console.log(item);
            navigation.navigate("CommanPlayerScreen", { arrivedVideo: item })
        }
    }

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
                    <Pressable style={styles.retryBtn} onPress={nextBrowse}>
                        <Text style={styles.retryBtnText}>Retry</Text>
                    </Pressable>
                </View>
            );
        }

        return null;
    };

    return (
        <SafeAreaView>
            <View style={styles.titleContainer}>
                <Text style={styles.screenTitle}>
                    {getTitleFromLink(link)}
                </Text>
            </View>
            <FlatList
                ListHeaderComponent={
                    <View>
                        <Text>Total Videos {totalVideos.length}</Text>
                    </View>
                }
                ref={listRef}
                data={totalVideos}
                numColumns={2}
                keyExtractor={item => item.videoId + totalVideos.indexOf(item)}
                renderItem={renderItem}
                columnWrapperStyle={styles.columnWrapper}
                contentContainerStyle={styles.contentContainer}
                removeClippedSubviews
                initialNumToRender={6}
                maxToRenderPerBatch={6}
                windowSize={7}
                onEndReached={() => {
                    if (!onEndReachedCalledDuringMomentum.current) {
                        nextBrowse();
                        onEndReachedCalledDuringMomentum.current = true;
                    }
                }}
                onMomentumScrollBegin={() => {
                    onEndReachedCalledDuringMomentum.current = false;
                }}
                onEndReachedThreshold={0.5}
                ListFooterComponent={renderFooter}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
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
    columnWrapper: {
        gap: 20,
    },
    contentContainer: {
        gap: 10,
        alignItems: "center"
    },

    titleContainer: {
        alignItems: "center",      // horizontal center
        justifyContent: "center",  // vertical center
        paddingVertical: 12,
    },

    screenTitle: {
        fontSize: 18,
        fontWeight: "600",
        textAlign: "center",
    },

})