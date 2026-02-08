import {
    StyleSheet,
    Text,
    View,
    FlatList,
    StatusBar,
    Platform,
} from 'react-native'
import React, { useEffect, useMemo, useState } from 'react'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import RNFS from 'react-native-fs'

import Player from '../VideoPlayerScreen/widgets/Player'
import DownloadItemView from '../DownloadsScreen/widgets/DownloadItem'
import { DownloadsStore } from '../../utils/Store'
import { DownloadItem } from '../../utils/types'

type NavigationProp = RouteProp<RootStackParamList, 'OfflinePlayer'>

export default function OfflinePlayer() {
    const navigation = useNavigation<navStack>()
    const route = useRoute<NavigationProp>()
    const { item } = route.params

    const { totalDownloads } = DownloadsStore()

    // 🔗 Current video path
    const [localFile, setLocalFile] = useState<string>(
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    )

    const [showFlatList, setShowFlatList] = useState(true)

    // 📁 Set initial video
    useEffect(() => {
        if (item?.message === 'Video' || item?.message === 'Finished') {
            const movieDir = `${RNFS.ExternalStorageDirectoryPath}/Movies`
            setLocalFile(`${movieDir}/${item.video.title}`)
        }
    }, [item])

    // 📝 Extract filename
    const currentTitle = useMemo(() => {
        if (!localFile) return ''
        return localFile.split('/').pop() ?? ''
    }, [localFile])

    const toggleFlatList = () => {
        setShowFlatList(prev => !prev)
    }

    const handleItemClick = (download: DownloadItem) => {
        const movieDir = `${RNFS.ExternalStorageDirectoryPath}/Movies`
        setLocalFile(`${movieDir}/${download.video.title}`)
    }

    const handleProgressSave = (videoId: string, position: number) => {
        // optional: save offline progress
    }

    const handleMoreVert = () => {
        // optional: menu actions
    }

    return (
        <View
            style={[
                styles.container,
                {
                    paddingTop:
                        showFlatList && Platform.OS === 'android'
                            ? StatusBar.currentHeight
                            : 0,
                },
            ]}
        >
            <StatusBar hidden={!showFlatList} />
            <Player
                key={localFile} // 🔥 force reload
                url={localFile}
                toggleFlatList={toggleFlatList}
                videoId={localFile}
                showMenu={handleMoreVert}
                onProgressSave={handleProgressSave}
                distroyScreen={() => navigation.pop()}
                startAsScreen={false}
            />

            {/* 📥 Downloads list */}
            {showFlatList && (
                <FlatList
                    data={totalDownloads}
                    keyExtractor={item => item.video.videoId}
                    renderItem={({ item }) => (
                        <DownloadItemView
                            item={item}
                            onItemPress={() => handleItemClick(item)}

                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        <View style={styles.titleBar}>
                            <Text
                                numberOfLines={2}
                                ellipsizeMode="tail"
                                style={styles.playingTitle}
                            >
                                {currentTitle}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    titleBar: {
        paddingVertical: 6,
        backgroundColor: '#f5f5f5',
    },
    playingTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#000',
    },
    listContent: {
        paddingHorizontal: 10,
        gap: 12,
    },
})
