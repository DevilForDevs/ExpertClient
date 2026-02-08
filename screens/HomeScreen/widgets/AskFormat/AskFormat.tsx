import { StyleSheet, Text, View, FlatList, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { AskFormatModel, FormatGroup } from '../../../../utils/types';
import { convertBytes } from '../../../../utils/Interact';


type Props = {
    closeRequest: () => void,
    onFormatSelection: (itag: number) => void,
    videoTitle: string,
    requiredFormats: AskFormatModel[]
}
export default function AskFormat(props: Props) {

    const [selectedFmt, setSelectedFmt] = useState<FormatGroup | null>(null);
    return (
        <View style={styles.container}>
            {/* MAIN FORMAT LIST */}
            <FlatList
                data={props.requiredFormats}
                keyExtractor={(item) => item.title}
                showsVerticalScrollIndicator={false}
                ListHeaderComponent={
                    <Text style={{
                        textAlign: "center",
                        fontSize: 16,
                        fontFamily: "Roboto-Medium"
                    }}>
                        {props.videoTitle}
                    </Text>
                }
                renderItem={({ item }) => (
                    <View style={styles.groupContainer}>
                        <Text style={styles.groupTitle}>{item.title}</Text>

                        <FlatList
                            data={item.formatGroup}
                            keyExtractor={(fmt) => fmt.itag.toString()}
                            numColumns={3}
                            columnWrapperStyle={styles.columnWrapper}
                            renderItem={({ item: fmt }) => {
                                const isSelected = selectedFmt?.itag === fmt.itag;
                                return (
                                    <TouchableOpacity
                                        style={[
                                            styles.formatItem,
                                            { backgroundColor: isSelected ? '#ff4444' : '#9D9D9D' },
                                        ]}
                                        onPress={() => setSelectedFmt(fmt)}
                                    >
                                        <Text style={styles.formatText}>{fmt.info}</Text>
                                    </TouchableOpacity>
                                );
                            }}
                        />
                    </View>
                )}
            />

            {/* ACTION BAR (Bottom) */}
            <View style={styles.bottomBar}>
                <Text style={styles.selectedInfo}>
                    {selectedFmt
                        ? `Selected: ${selectedFmt.info} (${convertBytes(selectedFmt.contentLength)})`
                        : 'No format selected'}
                </Text>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#888' }]}
                        onPress={() => props.closeRequest()}
                    >
                        <Text style={styles.buttonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.actionButton,
                            { backgroundColor: selectedFmt ? '#2196F3' : '#bbb' },
                        ]}
                        disabled={!selectedFmt}
                        onPress={() => {
                            props.closeRequest()
                            if (selectedFmt != undefined) {
                                props.onFormatSelection(selectedFmt?.itag)
                            }

                        }}
                    >
                        <Text style={styles.buttonText}>Download</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 12,
        backgroundColor: '#fff',
        flex: 1,
    },
    groupContainer: {
        marginBottom: 16,
    },
    groupTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 6,
    },
    formatItem: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 15,
    },
    formatText: {
        fontSize: 14,
        color: 'white',
        textAlign: 'center',
    },
    sizeText: {
        fontSize: 12,
        color: '#eee',
        marginTop: 4,
    },
    columnWrapper: {
        gap: 12,
        marginBottom: 10,
    },
    bottomBar: {
        borderTopWidth: 1,
        borderColor: '#eee',
        paddingVertical: 10,
    },
    selectedInfo: {
        fontSize: 14,
        marginBottom: 10,
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: '600',
    },
});


