import React from "react";
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet
} from "react-native";

type Props = {
    visible: boolean;
    resolutions: VideoTrack[];
    onSelect: (res: VideoTrack) => void;
    onClose: () => void;
};

export default function ResolutionBottomSheet(props: Props) {
    return (
        <Modal
            visible={props.visible}
            transparent
            animationType="slide"
            onRequestClose={props.onClose}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={props.onClose}
            >
                <View style={styles.bottomSheet}>
                    <Text style={styles.title}>Video Quality</Text>

                    {props.resolutions.map(res => (
                        <TouchableOpacity
                            key={res.trakIndex ?? res.bitrate}
                            onPress={() => props.onSelect(res)}
                            style={styles.item}
                        >
                            <Text style={styles.text}>
                                {res.height}p
                            </Text>

                            {res.selected && (
                                <Text style={styles.check}>✓</Text>
                            )}
                        </TouchableOpacity>
                    ))}

                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: "#00000066",
    },
    bottomSheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "white",
        padding: 15,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 10,
    },
    item: {
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    text: {
        fontSize: 18,
        fontWeight: "500",
    },
    check: {
        color: "#e11d48",
        fontSize: 20,
        fontWeight: "600",
    },
});
