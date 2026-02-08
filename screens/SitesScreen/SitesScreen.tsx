import React, { useEffect, useRef, useState } from 'react'
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useSharedFilesStore } from '../../utils/Store'
import { videoId } from '../../utils/Interact'
import { Video } from '../../utils/types'

/* ------------------ Data ------------------ */

/* ------------------ Data ------------------ */

const SITES: Site[] = [
    { id: 'yt', name: 'YouTube', url: 'https://www.youtube.com', route: 'BrowserScreen' },
    { id: 'ig', name: 'Easy Links', url: 'Easy links', route: 'BrowserScreen' }, // new default
    { id: 'xh', name: 'xHamster', url: 'https://xhamster1.desi/', route: 'BrowserScreen' },
    { id: 'mp', name: 'MetaPorn', url: 'https://metaporn.com', route: 'BrowserScreen' },
    { id: 'um', name: 'Uncutmaza', url: 'https://uncutmaza.com.co/', route: 'BrowserScreen' },
    { id: 'xmz', name: 'xmaza.tv', url: 'https://xmaza.tv/', route: 'BrowserScreen' },
    { id: 'dpt', name: 'desi-porn', url: 'https://desi-porn.tube/', route: 'BrowserScreen' },
]


/* ------------------ Screen ------------------ */

export default function SitesScreen() {
    const navigation = useNavigation<navStack>()
    const { files, addFile, setFiles, clearFiles } = useSharedFilesStore();

    const [showAll, setShowAll] = useState(false)
    const tapCount = useRef(0)

    function onHeaderPress() {
        if (!showAll) {
            tapCount.current += 1

            if (tapCount.current === 3) {
                setShowAll(true)
                tapCount.current = 0
            }
        } else {
            // one tap hides again
            setShowAll(false)
        }
    }

    useEffect(() => {
        for (const item of files as SharedFile[]) {
            if (item.weblink) {
                const ytVideoId = videoId(item.weblink)

                const requiredVideo: Video = {
                    type: 'video',
                    videoId: ytVideoId,
                    title: '',
                    views: 'NO views',
                };
                navigation.navigate("VideoPlayerScreen", { arrivedVideo: requiredVideo, playlistId: undefined })
                break;
            }
        }
    }, [files])

    function onSelectSite(site: Site) {
        if (site.name === 'YouTube') {
            navigation.navigate('BrowserScreen', { name: 'Youtube' })
        } else {
            if (site.id == "ig") {
                navigation.navigate("SarkariResult");
            } else {
                navigation.navigate('CommanScreen', { site })
            }

        }
    }

    const visibleSites = showAll
        ? SITES
        : SITES.filter(site => site.id === 'yt' || site.id === 'ig') // show YouTube & Instagram by default

    const renderItem = ({ item }: { item: Site }) => (
        <Pressable style={styles.card} onPress={() => onSelectSite(item)}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>{item.url}</Text>
        </Pressable>
    )

    return (
        <SafeAreaView style={styles.container}>
            <Pressable onPress={onHeaderPress}>
                <Text style={styles.screenTitle}>
                    {showAll ? 'Sites' : 'Platforms'}
                </Text>
            </Pressable>

            <FlatList
                data={visibleSites}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
            />
        </SafeAreaView>
    )
}

/* ------------------ Styles ------------------ */

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f6f6f6',
    },
    screenTitle: {
        fontSize: 22,
        fontWeight: '700',
        padding: 16,
    },
    list: {
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        elevation: 2,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
})
