package com.jsranjan.ivideodownloader.extractors.youtube
import android.content.Context
import android.media.MediaScannerConnection
import android.os.Environment
import convertBytes2
import djDownloader
import muxer.mpfour.DashedParser
import muxer.mpfour.DashedWriter
import muxer.webm.WebMParser
import muxer.webm.WebmMuxer
import org.json.JSONObject
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.io.RandomAccessFile
import kotlin.jvm.Volatile

class NativeFileDownloader(
    private val context: Context,
    private val onProgress: (
        videoId: String,
        progress: String,
        percent: Int,
        speed: String,
        message: String,
    ) -> Unit,
) {
    @Volatile
    private var isCancelled = false

    fun cancel() {
        isCancelled = true
    }

    fun download(
        videoInformation: String,
        audioInformation: String,
        videoId: String,
        fileName: String,
    ) {
        val video = JSONObject(videoInformation)
        val audio = JSONObject(audioInformation)

        if (audioInformation == videoInformation) {
            downloadAudioOnly(audio, videoId, fileName)
        } else {
            downloadVideoAndAudio(video, audio, videoInformation, videoId, fileName)
        }
    }

    // =========================
    // AUDIO ONLY
    // =========================
    private fun downloadAudioOnly(
        audio: JSONObject,
        videoId: String,
        fileName: String,
    ) {
        val musicDir =
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MUSIC)
        val destinationFile = File(musicDir, "$fileName.mp3")

        if (destinationFile.exists() &&
            destinationFile.length() == audio.getInt("contentLength").toLong()
        ) {
            onProgress(videoId, "Already Downloaded", 100, "0KB/s", "Audio")
            return
        }

        val fos = FileOutputStream(destinationFile, destinationFile.exists())

        djDownloader(
            audio.getString("url"),
            fos,
            if (destinationFile.exists()) destinationFile.length() else 0L,
            audio.getInt("contentLength").toLong(),
            isCancelled = { this.isCancelled },
        ) { progress, percent, speed ->
            onProgress(videoId, progress, percent, speed, "$percent%")
        }

        MediaScannerConnection.scanFile(
            context,
            arrayOf(destinationFile.absolutePath),
            null,
            null,
        )
    }

    // =========================
    // VIDEO + AUDIO
    // =========================
    private fun downloadVideoAndAudio(
        video: JSONObject,
        audio: JSONObject,
        videoInformation: String,
        videoId: String,
        fileName: String,
    ) {
        val movieDir =
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_MOVIES)
        val finalVideoFile =
            File(movieDir, "$fileName(${video.getString("info")}).mp4")

        if (finalVideoFile.exists() && finalVideoFile.length() > 0) {
            onProgress(videoId, "Already Downloaded", 100, "0KB/s", "Video")
            return
        }

        val audioTempFile = File(context.filesDir, "$videoId.mp3")
        val videoTempFile =
            File(context.filesDir, "$videoId(${video.getString("info")}).mp4")

        // ---------- VIDEO ----------
        val videoFos = FileOutputStream(videoTempFile, videoTempFile.exists())
        djDownloader(
            video.getString("url"),
            videoFos,
            if (videoTempFile.exists()) videoTempFile.length() else 0L,
            video.getInt("contentLength").toLong(),
            isCancelled = { this.isCancelled },
        ) { progress, percent, speed ->
            onProgress(videoId, progress, percent, speed, "$percent%")
        }

        if (isCancelled) {
            return
        }

        // ---------- AUDIO ----------
        val audioFos = FileOutputStream(audioTempFile, audioTempFile.exists())
        djDownloader(
            audio.getString("url"),
            audioFos,
            if (audioTempFile.exists()) audioTempFile.length() else 0L,
            audio.getInt("contentLength").toLong(),
            isCancelled = { this.isCancelled },
        ) { progress, percent, speed ->

            onProgress(videoId, progress, percent, speed, "$percent% Audio")
        }

        if (isCancelled) {
            return
        }

        // Append audio
        FileOutputStream(videoTempFile, true).use { out ->
            FileInputStream(audioTempFile).use { it.copyTo(out) }
        }

        val videoLength = videoTempFile.length() - audioTempFile.length()
        val raf = RandomAccessFile(videoTempFile, "r")

        onProgress(videoId, "Copying Samples", 50, "500KB/s", "Merging")

        if (videoInformation.contains("webm", true)) {
            mergeWebm(
                raf,
                videoLength,
                videoTempFile,
                audioTempFile,
                finalVideoFile,
                videoId,
            )
        } else {
            mergeMp4(
                raf,
                videoLength,
                videoTempFile,
                audioTempFile,
                finalVideoFile,
                videoId,
            )
        }
    }

    private fun mergeWebm(
        raf: RandomAccessFile,
        videoLength: Long,
        videoTempFile: File,
        audioTempFile: File,
        finalVideoFile: File,
        videoId: String,
    ) {
        val videoParser = WebMParser(raf, false, 0, videoLength)
        videoParser.parse()

        val audioParser =
            WebMParser(raf, false, videoLength, videoTempFile.length())
        audioParser.parse()

        val writer =
            WebmMuxer(
                finalVideoFile,
                listOf(videoParser, audioParser),
            ) { samples, percent ->
                onProgress(videoId, samples, percent, "500KB/s", "Merging")

                if (samples == "Finished") {
                    onProgress(
                        videoId,
                        convertBytes2(finalVideoFile.length()),
                        100,
                        "500KB/s",
                        "Video",
                    )
                    audioTempFile.delete()
                    videoTempFile.delete()

                    MediaScannerConnection.scanFile(
                        context,
                        arrayOf(finalVideoFile.absolutePath),
                        null,
                        null,
                    )
                }
            }

        writer.writeSegment()
    }

    private fun mergeMp4(
        raf: RandomAccessFile,
        videoLength: Long,
        videoTempFile: File,
        audioTempFile: File,
        finalVideoFile: File,
        videoId: String,
    ) {
        val videoParser = DashedParser(raf, false, 0, videoLength)
        val audioParser =
            DashedParser(raf, false, videoLength, videoTempFile.length())

        val outRaf = RandomAccessFile(finalVideoFile, "rw")
        val totalSamples = videoParser.trunEntries + audioParser.trunEntries
        var samplesWritten = 0

        val writer =
            DashedWriter(
                outRaf,
                0,
                mutableListOf(videoParser, audioParser),
            ) {
                samplesWritten++
                if (samplesWritten % 2000 == 0) {
                    val percent = (samplesWritten * 100) / totalSamples
                    onProgress(
                        videoId,
                        "Frames $samplesWritten/$totalSamples",
                        percent,
                        "500KB/s",
                        "Merging",
                    )
                }
            }

        writer.buildNonFmp4()

        onProgress(
            videoId,
            convertBytes2(finalVideoFile.length()),
            (samplesWritten * 100) / totalSamples,
            "500KB/s",
            "Video",
        )

        audioTempFile.delete()
        videoTempFile.delete()

        MediaScannerConnection.scanFile(
            context,
            arrayOf(finalVideoFile.absolutePath),
            null,
            null,
        )
    }
}
