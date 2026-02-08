import {
    StyleSheet, Text, View, NativeModules,
    TouchableOpacity, FlatList, Modal, Pressable, ActivityIndicator
} from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { schemaSarkariResultFeeds } from '../CommanScreen/backends/schemas'
import { useNavigation } from '@react-navigation/native'


type spage = {
    url: string,
    title: string
}

type bigCards = {
    title: string,
    items: spage[],
    viewMoreLink: string,
    bottomText: string
}

export default function SarkariResult() {
    const { MyNativeModule } = NativeModules;
    const [pages, setPages] = useState<spage[]>([]);
    const navigation = useNavigation<navStack>()
    const [bcrd, setBcrd] = useState<bigCards[]>([]);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [statusText, setStatusText] = useState("SarkariResult");






    function getRandomBrightColor() {
        const hue = Math.floor(Math.random() * 360);
        return `hsl(${hue}, 85%, 65%)`;
    }

    async function loadData() {
        setIsFetchingMore(true);
        try {
            let jsonString: string;

            try {
                jsonString = await MyNativeModule.htmlJsonBridge(
                    "https://sarkariresult.com.cm",
                    JSON.stringify(schemaSarkariResultFeeds)
                );
            } catch (e) {
                console.error("Native call failed", e);
                return [];
            }

            let data: any;

            try {
                data = JSON.parse(jsonString);
            } catch (e) {
                console.error("JSON parse failed", jsonString);
            }

            const mpages: spage[] = data.hotjobs?.map((item: any) => ({
                title: item.title,
                url: item.url
            })) || [];
            setPages(mpages);

            const mcards: bigCards[] = (data.cards || [])
                .map((item: any) => ({
                    title: item.title,
                    viewMoreLink: item.viewMore,
                    bottomText: "View More",
                    items: (item.items || []).map((subItem: any) => ({
                        title: subItem.title,
                        url: subItem.url
                    })),

                }))
                .filter((card: bigCards) => card.items.length > 0); // type added

            setBcrd(mcards);

        } catch (e) {
            console.log("Extractor error:", e);
            setStatusText("Unexpected Error");
        } finally {
            setIsFetchingMore(false);
        }
    }

    async function handleLoadMore(card: bigCards) {

        // 🔁 VIEW LESS MODE
        if (card.bottomText === "View Less") {
            setBcrd(prev =>
                prev.map(c => {
                    if (c.viewMoreLink !== card.viewMoreLink) return c;

                    return {
                        ...c,
                        items: c.items.slice(0, 15),
                        bottomText: "View More"
                    };
                })
            );
            return;
        }

        // 🔽 VIEW MORE MODE (fetch)
        let jsonString: string;

        const viewMoreSchema = {
            container: "a.wp-block-latest-posts__post-title",
            title: {
                selector: "",
                attr: "text",
                required: true
            },
            url: {
                selector: "",
                attr: "href",
                required: true
            }
        };

        try {
            jsonString = await MyNativeModule.htmlJsonBridge(
                card.viewMoreLink,
                JSON.stringify(viewMoreSchema)
            );
        } catch (e) {
            console.error("Native call failed", e);
            return;
        }

        let data: any;
        try {
            data = JSON.parse(jsonString);
        } catch (e) {
            console.error("JSON parse failed", jsonString);
            return;
        }

        const newItems: spage[] = (data.items || []).map((item: any) => ({
            title: item.title,
            url: item.url
        }));

        if (newItems.length === 0) return;

        setBcrd(prev =>
            prev.map(c => {
                if (c.viewMoreLink !== card.viewMoreLink) return c;

                const existingUrls = new Set(c.items.map(i => i.url));
                const mergedItems = [
                    ...c.items,
                    ...newItems.filter(i => !existingUrls.has(i.url))
                ];

                return {
                    ...c,
                    items: mergedItems,
                    bottomText: "View Less"
                };
            })
        );
    }


    useEffect(() => {
        loadData()
    }, []);

    const HotJobsHeader = () => (
        <FlatList
            data={pages}
            numColumns={2}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => item.url + index}
            contentContainerStyle={{ paddingHorizontal: 10 }}
            renderItem={({ item }) => (
                <TouchableOpacity onPress={() => navigation.navigate("PageDetailsSr", { link: item.url })}
                    style={[styles.card, { backgroundColor: getRandomBrightColor() }]}
                >
                    <Text style={styles.cardTitle} numberOfLines={2}>
                        {item.title}
                    </Text>
                </TouchableOpacity>
            )}
        />
    )

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.topVaccancies}>{statusText}</Text>
            {
                isFetchingMore ? (
                    <View style={styles.centerState}>
                        <ActivityIndicator size="large" />
                    </View>
                ) : <></>
            }

            {/* Big cards flatlist */}
            <FlatList
                data={bcrd}
                keyExtractor={(item, index) => item.title + index}
                contentContainerStyle={{ paddingHorizontal: 10 }}
                ListHeaderComponent={<HotJobsHeader />}
                renderItem={({ item }) => (
                    <View style={[styles.bigCard]}>
                        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                            <Text style={styles.bigCardTitle}>{item.title}</Text>
                            <Text style={styles.bigCardTitle}>{item.items.length} Links</Text>
                        </View>
                        {item.items.map((subItem, i) => (
                            <TouchableOpacity key={i} style={styles.subItem} onPress={() => navigation.navigate("PageDetailsSr", { link: subItem.url })}>
                                <Text>
                                    <Text style={styles.indexText}>{i + 1}. </Text>
                                    <Text style={styles.subItemText}>{subItem.title}</Text>
                                </Text>
                            </TouchableOpacity>
                        ))}
                        {item.viewMoreLink && (
                            <TouchableOpacity style={styles.viewMoreBtn} onPress={() => handleLoadMore(item)}>
                                <Text style={styles.viewMoreText}>{item.bottomText}</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            />

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 10 },
    topVaccancies: { fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center' },

    card: {
        margin: 6,
        padding: 8,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        width: 180
    },
    cardTitle: { fontSize: 14, fontWeight: '500' },

    bigCard: {
        marginVertical: 8,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f7f7f7',
    },
    bigCardTitle: { fontSize: 16, fontWeight: '600', marginBottom: 6 },
    subItem: { paddingVertical: 4 },
    subItemText: {
        fontSize: 14,
        color: '#0000ef',  // classic link blue
        textDecorationLine: 'underline', // optional, makes it feel clickable
    },
    viewMoreBtn: { marginTop: 6 },
    viewMoreText: { color: '#1E90FF', fontWeight: '500' },
    overlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    backdrop: {
        flex: 1,
    },
    halfSheet: {
        height: "50%",
        backgroundColor: "#fff",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 16,
        paddingTop: 12,
        overflow: "hidden",
    },
    emptyText: {
        textAlign: "center",
        marginTop: 32,
        color: "#666",
    },
    groupTitle: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },

    categoryCard: {
        width: 120,
        marginRight: 12,
    },

    thumbnail: {
        width: "100%",
        height: 80,
        borderRadius: 8,
        backgroundColor: "#ddd",
    },

    categoryName: {
        marginTop: 6,
        fontSize: 12,
        textAlign: "center",
    },
    indexText: {
        color: "#000",        // black
        fontWeight: "500",
    },
    centerState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },
})
