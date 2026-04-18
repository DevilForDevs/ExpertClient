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



export default function SitesScreen() {

    const navigation = useNavigation<navStack>()
    const { files, addFile, setFiles, clearFiles } = useSharedFilesStore();

    const DEFAULT_SITES: Site[] = [
        { id: 'yt', name: 'YouTube', url: 'https://www.youtube.com', route: 'BrowserScreen' },
        { id: 'ig', name: 'Easy Links', url: 'Easy links', route: 'BrowserScreen' },
    ]

    const [sites, setSites] = useState<Site[]>(DEFAULT_SITES)

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
        switch (site.id) {
            case 'yt':
                navigation.navigate('BrowserScreen', { name: 'Youtube' });
                break;

            case 'ig':
                navigation.navigate('SarkariResult');
                break;

            case 'mp4m':
                navigation.navigate("MoviesRepo", { site });
                break;

            default:
                navigation.navigate('CommanScreen', { site });
        }
    }

    const visibleSites = showAll
        ? sites
        : sites.filter(site => site.id === 'yt' || site.id === 'ig')

    const renderItem = ({ item }: { item: Site }) => (
        <Pressable style={styles.card} onPress={() => onSelectSite(item)}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>{item.url}</Text>
        </Pressable>
    )


    useEffect(() => {
        async function loadSites() {
            try {
                const res = await fetch('https://studyzem.com/sites.json')

                if (!res.ok) throw new Error('Network error')

                const data = await res.json()

                if (Array.isArray(data)) {
                    setSites(data)
                }
            } catch (err) {
                console.log('Using default sites:', err)
                // fallback already handled
            }
        }

        loadSites()
    }, [])

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
