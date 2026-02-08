import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import Icon from 'react-native-vector-icons/MaterialIcons'


import { Video } from '../../../utils/types';
type Props = {
    item: Video,
    onItemPress: () => void;
    progress: number;
    isShort: boolean

}




export default function VideoItemView({ item, onItemPress, progress, isShort }: Props) {
    return (
        <View style={styles.root}>
            <TouchableOpacity onPress={onItemPress}>
                <Image source={{ uri: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg` }} style={styles.img} />
            </TouchableOpacity>

            {progress === 0 ? <View /> : <View style={{ backgroundColor: "#ddd", height: 2, width: "100%" }}>
                <View
                    style={{
                        backgroundColor: "red",
                        height: 2,
                        width: `${progress * 100}%`,
                    }}
                />
            </View>}

            {
                isShort ? <View style={styles.shortLab}>
                    <Image source={require("../../../assets/Frame 14.png")} style={{ height: 10, width: 10 }} />
                    <Text style={{fontFamily:"Roboto-Medium"}}>SHORT</Text>
                </View> : <Text style={styles.floatingDuraton}>
                    {item.duration}
                </Text>
            }



            <View style={styles.info}>
                {/* profile */}
                <Image source={{ uri: item.channel }} style={styles.profile} />

                {/* right side (title + subtitle) */}
                <View style={styles.rightSection}>
                    {/* title + dots */}
                    <View style={styles.titleRow}>
                        <Text
                            style={{ fontFamily: "Roboto-Medium", fontSize: 16 }}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {item.title}
                        </Text>

                        <TouchableOpacity style={styles.vertMore}>
                            <Icon name="more-vert" size={22} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* subtitle */}
                    <Text
                        style={{ fontFamily: "Roboto-Medium", fontSize: 15, color: "#6C6C6C" }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                    >
                        {item.views} • {item.publishedOn}
                    </Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    root: {},
    img: {
        height: 200,
        width: "100%",
        resizeMode: "cover",
    },
    profile: {
        height: 42,
        width: 42,
        borderRadius: 21,
        marginRight: 10,
    },
    info: {
        marginTop: 10,
        paddingHorizontal: 10,
        flexDirection: "row",
        alignItems: "flex-start",
    },
    rightSection: {
        flex: 1, // everything right of profile
    },
    titleRow: {
        flexDirection: "row",
        paddingRight: 15,
        justifyContent: "space-between"
    },

    vertMore: {
        marginRight: 10
    }
    ,
    floatingDuraton: {
        position: "absolute",
        backgroundColor: "white",

        paddingHorizontal: 5,
        borderRadius: 3,
        bottom: 85,
        right: 10
    }
    ,
    progress: {

    }
    ,
    shortLab: {
        position: "absolute",
        backgroundColor: "white",
        paddingHorizontal: 5,
        borderRadius: 3,
        bottom: 75,
        right: 15,
        flexDirection: "row",
        alignItems: "center",
        gap: 5
    }
})

// 19,210,251 viewsJul • 1, 2016
