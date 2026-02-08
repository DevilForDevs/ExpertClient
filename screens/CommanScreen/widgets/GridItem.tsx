import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import React from 'react'
import { Video } from '../../../utils/types'

type Props = {
    video: Video,
    onItemClick: () => void;
}

export default function GridItem({ video, onItemClick }: Props) {

    return (
        <View style={styles.card}>

            <TouchableOpacity style={styles.thumbWrap} onPress={onItemClick}>
                <Image
                    source={{ uri: video.thumbnail }}
                    style={styles.thumbnail}
                />

                <View style={styles.durationBox}>
                    <Text style={styles.durationText}>{video.duration}</Text>
                </View>

            </TouchableOpacity>

            <Text style={styles.title} numberOfLines={1}>
                {video.title}
            </Text>

            <View style={styles.channelRow}>
                <View style={styles.channelLeft}>
                    <Image
                        source={{ uri: video.channel }}
                        style={styles.avatar}
                    />
                    <Text style={styles.channelName} numberOfLines={1}>
                        {video.channelName} |
                    </Text>
                </View>

                <Text style={styles.views}>{video.views}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        width: 180
    },

    /* Thumbnail */
    thumbWrap: {
        position: 'relative',
    },
    thumbnail: {
        width: '100%',
        height: 100,
        backgroundColor: '#eee',
    },
    durationBox: {
        position: 'absolute',
        right: 6,
        bottom: 6,
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    durationText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '500',
    },

    /* Title */
    title: {
        marginTop: 6,
        fontSize: 14,
        fontWeight: '500',
        color: '#111',
    },

    /* Channel Row */
    channelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 150
    },
    channelLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 18,
        height: 18,
        borderRadius: 9,
        marginRight: 5
    },
    channelName: {
        fontSize: 12,
        color: "black",
        flexShrink: 1,
    },
    views: {
        fontSize: 11,
        color: '#777',
        marginLeft: 5
    },
})
