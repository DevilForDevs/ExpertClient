import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import Icon from "react-native-vector-icons/Ionicons";
import AutoplayButton from './AutoplayButton';

type props = {
    showMenu: () => void;
    distroyScreen: () => void;
    onToggle?: (enabled: boolean) => void;
}

export default function TopConrols(props: props) {
    return (
        <View style={styles.topControls}>
            <TouchableOpacity onPress={props.distroyScreen}>
                <Icon name="chevron-down" size={28} color="white" />
            </TouchableOpacity>
            <View style={styles.rightIcons}>

                <AutoplayButton
                    enabled={true}
                    onToggle={(val) => console.log('Autoplay toggled:', props.onToggle?.(val))}
                />
                <TouchableOpacity>
                    <Image source={require("../../../assets/cast.png")} style={styles.topIcon} />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Image source={require("../../../assets/caption.png")} style={styles.topIcon} />
                </TouchableOpacity>
                <TouchableOpacity onPress={props.showMenu}>
                    <Image source={require("../../../assets/threedot.png")} style={styles.topIcon} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    topControls: {
        position: "absolute",
        top: 15,
        left: 0,
        paddingHorizontal: 10,
        paddingVertical: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        zIndex: 10
    }
    ,
    rightIcons: {
        flexDirection: "row",
        gap: 10
    },
    topIcon: {
        height: 25,
        width: 28
    }
    ,
    autoPlay: {
        height: 25,
        width: 35
    }
})