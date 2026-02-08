import React from 'react'
import { View, Text, StyleSheet, Pressable, Image } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { Video } from '../../../utils/types'


type Props = {
    item: Video,
    onPress: () => void;
}

export default function PlaylistCard(props: Props) {
    return (
        <Pressable
            style={styles.container}
            onPress={props.onPress}
        >
            {/* Thumbnail */}
            <View style={styles.thumbWrapper}>
                <Image
                    source={{
                        uri: props.item.videoId
                            ? `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`
                            : undefined,
                    }}
                    style={styles.thumbnail}
                />

                {/* Video count overlay */}
                {props.item.views && (
                    <View style={styles.countBadge}>
                        <Icon name="playlist-play" size={16} color="#fff" />
                        <Text style={styles.countText}>{props.item.views}</Text>
                    </View>
                )}
            </View>

            {/* Info */}
            <View style={styles.info}>
                <Text
                    style={styles.title}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {props.item.title || 'Untitled playlist'}
                </Text>

                <Text style={styles.subText}>Playlist</Text>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingHorizontal: 8,
        gap: 12,
    },
    thumbWrapper: {
        position: 'relative',
    },
    thumbnail: {
        height: 90,
        width: 160,
        borderRadius: 8,
        backgroundColor: '#333',
    },
    countBadge: {
        position: 'absolute',
        bottom: 6,
        right: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(0,0,0,0.8)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    countText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    subText: {
        marginTop: 4,
        fontSize: 13,
        color: '#aaa',
    },
})

