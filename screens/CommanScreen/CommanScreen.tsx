import {
    StyleSheet,
    Text,
    View,
    Image, NativeModules, FlatList,
    ActivityIndicator, Pressable, ToastAndroid

} from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import SearchBar from './widgets/SearchBar'
import OverflowMenu from './widgets/OverflowMenu'
import GridItem from './widgets/GridItem'
import { extractItems } from './backends/xhmparsers/parser'
import { useVideoStoreForWatch } from '../../utils/Store'
import { ShortVideo, Video } from '../../utils/types'
import { ListRenderItem } from 'react-native';
import { useAskFormat } from '../AskFormatContext'
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { feeds, nextBrowseContinuation, searchApi } from './backends/siteManager'


type NavigationProp = RouteProp<
    RootStackParamList,
    "CommanScreen"
>;


export default function CommanScreen() {
    const { MyNativeModule } = NativeModules;
    const navigation = useNavigation<navStack>();
    const route = useRoute<NavigationProp>();
    const { site } = route.params;
    const listRef = useRef<FlatList>(null);
    const onEndReachedCalledDuringMomentum = useRef(false);

    const [menuVisible, setMenuVisible] = useState(false);
    const [pageNo, setPageNo] = useState(2);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [isSearch, setIsSearch] = useState(false);
    const { openAskFormat } = useAskFormat();
    const [currentCategory, setCurrentCategory] = useState("");
    const [isReachedEnd, setReachedEnd] = useState(false);

    const {
        totalVideos,
        addVideo,
        clearVideos,
        setQuery,
        query,
    } = useVideoStoreForWatch();

    useEffect(() => {
        loadHome();
    }, []);

    const loadHome = async () => {
        clearVideos();
        setIsFetchingMore(true);
        const items = await feeds(site.url);
        items.forEach(element => {
            addVideo(element);
        });
        setIsFetchingMore(false);
    };

    async function handleItemClick(item: Video | ShortVideo) {
        if (item.type == "video") {
            if (item.pageUrl?.includes("category")) {
                navigation.navigate("CategoryItemsScreen", { link: item.pageUrl })
            } else {
                navigation.navigate("CommanPlayerScreen", { arrivedVideo: item })
            }

        }
    }

    const renderItem: ListRenderItem<Video | ShortVideo> = ({ item }) => {
        if (item.type === 'video') {
            return <GridItem video={item} onItemClick={() => handleItemClick(item)} />;
        }
        return null;
    };

    async function nextBrowse() {
        if (isReachedEnd) {
            ToastAndroid.show("Reached End", ToastAndroid.SHORT);
            return; // ✅ STOP HERE
        }
        if (isFetchingMore) return;

        try {
            setIsFetchingMore(true);
            const continuationItems = await nextBrowseContinuation(
                site.url,
                pageNo,
                currentCategory,
                query
            );

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

    async function handleCatSel(params: string) {
        clearVideos();
        setIsSearch(true);
        setRetryCount(0);
        const jsonString = await MyNativeModule.getXhInitials(
            params
        );
        console.log(JSON.parse(jsonString));
        const result = extractItems(JSON.parse(jsonString));
        result.videos.forEach(element => {
            addVideo(element)
        });

    }

    async function search(text: string) {
        if (isFetchingMore) return;
        try {
            setIsFetchingMore(true);
            const searchItems = await searchApi(site.url, text);
            searchItems.forEach(element => {
                addVideo(element)
            });
        } catch (e) {
            if (retryCount < 3) {
                setRetryCount(prev => prev + 1);
                nextBrowse();
            }
        } finally {
            setIsFetchingMore(false);
        }

    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.left}>
                    <Image
                        source={{ uri: 'https://picsum.photos/id/237/536/354' }}
                        style={styles.logo}
                    />
                    <Text style={styles.title}>{site.name}</Text>
                </View>

                <SearchBar onSubmit={search} />

                <OverflowMenu
                    visible={menuVisible}
                    onToggle={() => setMenuVisible(v => !v)}
                    onClose={() => setMenuVisible(false)}
                    items={[
                        {
                            label: 'Categories', onPress: () => {
                                setMenuVisible(false);
                                navigation.navigate("CategoryScreen", { site })

                            }
                        },
                        { label: 'Tags', onPress: () => setMenuVisible(false) },
                    ]}
                />
            </View>

            <FlatList
                ref={listRef}
                data={totalVideos}
                numColumns={2}
                keyExtractor={(item, index) => index.toString() + item.videoId}
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    topBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
        zIndex: 10,
    },
    left: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    logo: {
        width: 28,
        height: 28,
        resizeMode: 'contain',
        marginRight: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
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
    columnWrapper: {
        gap: 20,
    },
    contentContainer: {
        gap: 10,
        alignItems: "center"
    },
})
