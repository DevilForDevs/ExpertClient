import {
    StyleSheet,
    Text,
    View,
    NativeModules,
    FlatList,
    TouchableOpacity,
    Linking
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { RouteProp, useRoute } from "@react-navigation/native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { sarkariresultDetailsPageSchema } from '../CommanScreen/backends/schemas';

type NavigationProp = RouteProp<
    RootStackParamList,
    "PageDetailsSr"
>;

type ListItem = {
    text: string;
};

type TableCell = { text: string, url?: string; list?: ListItem[]; };
type TableRow = { cells: TableCell[] };
type Table = { headers: TableCell[], rows: TableRow[] };



export default function PageDetailsSr() {
    const route = useRoute<NavigationProp>();
    const { link } = route.params;
    const { MyNativeModule } = NativeModules;

    const [tables, setTables] = useState<Table[]>([]);

    async function loadData() {
        let jsonString: string;

        try {
            jsonString = await MyNativeModule.htmlJsonBridge(
                link,
                JSON.stringify(sarkariresultDetailsPageSchema)
            );
        } catch (e) {
            console.error("Native call failed", e);
            return;
        }

        try {
            const data = JSON.parse(jsonString);
            setTables(data.tables || []);
        } catch (e) {
            console.error("JSON parse failed", jsonString);
        }
    }

    useEffect(() => {
        loadData();
    }, []);


    const renderCell = (cell: TableCell, key: number) => {
        // 1️⃣ List inside cell
        if (cell.list && cell.list.length > 0) {
            return (
                <View key={key} style={styles.listCell}>
                    {cell.list.map((li, i) => (
                        <Text key={i} style={styles.listItem}>
                            • {li.text}
                        </Text>
                    ))}
                </View>
            );
        }

        // 2️⃣ Link cell
        if (cell.url) {
            return (
                <TouchableOpacity
                    key={key}
                    style={styles.cell}
                    onPress={() => handleLinkClick(cell.url ?? "")}

                >
                    <Text style={styles.linkText}>
                        {cell.text || "Open"}
                    </Text>
                </TouchableOpacity>
            );
        }

        // 3️⃣ Plain text
        return (
            <Text key={key} style={styles.cell}>
                {cell.text}
            </Text>
        );
    };

    async function handleLinkClick(link: string) {
        if (!link.includes("sarkariresult")) {
            await Linking.openURL(link);
        }
    }


    return (
        <SafeAreaView>
            <View style={{ alignItems: "center" }}>
                <Text> Details</Text>
            </View>
            <FlatList
                data={tables}
                keyExtractor={(_, i) => `table-${i}`}
                contentContainerStyle={styles.container}

                renderItem={({ item }) => (
                    <View style={styles.table}>

                        <View style={styles.headerRow}>
                            {item.headers.map((cell, i) => {
                                if (cell.url) {
                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            style={styles.headerCell}
                                            onPress={() => handleLinkClick(cell.url ?? "")}
                                        >
                                            <Text style={styles.headerLinkText}>
                                                {cell.text}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                }

                                return (
                                    <Text key={i} style={styles.headerCell}>
                                        {cell.text}
                                    </Text>
                                );
                            })}
                        </View>


                        {item.rows.map((row, rIndex) => (
                            <View key={rIndex} style={styles.row}>
                                {row.cells.map((cell, cIndex) =>
                                    renderCell(cell, cIndex)
                                )}
                            </View>
                        ))}

                    </View>
                )}
            />
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        padding: 12,
    },

    table: {
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "#ddd",
        borderRadius: 6,
        overflow: "hidden",
    },

    row: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#eee",
    },

    cell: {
        flex: 1,
        padding: 8,
        fontSize: 13,
        color: "#000",
    },

    headerCell: {
        flex: 1,                 // 👈 IMPORTANT
        padding: 8,
        fontWeight: "700",
        textAlign: "center",
    },
    ctaCell: {
        flex: 1,
        paddingVertical: 10,
        margin: 4,

        borderRadius: 6,
        alignItems: "center",
        justifyContent: "center",
    },

    ctaText: {
        color: "#0000ff",
        fontWeight: "700",
        fontSize: 15,
    },
    headerRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderColor: "#ccc",
        backgroundColor: "#f2f2f2",
    },
    headerLinkText: {
        fontWeight: "700",
        color: "#1e40ff",
        textAlign: "center",
    },
    listCell: {
        flex: 1,
        padding: 8,
    },

    listItem: {
        fontSize: 14,
        marginBottom: 4,
        lineHeight: 20,
    },
    linkText: {
        color: "#1e40ff",
        textAlign: "center",
    },
});
