import {
    StyleSheet, Text, View, ListRenderItem,
    TouchableOpacity, FlatList, Modal, ActivityIndicator, Dimensions, Platform, StatusBar
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Video } from '../../utils/types';
import { getFeeds } from '../MoviesRepo/backEnds/apis';
import VideoRowItemView from '../MoviesRepo/widgets/VideoRowItemView';
import { useSafeAreaInsets } from "react-native-safe-area-context";
type NavigationProp = RouteProp<
    RootStackParamList,
    "MoviesHubCatScreen"
>;



export default function MoviesHubCatScreen() {



    const insets = useSafeAreaInsets()
    const navigation = useNavigation<navStack>();
    const route = useRoute<NavigationProp>();
    const [cats, setCats] = useState<Video[]>([]);
    const [loading, setLoading] = useState(false);
    const { arrivedVideo } = route.params;

    const [nextPageUrl, setNextPageUrl] = useState<string | undefined>(undefined);
    const [currentUrl, setCurrentUrl] = useState<string | null>(null);
    const [previousUrl, setPreviousUrl] = useState<string | null>(null);



    async function loadItems(url: string) {

        if (loading) return;
        setLoading(true);
        try {
            const result = await getFeeds(url);

            const combined = [...result.items, ...result.categories];

            setCats((prevCats) => [...prevCats, ...combined]);
            setNextPageUrl(result.nextPageUrl);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (arrivedVideo.pageUrl) {
            setCurrentUrl(arrivedVideo.pageUrl)
        }
    }, [])

    async function handleItemClick(params: Video) {
        if (params.thumbnail == undefined) {
            console.log(params);
            setCats([]);
            setPreviousUrl(currentUrl);
            if (params.pageUrl) {
                setCurrentUrl(params.pageUrl)
            }

        } else {
            navigation.navigate("CommanPlayerScreen", { arrivedVideo: params })
        }

    }

    useEffect(() => {
        if (currentUrl != null) {
            loadItems(currentUrl)
        }
    }, [currentUrl])

    function renderCategoryItem({ item, index }: { item: Video; index: number }) {
        return (
            item.thumbnail ? <VideoRowItemView video={item}
                onItemClick={() => handleItemClick(item)} /> :
                <TouchableOpacity style={styles.categoryItem} onPress={() => handleItemClick(item)}>
                    <Text style={styles.categoryText}>{index + 1} • {item.title}</Text>
                </TouchableOpacity>
        );
    }

    async function handleBack() {
        if (!previousUrl) {
            navigation.goBack();
            return;
        }

        setCats([]);
        setCurrentUrl(previousUrl);
        setPreviousUrl(null);

    }


    return (
        <View style={{
            flex: 1,
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
            paddingBottom: insets.bottom,
            paddingLeft: 12
        }}
        >
            <Text>MoviesHubCatScreen</Text>
            <FlatList
                data={cats}
                renderItem={renderCategoryItem}
                keyExtractor={(_, index) => index.toString()}
                onEndReached={() => {
                    // Called when the user scrolls near the end
                    if (nextPageUrl) {         // only load if there is a next page
                        loadItems(nextPageUrl); // fetch next page items
                    }
                }}
                onEndReachedThreshold={0.5}   // triggers when user scrolls 50% from bottom
                ListFooterComponent={loading ? <Text>Loading...</Text> : null} // optional loading indicator

            />
        </View>
    )
}

const { height } = Dimensions.get("window");


const styles = StyleSheet.create({
    backBtn: {
        position: "absolute",
        bottom: "7%",
        right: "7%",
        backgroundColor: "red",
        padding: 5,
        borderRadius: 5
    },
    toggleBtnActive: { backgroundColor: "#000" },
    toggleText: { fontSize: 14, color: "#fff" },
    toggleTextActive: { color: "#fff" },
    categoryItem: { backgroundColor: "#f2f2f2", paddingVertical: 5 },
    categoryText: { fontSize: 14, color: "#333" },
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
})