import { channelTabs } from "./utils/channelVideosParser";
import { DownloadItem, ShortVideo, Video } from "./utils/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
export { };

declare global {


    type SearchModelStore = {
        searchItems: Video | ShortVideo[],
        addSearchItem: (item: Video | ShortVideo[]) => void,
    }
    type initialData = {
        videos: VideoData[];
        shorts: ShortsData[];
        continuationTokens: string[];
    }
    export type BottomTabParamList = {
        Home: { initialData: initialData };
        Shorts: undefined;
        Upload: undefined;
        Subscriptions: undefined;
        Library: undefined;
    };
    type VideoData = {
        title: string | null;
        video_id: string | null;
        views: string | null;
        channel_name: string | null;
        channel_photo: string | null;
        channel_url: string | null;
        duration: string | null;
        publishedOn?: string
    };

    type ShortsData = {
        title: string | null;
        video_id: string | null;
        views: string | null;
    };

    type RootStackParamList = {
        SplashScreen: undefined,
        LoginScreen: undefined,
        BrowserScreen: { name: string },
        BottomNav: undefined,
        VideoPlayerScreen: { arrivedVideo: Video, playlistId: string | undefined };
        ShortsPlayerScreen: { arrivedVideo: Video },
        DownloadsScreen: undefined,
        SearchScreen: undefined,
        OfflinePlayer: { item: DownloadItem },
        PlaylistScreen: { playlistlink: string },
        ChannelScreen: { channelUrl: string },
        SitesScreen: undefined,
        CommanScreen: { site: Site },
        CommanPlayerScreen: { arrivedVideo: Video },
        CategoryScreen: { site: Site },
        CategoryItemsScreen: { link: string },
        SarkariResult: undefined,
        PageDetailsSr: { link: string },
        SuggestedSites: undefined,
        MoviesRepo: { site: Site }
        MoviesHubCatScreen: { arrivedVideo: Video }
    };

    type navStack = NativeStackNavigationProp<
        RootStackParamList
    >;

    type AskFormatOptions = {
        onSelect: (itag: number) => void;
    };

    type AskFormatContextType = {
        openAskFormat: (options: Video, onClose: (result: string) => void) => void;
        closeAskFormat: () => void;
    };

    export interface Channel {
        name?: string;
        canonicalUrl?: string;
        photo?: string;
        subscribers?: string;
        totalVideos?: string,
        posterUrl?: string,
        channelTabs: ChannelTab[]
    }

    export interface CategoryType {
        name: string,
        pageUrl: string,
        thumbnail?: string,
        videoCount?: string
    }
    type CategoryGroup = {
        name: string,
        categories: CategoryType[]
    }
    type VideoHeaders = {
        [key: string]: string;
    };

    export type StreamVariant = {
        ref: string;
        type: "hls" | "mp4"
        resolution?: string;
    };

    type Site = {
        id: string
        name: string
        url: string
        route?: string
    }

    type VideoTrack = {
        width?: number;
        height?: number;
        bitrate?: number;
        trakIndex?: number,
        selected?: boolean;
    };

    type pageItem = {
        title: string,
        link: string
    }

    type SharedFile = {
        filePath?: string;
        originalFileName?: string;
        extension?: string;
        type?: string;
        text?: string;
        contentUri?: string;
        weblink?: string;
    };



}
