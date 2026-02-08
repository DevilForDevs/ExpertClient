import {
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
    StatusBar,
    Platform, NativeModules, ActivityIndicator
} from 'react-native'
import React, { useState, useEffect, useMemo, } from 'react'
import {
    TabView,
    TabBar,
    TabBarProps,
} from 'react-native-tab-view'
import ChannelHeader from './widgets/ChannelHeader'
import VideosTab from './widgets/VideosTab'
import PlaylistTab from './widgets/PlaylistTab'
import ShortsTab from './widgets/ShortsTab'
import { RouteProp, useRoute } from "@react-navigation/native";
import { parseChannelInfo } from '../../utils/channelVideosParser'

export default function ChannelScreen() {
    console.log("insdied channelscreen");
    const STATUS_BAR_HEIGHT =
        Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0;

    type NavigationProp = RouteProp<RootStackParamList, "ChannelScreen">;

    const ALLOWED_TABS = ["videos", "shorts", "playlists"] as const;
    type AllowedTabKey = typeof ALLOWED_TABS[number];

    type ChannelRoute = {
        key: AllowedTabKey;
        title: string;
    };

    const route = useRoute<NavigationProp>();
    const { channelUrl } = route.params;

    const layout = useWindowDimensions();
    const { MyNativeModule } = NativeModules;

    const [metaData, setMetaData] = useState<Channel | null>(null);
    const [index, setIndex] = useState(0);

    const normalizeTabKey = (title: string): AllowedTabKey | null => {
        const t = title.toLowerCase();
        if (t.includes("video")) return "videos";
        if (t.includes("short")) return "shorts";
        if (t.includes("playlist")) return "playlists";
        return null;
    };

    // 🔒 routes are memoized & stable
    const routes: ChannelRoute[] = useMemo(() => {
        if (!metaData) return [];

        return metaData.channelTabs
            .map(tab => {
                const key = normalizeTabKey(tab.title);
                if (!key) return null;

                return { key, title: tab.title };
            })
            .filter(Boolean) as ChannelRoute[];
    }, [metaData]);

    // 🔁 reset index when routes change
    useEffect(() => {
        setIndex(0);
    }, [routes.length]);

    const renderScene = ({ route }: { route: ChannelRoute }) => {
        if (!metaData) return null;

        const tab = metaData.channelTabs.find(
            t => normalizeTabKey(t.title) === route.key
        );

        if (!tab) return null;

        switch (route.key) {
            case "videos":
                return <VideosTab tab={tab} />;

            case "playlists":
                return <PlaylistTab tab={tab} />;

            case "shorts":
                return <ShortsTab tab={tab} />;

            default:
                return null;
        }
    };

    const renderTabBar = (props: TabBarProps<ChannelRoute>) => (
        <TabBar
            {...props}
            indicatorStyle={styles.indicator}
            style={styles.tabBar}
        />
    );

    async function fetchChannelInfo() {
        const jsonString = await MyNativeModule.getYtPlaylistBrowse(
            "browseId",
            channelUrl, null
        );
        const result = parseChannelInfo(JSON.parse(jsonString));
        setMetaData(result);
    }

    useEffect(() => {
        fetchChannelInfo();
    }, [channelUrl]);

    // ⛔ wait until metadata + routes exist
    if (!metaData || routes.length === 0) {
        return (
            <View style={styles.centerState}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <View style={[styles.container, { paddingTop: STATUS_BAR_HEIGHT }]}>
            <ChannelHeader channelDetails={metaData} />

            <TabView
                navigationState={{ index, routes }}
                renderScene={renderScene}
                onIndexChange={setIndex}
                initialLayout={{ width: layout.width }}
                renderTabBar={renderTabBar}
            />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        height: 56,
        justifyContent: 'center',
        paddingHorizontal: 16,
    },
    title: {
        color: 'black',
        fontSize: 18,
        fontWeight: '700',
    },
    scene: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabBar: {

    },
    indicator: {
        backgroundColor: '#fff',
    },
    label: {
        color: '#fff',
        fontWeight: '600',
    },
    img: {
        height: 100,
        width: '100%',
        resizeMode: 'cover'
    },

    avtar: {
        height: 50,
        width: 50,
        borderRadius: 25,
        marginHorizontal: 7
    }
    ,
    secondRow: {
        flexDirection: "row",
        marginVertical: 2,
        alignItems: "center"
    }
    ,
    channeTitle: {
        fontSize: 24,
        fontWeight: 600
    }
    ,
    channelstatics: {
        fontSize: 16,
        color: "#717171"
    },
    centerState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 40,
    },

})
