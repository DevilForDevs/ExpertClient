import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import React from 'react'

type Props = {
    channelName: string,
    channelPhoto: string,
    subscriberCount: string,
    onChannelClick: () => void;
}
export default function ChannelDetails(props: Props) {
    return (
        <View style={styles.channelBlock}>
            <View style={styles.channelDetail}>
                <TouchableOpacity onPress={props.onChannelClick} >
                    <Image source={{ uri: props.channelPhoto }} style={styles.channelPhoto} />
                </TouchableOpacity>
                <View>
                    <Text style={{ fontFamily: "Roboto-Medium", fontSize: 16 }}>
                        {props.channelName}
                    </Text>
                    <Text style={{ fontFamily: "Roboto-Regular", fontSize: 14, color: "#6C6C6C" }}>
                        {props.subscriberCount}
                    </Text>
                </View>
            </View>
            <TouchableOpacity>
                <Text style={{ fontFamily: "Roboto-Medium", fontSize: 16, color: "red" }}>
                    SUBSCRIBE
                </Text>
            </TouchableOpacity>

        </View>
    )
}

const styles = StyleSheet.create({
    channelBlock: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
        paddingHorizontal: 10,
        alignItems: "center"

    }
    ,
    channelPhoto: {
        height: 50,
        width: 50,
        borderRadius: 50
    }
    ,
    channelDetail: {
        flexDirection: "row",
        gap: 10
    }
})