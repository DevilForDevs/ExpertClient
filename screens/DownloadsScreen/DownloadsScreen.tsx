import {
    FlatList,
    StyleSheet, NativeModules
} from 'react-native'
import React, { useState } from 'react'
import TopBar from './widgets/TopBar'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { DownloadsStore } from '../../utils/Store'
import DownloadItemView from './widgets/DownloadItem'

export default function DownloadsScreen() {
    const navigation = useNavigation<navStack>()
    const { totalDownloads } = DownloadsStore()
    const [openMenuVideoId, setOpenMenuVideoId] = useState<string | null>(null)
    const { MyNativeModule } = NativeModules;

    async function handleMenuClick(option: string) {
        const mid = openMenuVideoId;
        setOpenMenuVideoId(null);
        if (mid != null) {
            if (option == "cancel") {
                await MyNativeModule.cancelDownload(mid);
            }
            if (option == "resume") {
                return;
            }
        }
    }



    return (
        <SafeAreaView style={styles.root}>
            <TopBar
                onLensPress={() => navigation.navigate('SearchScreen')}
                onBackPress={() => navigation.goBack()}
            />

            <FlatList
                data={totalDownloads}
                keyExtractor={(item) => item.video.videoId}
                renderItem={({ item }) => (
                    <DownloadItemView
                        item={item}
                        onItemPress={() => navigation.navigate("OfflinePlayer", { item })}
                        isMenuOpen={openMenuVideoId === item.video.videoId}
                        onMenuToggle={() =>
                            setOpenMenuVideoId(prev =>
                                prev === item.video.videoId ? null : item.video.videoId
                            )
                        }
                        onMenuClose={(option) => {
                            handleMenuClick(option)
                        }
                        }
                    />
                )}
                contentContainerStyle={styles.list}
            />

        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        paddingTop: 10,
    },
    list: {
        marginTop: 10,
        paddingHorizontal: 10,
        gap: 12,
    }

})
