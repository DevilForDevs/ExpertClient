import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import Icon from 'react-native-vector-icons/Ionicons';
import { Bar } from "react-native-progress";   // ✅ named import
import { DownloadItem } from '../../../utils/types';


type Props = {
    item: DownloadItem
    onItemPress: () => void
    isMenuOpen: boolean
    onMenuToggle: () => void
    onMenuClose: (option: string) => void,
}
export default function DownloadItemView(props: Props) {
    const videoId = props.item.video.videoId
    return (
        <View style={styles.root}>

            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` }}
                    style={styles.image}
                />

                <Text style={styles.floatingDuration}>{props.item.video.duration}</Text>
            </View>

            <TouchableOpacity onPress={() => props.onItemPress()}>

                <View style={styles.info}>

                    <View style={styles.tileAndMore}>
                        <Text
                            style={styles.title}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                        >
                            {props.item.video.title}
                        </Text>

                        <TouchableOpacity onPress={props.onMenuToggle} hitSlop={10}>
                            <Icon name="ellipsis-vertical" size={22} color="black" />
                        </TouchableOpacity>
                    </View>


                    <Text style={{
                        fontFamily: "Roboto-Regular",
                        fontSize: 14,
                        color: "#6C6C6C"
                    }}>
                        {props.item.transferInfo}
                    </Text>
                    <Text style={{
                        fontFamily: "Roboto-Regular",
                        fontSize: 14,
                        color: "#6C6C6C"
                    }}>
                        {props.item.isFinished ? props.item.video.views : props.item.message}

                    </Text>
                    <Bar progress={props.item.progressPercent / 100} height={3} />


                </View>
            </TouchableOpacity>

            {props.isMenuOpen && (
                <View style={styles.floatingMenu}>
                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            props.onMenuClose("resume")
                        }}
                    >
                        <Text style={styles.menuText}>Resume</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => {
                            props.onMenuClose("cancel")
                        }}
                    >
                        <Text style={[styles.menuText, { color: 'red' }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            )}



        </View>
    )
}

const styles = StyleSheet.create({
    imageWrapper: {
        height: 90,
        width: 160
    }
    ,
    image: {
        height: 90,
        width: 160
    }
    ,
    root: {
        flexDirection: 'row',
        gap: 10,
        alignItems: "center"
    }
    ,
    tileAndMore: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
        alignItems: 'center',

    },

    title: {
        fontFamily: 'Roboto-Regular',
        fontSize: 16,
        width: 190
    }
    ,
    info: {
        gap: 2,
        marginBottom: 5
    }
    ,
    floatingDuration: {
        position: "absolute",
        bottom: 5,
        right: 10,
        backgroundColor: "rgba(10, 10, 10, 0.4)",
        borderRadius: 5,
        color: "white",
        paddingHorizontal: 5
    },
    floatingMenu: {
        position: 'absolute',
        top: 30,
        right: 10,
        width: 160,
        backgroundColor: '#fff',
        borderRadius: 8,
        elevation: 6,
        zIndex: 1000,
    },

    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },

    menuText: {
        fontSize: 15,
        fontFamily: 'Roboto-Regular',
    },


})