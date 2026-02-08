import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/Ionicons';

type Props = {
    onDownload: () => void,
    likes: string,
    commentCount: string,
    onMenuPress?: () => void
}

export default function RightControls(props: Props) {
    return (
        <View style={styles.rightControls}>
            <TouchableOpacity style={styles.button} onPress={props.onMenuPress}>
                <Icon name="ellipsis-horizontal" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
                <Image source={require("../../assets/shortsIcons/likeWhite.png")} style={styles.rightIcons} />
                <Text style={styles.text}>{props.likes}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
                <Image source={require("../../assets/shortsIcons/dislikewhite.png")} style={styles.rightIcons} />
                <Text style={styles.text}>{ }</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
                <Image source={require("../../assets/shortsIcons/commentWhite.png")} style={styles.rightIconsBig} />
                <Text style={styles.text}>{props.commentCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => props.onDownload()}>
                <Image source={require("../../assets/shortsIcons/shareWhite.png")} style={styles.rightIconsBig} />
                <Text style={styles.text}>Share</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    rightControls: {
        position: "absolute",
        right: 10,
        bottom: "10%",
        alignItems: "center",
        gap: 7
    },
    button: {
        alignItems: "center"
    }
    ,
    text: {
        color: "white"
    },
    rightIcons: {
        height: 40,
        width: 40
    }
    ,
    rightIconsBig: {
        height: 30,
        width: 30
    }
})