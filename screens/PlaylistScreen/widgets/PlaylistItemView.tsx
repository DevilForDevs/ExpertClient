import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { ytThumbs } from '../../../utils/downloadFunctions';
import { Video } from '../../../utils/types';


type Props = {
    video: Video,
    onMenuClick: () => void;
    onItemClick: () => void;
}
export default function PlaylistItemView(props: Props) {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';

    const colors = {
        primary: isDark ? '#FFFFFF' : '#0F0F0F',
        secondary: isDark ? '#B0B0B0' : '#606060',
        overlay: 'rgba(0,0,0,0.6)',
    };

    return (
        <View style={styles.root}>
            {/* Thumbnail */}
            <View style={styles.thumbnailWrapper}>
                <Image
                    source={{ uri: ytThumbs(props.video.videoId).hq }}
                    style={styles.thumbnail}
                />
                <Text style={styles.duration}>{props.video.duration}</Text>
            </View>

            {/* Info */}
            <TouchableOpacity style={styles.info} onPress={props.onItemClick}>
                <View style={styles.titleRow}>
                    <Text
                        numberOfLines={2}
                        style={[styles.title, { color: colors.primary }]}
                    >
                        {props.video.title}
                    </Text>

                    <TouchableOpacity onPress={props.onMenuClick}>
                        <Icon
                            name="ellipsis-vertical"
                            size={20}
                            color={colors.primary}
                        />
                    </TouchableOpacity>
                </View>
                <Text style={[styles.meta, { color: colors.secondary }]}>
                    {props.video.views} • {props.video.publishedOn}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flexDirection: 'row',
        paddingVertical: 8,
    },

    thumbnailWrapper: {
        width: 120,
        height: 80,
        marginRight: 12,
    },

    thumbnail: {
        width: '100%',
        height: '100%',
        borderRadius: 10,
    },

    duration: {
        position: 'absolute',
        right: 6,
        bottom: 6,
        fontSize: 12,
        color: '#FFF',
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },

    info: {
        flex: 1,
        justifyContent: 'center',
    },

    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 8,
    },

    title: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'Roboto-Medium',
        lineHeight: 22,
    },

    meta: {
        fontSize: 14,
        fontFamily: 'Roboto-Regular',
        marginTop: 2,
    },
});
