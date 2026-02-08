import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, BackHandler, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { useNavigation } from "@react-navigation/native";
import { HOME_HTML } from "../../utils/suggestedsiteshtml";
import { useSharedFilesStore } from "../../utils/Store";
import { videoId } from "../../utils/Interact";
import { Video } from '../../utils/types'

export default function SuggestedSites() {
    const navigation = useNavigation<navStack>();
    const webViewRef = useRef<WebView>(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [currentUrl, setCurrentUrl] = useState<string | null>(null);
    const { files, addFile, setFiles, clearFiles } = useSharedFilesStore();



    useEffect(() => {
        if (Platform.OS !== "android") return;

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            () => {
                if (canGoBack && webViewRef.current) {
                    webViewRef.current.goBack();
                    return true; // ⛔ prevent screen pop
                }
                return false; // allow navigation stack to handle
            }
        );

        return () => backHandler.remove();
    }, [canGoBack]);

    useEffect(() => {

        if ("https://m.youtube.com/" == currentUrl) {
            navigation.navigate("BrowserScreen", { name: "" })
        }
        if ("https://www.sarkariresult.com/" == currentUrl) {
            navigation.navigate("SarkariResult")
        }

        // if (currentUrl?.includes("xhamster")) {
        //     navigation.navigate("CommanScreen", { site: { id: 'xh', name: 'xHamster', url: 'https://xhamster1.desi/', route: 'BrowserScreen' } })
        // }

        // if (currentUrl?.includes("uncutmaza")) {
        //     navigation.navigate("CommanScreen", { site: { id: 'xh', name: 'uncutmaza', url: 'https://uncutmaza.com.co/', route: 'BrowserScreen' } })
        // }

        // if (currentUrl?.includes("xmaza.tv")) {
        //     navigation.navigate("CommanScreen", { site: { id: 'xh', name: 'xmaza.tv', url: 'https://xmaza.tv/', route: 'BrowserScreen' } })
        // }

        // if (currentUrl?.includes("desiporn.tube")) {
        //     navigation.navigate("CommanScreen", { site: { id: 'xh', name: 'desi-porn', url: 'https://desi-porn.tube/', route: 'BrowserScreen' } })
        // }

    }, [currentUrl])

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
                if (item.weblink.includes("shorts")) {
                    navigation.navigate("ShortsPlayerScreen", { arrivedVideo: requiredVideo })
                } else {
                    navigation.navigate("VideoPlayerScreen", { arrivedVideo: requiredVideo, playlistId: undefined })
                }
                break;
            }
        }
    }, [files])


    return (
        <SafeAreaView style={styles.container}>
            <View style={{ flex: 1 }}>
                <WebView
                    ref={webViewRef}
                    source={{ html: HOME_HTML }}
                    javaScriptEnabled
                    domStorageEnabled
                    sharedCookiesEnabled
                    thirdPartyCookiesEnabled
                    allowsInlineMediaPlayback
                    mediaPlaybackRequiresUserAction={false}
                    startInLoadingState
                    allowsFullscreenVideo
                    scalesPageToFit
                    onNavigationStateChange={(navState) => {
                        setCanGoBack(navState.canGoBack);
                        setCurrentUrl(navState.url);
                    }}
                    style={{ flex: 1 }}
                />

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
});
