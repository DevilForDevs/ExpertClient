import React from 'react'
import { Image, StyleSheet, Text, View, Pressable } from 'react-native'
import Icon from 'react-native-vector-icons/MaterialIcons'
import { useNavigation } from '@react-navigation/native'

type Props = {
    channelDetails: Channel
}

export default function ChannelHeader({ channelDetails }: Props) {
    const navigation = useNavigation<navStack>();
    return (
        <View>
            {/* Banner */}
            <View style={styles.bannerWrapper}>
                <Image
                    source={{ uri: channelDetails.photo }}
                    style={styles.banner}
                    resizeMode="cover"
                />

                {/* 🔙 Back Arrow */}
                <Pressable
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                >
                    <Icon name="arrow-back" size={24} color="#fff" />
                </Pressable>
            </View>

            {/* Avatar + Info */}
            <View style={styles.row}>
                <Image
                    source={{ uri: channelDetails.posterUrl }}
                    style={styles.avatar}
                    resizeMode="cover"
                />

                <View style={styles.textContainer}>
                    <Text style={styles.title}>{channelDetails.name}</Text>
                    <Text style={styles.stats}>
                        {channelDetails.name} • {channelDetails.subscribers} • {channelDetails.totalVideos}
                    </Text>
                    <Text style={styles.stats}>
                        Description
                    </Text>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    bannerWrapper: {
        position: 'relative',
    },
    banner: {
        height: 70,
        width: '100%',
    },
    backBtn: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
        padding: 6,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
        paddingHorizontal: 8,
    },
    avatar: {
        height: 50,
        width: 50,
        borderRadius: 25,
        marginRight: 8,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '600',
    },
    stats: {
        fontSize: 16,
        color: '#717171',
    },
})
