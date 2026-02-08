import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    ImageBackground,
    ActivityIndicator
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCategorylist, getpages } from './backends/categoryManager';

;

type NavigationProp = RouteProp<
    RootStackParamList,
    "CommanScreen"
>;



export default function CategoryScreen() {
    const route = useRoute<NavigationProp>();
    const { site } = route.params;
    const navigation = useNavigation<navStack>();
    const [categories, setCategories] = useState<CategoryType[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [pages, setPages] = useState<pageItem[]>([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        loadCategories();
    }, []);


    async function loadCatItems(index: number) {
        try {
            setLoading(true);
            console.log(pages[index]);
            if (pages[index].link.includes("category")) {
                navigation.navigate("CategoryItemsScreen", { link: pages[index].link });
            } else {
                const catItems = await getCategorylist(pages[index].link);
                setCategories(catItems);
            }


        } finally {
            setLoading(false);
        }
    }


    const loadCategories = async () => {
        try {
            setLoading(true);
            const pages = await getpages(site);
            setPages(pages);
            const catItems = await getCategorylist(pages[0].link);
            setCategories(catItems);
        } finally {
            setLoading(false);
        }


    };


    useEffect(() => {
        if (pages.length != 0) {
            loadCatItems(selectedIndex)
        }

    }, [selectedIndex]);

    /* ---------- HEADER (HORIZONTAL CATEGORY LIST) ---------- */
    const renderHeader = () => (
        <View>
            <FlatList
                data={pages}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.link}
                contentContainerStyle={styles.headerContainer}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        onPress={() => setSelectedIndex(index)}
                        style={[
                            styles.categoryChip,
                            selectedIndex === index && styles.activeChip,
                        ]}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                selectedIndex === index && styles.activeText,
                            ]}
                        >
                            {item.title}
                        </Text>
                    </TouchableOpacity>
                )}
            />
            <Text style={{
                marginLeft: 16,
                marginTop: 16
            }}>Total Videos {categories.length}</Text>
        </View>
    );

    async function handleItemClick(link: string) {
        navigation.navigate("CategoryItemsScreen", { link });
    }

    const renderItem = ({ item }: { item: CategoryType }) => {
        const hasThumb = !!item.thumbnail;

        const content = (
            <TouchableOpacity onPress={() => handleItemClick(item.pageUrl)} style={[styles.overlay, !hasThumb && styles.noImageOverlay]}>
                <Text style={[styles.itemTitle, !hasThumb && styles.noImageText]}>
                    {item.name}
                </Text>

                {item.videoCount !== undefined && (
                    <Text style={[styles.itemCount, !hasThumb && styles.noImageCount]}>
                        {item.videoCount} Videos
                    </Text>
                )}
            </TouchableOpacity>
        );

        if (hasThumb) {
            return (
                <ImageBackground
                    source={{ uri: item.thumbnail }}
                    style={styles.imageCard}
                    imageStyle={styles.imageRadius}
                >
                    {content}
                </ImageBackground>
            );
        }

        return (
            <View style={styles.textCard}>
                {content}
            </View>
        );
    };



    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ListHeaderComponent={renderHeader}
                data={categories}
                keyExtractor={(_, index) => index.toString()}
                renderItem={renderItem}
                numColumns={2}
                columnWrapperStyle={styles.row}
                showsVerticalScrollIndicator={false}
            />

            {loading && (
                <View style={styles.overlayLoader}>
                    <ActivityIndicator size="large" color="#fff" />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    headerContainer: {
        paddingVertical: 12,
        paddingHorizontal: 8,

    },

    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#eee',
        marginRight: 10,
    },

    activeChip: {
        backgroundColor: '#222',
    },

    categoryText: {
        color: '#555',
    },

    activeText: {
        color: '#fff',
        fontWeight: '600',
    },

    row: {
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },

    itemCard: {
        flex: 1,
        height: 160,
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#f4f4f4',
        justifyContent: 'flex-end',
    },

    imageRadius: {
        borderRadius: 12,
    },

    overlay: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 10,
    },

    itemTitle: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },

    itemCount: {
        color: '#ddd',
        fontSize: 12,
        marginTop: 2,
    },
    imageCard: {
        flex: 1,
        height: 160,
        marginVertical: 8,
        borderRadius: 12,
        overflow: 'hidden',
        justifyContent: 'flex-end',
    },

    textCard: {
        flex: 1,
        marginVertical: 8,
        padding: 14,
        borderRadius: 12,
        backgroundColor: '#f4f4f4',
    },


    noImageOverlay: {
        backgroundColor: 'transparent',
        padding: 0,
    },

    noImageText: {
        color: '#222',
    },

    noImageCount: {
        color: '#666',
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    overlayLoader: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },


});
