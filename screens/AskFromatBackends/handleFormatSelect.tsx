import { Video, AskFormatModel, DownloadItem } from "../../utils/types";
import { txt2filename } from "../../utils/Interact";
import { getSelectedFormats } from "../../utils/downloadFunctions";
import { DownloadsStore } from "../../utils/Store";
import { addDownload } from "../../utils/dbfunctions";
import { SQLiteDatabase } from "react-native-sqlite-storage";
import { NativeModules } from "react-native";

let db: SQLiteDatabase | null = null;

async function ensureDB() {
    if (!db) {
        const { initDB } = await import("../../utils/dbfunctions");
        db = await initDB();
    }
    return db;
}

export async function handleFormatSelect(
    itag: number,
    currentVideo: Video | undefined,
    requiredFmts: AskFormatModel[]
) {
    if (!currentVideo) return;

    const { MyNativeModule } = NativeModules;

    // ✅ CORRECT way to access Zustand outside React
    const { addDownloadItem, totalDownloads } =
        DownloadsStore.getState();

    const { selectedVideoFmt, selectedAudioFmt } =
        getSelectedFormats(itag, requiredFmts);

    const videoInformation = JSON.stringify(selectedVideoFmt);
    const audioInformation = JSON.stringify(selectedAudioFmt);

    const parsedFileName = txt2filename(currentVideo.title);

    const downloadItem: DownloadItem = {
        transferInfo: "Initiating",
        progressPercent: 0,
        isFinished: false,
        isStopped: false,
        speed: "500KB/s",
        message: "Video",
        video: {
            ...currentVideo,
            title:
                videoInformation !== audioInformation
                    ? `${parsedFileName}(${selectedVideoFmt.info}).mp4`
                    : `${parsedFileName}.mp3`,
        },
    };

    const exists = totalDownloads.some(
        item => item.video.videoId === currentVideo.videoId
    );

    if (!exists) {
        const database = await ensureDB();

        await addDownload(
            database,
            videoInformation === audioInformation
                ? `${parsedFileName}.mp3`
                : `${parsedFileName}(${selectedVideoFmt.info}).mp4`,
            videoInformation === audioInformation ? "music" : "movies",
            currentVideo.videoId,
            0,
            0,
            currentVideo.duration ?? ""
        );

        addDownloadItem(downloadItem, 0);
    }

    MyNativeModule.native_fileDownloader(
        videoInformation,
        audioInformation,
        currentVideo.videoId,
        parsedFileName
    );
}
