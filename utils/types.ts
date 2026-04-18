export interface Video {
  type: "video";
  videoId: string;
  title: string;
  duration?: string;
  views: string;
  channel?: string;
  publishedOn?: string;
  channelUrl?: string,
  channelName?: string,
  thumbnail?: string,
  pageUrl?: string,
  hls?: string; // 👈 NEW (optional)
  streamVariants?: StreamVariant[]
}

export interface VideoDescription {
  title: string,
  views: number,
  uploaded: string,
  hashTags: string,
  likes: string,
  dislikes: string,
  subscriber: string,
  commentsCount: string,
  channelPhoto: string,
  channelName: string,
  video: Video,
  hlsUrl?: string
  channelId?: string,
  streamingSources?: StreamVariant[],
  suggestedVideos?: Video[],
  streamingRefrer?: VideoHeaders
}

export interface ShortVideo {
  type: "shorts";   // plural, consistent
  videos: Video[];  // actual parsed videos,
  videoId: string;

}

export interface SearchResponse {
  videos: (Video | ShortVideo)[];
  continuation: string | null;
}

export interface VideoStore {
  //states
  totalVideos: (Video | ShortVideo)[];
  continuation: string;
  query: string;
  visitorData: string;
  //updates
  addVideo: (item: Video | ShortVideo) => void;
  setContinuation: (continuation: string) => void;
  setQuery: (query: string) => void;
  clearVideos: () => void;
  setVisitorData: (visitorData: string) => void;
};

export interface DownloadItem {
  video: Video;
  speed: string;
  isStopped: boolean;       // fixed typo
  isFinished: boolean;
  transferInfo: string;     // fixed typo
  message: string;
  progressPercent: number;

}

export interface DownloadStoreModel {
  totalDownloads: DownloadItem[];
  addDownloadItem: (item: DownloadItem, index: number) => void;
  updateItem: (
    videoId: string,
    updates: Partial<Pick<DownloadItem, 'speed' | 'transferInfo' | 'progressPercent' | "message">>
  ) => void;
  updateFinished: (videoId: string, isFinished: boolean) => void;
  updateStopped: (videoId: string, isStopped: boolean) => void;
}


export interface FormatGroup {
  itag: number,
  info: string,
  contentLength: number,
  url: string,

}

export interface AskFormatModel {
  title: string,
  formatGroup: FormatGroup[]
}
