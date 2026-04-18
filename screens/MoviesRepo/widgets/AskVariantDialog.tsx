import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, ListRenderItem, Dimensions } from 'react-native'
import React from 'react'


type props = {
    testedVariants: StreamVariant[],
    hideModal: () => void,
    testedAllVariants: boolean,
    variantSelected: (variant: StreamVariant) => void

}

const { height } = Dimensions.get("window");

export default function AskVariantDialog(props: props) {

    const renderVariant: ListRenderItem<StreamVariant> = ({ item }) => (
        <View style={styles.variantItem}>
            <Text style={{
                width: 300
            }}>{item.resolution || item.ref}</Text>
            <TouchableOpacity style={{
                padding: 5,
                backgroundColor: "red",
                borderRadius: 5
            }} onPress={() => {
                props.variantSelected(item)
                props.hideModal()
            }
            }>
                <Text style={{
                    color: "white"
                }}>Play</Text>
            </TouchableOpacity>
        </View>
    );

    return (

        <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>


                <View style={{ flexDirection: "row", alignItems: "center" }}>

                    {!props.testedAllVariants && (
                        <View style={{
                            flexDirection: "row",
                            gap: 10
                        }}>
                            <ActivityIndicator
                                style={{ marginLeft: 10 }}
                                size="small"
                                color="#000"
                            />
                            <Text>Testing Variants</Text>
                        </View>
                    )}
                </View>

                <FlatList
                    data={props.testedVariants}
                    renderItem={renderVariant}
                    keyExtractor={(item, index) => index.toString()}
                />

                <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => props.hideModal()}
                >
                    <Text style={{ color: "#fff" }}>Close</Text>
                </TouchableOpacity>
            </View>
        </View>

    )
}

const styles = StyleSheet.create({
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
        paddingVertical: 5,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        gap: 10

    },
    closeBtn: {
        backgroundColor: "red",
        padding: 10,
        borderRadius: 8,
        marginTop: 12,
        alignItems: "center",
    },
})