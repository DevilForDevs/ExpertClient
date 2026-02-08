import { useState, useCallback, useRef } from "react";
import { Modal, View, StyleSheet, Pressable, Text, NativeModules, Image } from "react-native";
import AskFormat from "./HomeScreen/widgets/AskFormat/AskFormat";
import { AskFormatContext } from "./AskFormatContext";
import { Video } from "../utils/types";
import { getStreamingData, txt2filename } from "../utils/Interact";
import { mapAdaptiveFormatsToRequired } from "../utils/praserHelpers";
import { AskFormatModel } from "../utils/types";
import { ActivityIndicator } from "react-native";
import { SQLiteDatabase } from 'react-native-sqlite-storage';
import { initDB } from "../utils/dbfunctions";
import { formatDurationHMS } from "../utils/EndPoints";
import { handleFormatSelect } from "./AskFromatBackends/handleFormatSelect";
import { findCategories } from "./AskFromatBackends/categoriesParser";
import { FlatList } from "react-native-gesture-handler";



export const AskFormatProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {

    const [visible, setVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [requiredFmts, setRequiredFmts] = useState<AskFormatModel[]>([]);
    const [requiredCategories, setRequiredCategorires] = useState<CategoryGroup[]>([]);
    const [currentVideo, setCurrentVideo] = useState<Video>();
    const [db, setDb] = useState<SQLiteDatabase | null>(null);
    const resolverRef = useRef<((result: string) => void) | null>(null);





    const fetchStreamingInfo = useCallback(async (video: Video) => {
        try {
            setLoading(true);
            let database = db;

            if (!database) {
                database = await initDB();
                setDb(database);
            }
            const response = await getStreamingData(video.videoId);
            const player = response?.playerResponse;
            const streamingData = player?.streamingData;


            if (!streamingData?.adaptiveFormats) {
                console.warn("No adaptiveFormats found", streamingData);
                setRequiredFmts([]);
                return;
            }
            setRequiredFmts(mapAdaptiveFormatsToRequired(
                streamingData.adaptiveFormats
            ));

            const fmtduration = formatDurationHMS(player.videoDetails.lengthSeconds);
            const title = player.videoDetails.title;

            setCurrentVideo({
                ...video,
                title: title,
                duration: fmtduration
            });
        } catch (err) {
            console.error("fetchStreamingInfo failed:", err);
            setRequiredFmts([]);
        } finally {
            setLoading(false);
        }
    }, []);


    const openAskFormat = async (video: Video, onClose: (result: string) => void) => {
        setVisible(true);
        if (video.title == "pornCategories") {
            const categories = await findCategories(video);
            setRequiredCategorires(categories);
            resolverRef.current = onClose;
        } else {
            fetchStreamingInfo(video);
        }

    };

    const closeAskFormat = (result: string) => {
        setVisible(false);
        // pass result back to caller
        resolverRef.current?.(result);
        resolverRef.current = null;
        setRequiredFmts([]);
        setLoading(false);
    };


    return (
        <AskFormatContext.Provider value={{
            openAskFormat, closeAskFormat() {

            },
        }}>
            {children}

            <Modal
                visible={visible}
                transparent
                animationType="slide"
                onRequestClose={() => closeAskFormat("")}
            >
                <View style={styles.overlay}>
                    {/* backdrop */}
                    <Pressable style={styles.backdrop} onPress={() => closeAskFormat("")} />

                    {/* bottom sheet */}
                    <View style={styles.halfSheet}>
                        {loading && (
                            <ActivityIndicator size="large" style={{ marginTop: 24 }} />
                        )}

                        {!loading && requiredFmts.length === 0 && (
                            <Text style={styles.emptyText}>
                                No formats available
                            </Text>
                        )}
                        {!loading && requiredFmts.length > 0 && (
                            <AskFormat
                                videoTitle={currentVideo?.title ?? "No title"}
                                requiredFormats={requiredFmts}
                                closeRequest={() => closeAskFormat("")}
                                onFormatSelection={(itag) => {
                                    handleFormatSelect(itag, currentVideo, requiredFmts);
                                    closeAskFormat("");
                                }}
                            />
                        )}

                        {!loading && requiredCategories.length > 0 && (
                            <FlatList
                                data={requiredCategories}
                                keyExtractor={(item, index) => `${item.name}-${index}`}
                                renderItem={({ item }) => (
                                    <View style={{ marginBottom: 20 }}>
                                        {/* Group title */}
                                        <Text style={styles.groupTitle}>
                                            {item.name}
                                        </Text>

                                        {/* Inner FlatList */}
                                        <FlatList
                                            data={item.categories}
                                            keyExtractor={(cat, idx) => `${cat.pageUrl}-${idx}`}
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            renderItem={({ item: cat }) => (
                                                <Pressable
                                                    style={styles.categoryCard}
                                                    onPress={() => {
                                                        closeAskFormat(cat.pageUrl);
                                                    }}
                                                >
                                                    <Image
                                                        source={{ uri: cat.thumbnail }}
                                                        style={styles.thumbnail}
                                                        resizeMode="cover"
                                                    />
                                                    <Text style={styles.categoryName} numberOfLines={2}>
                                                        {cat.name}
                                                    </Text>
                                                </Pressable>
                                            )}
                                        />
                                    </View>
                                )}
                            />
                        )}


                    </View>
                </View>
            </Modal>
        </AskFormatContext.Provider>
    );
};

const styles = StyleSheet.create({
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

});
