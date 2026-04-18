import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import React from 'react';
import { Video } from '../../../utils/types';
import { getTitleFromUrl } from '../backEnds/utils';
type Props = {
    video: Video;
    onItemClick: () => void;
};

export default function VideoRowItemView({ video, onItemClick }: Props) {

    return (
        <TouchableOpacity style={styles.root} onPress={onItemClick}>
            {/* Thumbnail */}
            <Image
                source={{ uri: video.thumbnail }}
                style={styles.thumbnail}
                resizeMode="stretch"
            />

            {/* Right content */}
            <View style={styles.content}>
                <Text
                    style={styles.title}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                >
                    {video.title || getTitleFromUrl(video.videoId ?? "")}
                </Text>

                <Text
                    style={styles.meta}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                >
                    {video.views} • {video.publishedOn}
                </Text>

                {video.duration && (
                    <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>{video.duration}</Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    root: {
        flexDirection: 'row',
        padding: 10,
        marginBottom: 12,
        alignItems: 'flex-start',
    },
    thumbnail: {
        width: 140,
        height: 120,
        borderRadius: 6,
        backgroundColor: '#eee',
    },
    content: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'space-between',
    },
    title: {
        fontFamily: 'Roboto-Medium',
        fontSize: 16,
        marginBottom: 4,
    },
    meta: {
        fontFamily: 'Roboto-Medium',
        fontSize: 14,
        color: '#6C6C6C',
    },
    durationBadge: {
        alignSelf: 'flex-start',
        marginTop: 6,
        backgroundColor: '#000',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    durationText: {
        color: '#fff',
        fontSize: 12,
    },
});