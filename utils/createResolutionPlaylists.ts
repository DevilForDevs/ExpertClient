import RNFS from 'react-native-fs';

type Variant = {
    resolution: string;
    infoLine: string;
    uriLine: string;
    audioGroup?: string;
};

export async function createResolutionPlaylistsRN(
    manifestUrl: string,
    filesDir: string = RNFS.DocumentDirectoryPath,
    videoId?: string
): Promise<string[]> {
    const manifest = await fetch(manifestUrl).then(r => r.text());
    const lines = manifest.split('\n');

    const audioLines = lines.filter(
        l => l.startsWith('#EXT-X-MEDIA') && l.includes('TYPE=AUDIO')
    );

    const variantMap = new Map<string, Variant>();

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
            const infoLine = lines[i];
            const uriLine = lines[i + 1];
            const res = infoLine.match(/RESOLUTION=(\d+x\d+)/)?.[1];

            if (!res || !uriLine) continue;

            if (!variantMap.has(res)) {
                variantMap.set(res, { resolution: res, infoLine, uriLine });
            }
        }
    }

    // sort by resolution width (ascending)
    const uniqueVariants = Array.from(variantMap.values()).sort(
        (a, b) =>
            Number(a.resolution.split('x')[0]) -
            Number(b.resolution.split('x')[0])
    );

    for (const v of uniqueVariants) {
        const content = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            '',
            ...audioLines,
            '',
            v.infoLine,
            v.uriLine,
            ''
        ].join('\n');

        const filePath = `${filesDir}/${videoId}(${v.resolution}).m3u8`;
        await RNFS.writeFile(filePath, content, 'utf8');
    }

    return uniqueVariants.map(v => v.resolution);
}



export async function createResolutionPlaylistsRNFiltered(
    manifestUrl: string,
    filesDir: string = RNFS.DocumentDirectoryPath,
    videoId?: string
): Promise<string[]> {
    const baseUrl = manifestUrl.substring(0, manifestUrl.lastIndexOf('/') + 1);
    const manifest = await fetch(manifestUrl).then(r => r.text());
    const lines = manifest.split('\n');

    // ✅ Keep only AAC audio tracks
    const audioLines = lines.filter(l =>
        l.startsWith('#EXT-X-MEDIA') &&
        l.includes('TYPE=AUDIO') &&
        /mp4a/i.test(l)
    );

    const validAudioGroups = new Set(
        audioLines
            .map(l => l.match(/GROUP-ID="([^"]+)"/)?.[1])
            .filter(Boolean)
    );

    const variants: Variant[] = [];

    for (let i = 0; i < lines.length; i++) {
        const infoLine = lines[i];
        if (!infoLine.startsWith('#EXT-X-STREAM-INF')) continue;

        // ✅ Only H.264
        if (!/avc1/i.test(infoLine)) continue;

        const uriLineRaw = lines[i + 1];
        if (!uriLineRaw) continue;

        const resMatch = infoLine.match(/RESOLUTION=(\d+)x(\d+)/);
        if (!resMatch) continue;

        const width = Number(resMatch[1]);
        const height = Number(resMatch[2]);
        if (height > 1080) continue;

        const audioGroup = infoLine.match(/AUDIO="([^"]+)"/)?.[1];
        if (audioGroup && !validAudioGroups.has(audioGroup)) continue;

        const uriLine = uriLineRaw.startsWith('http')
            ? uriLineRaw
            : baseUrl + uriLineRaw;

        variants.push({
            resolution: `${width}x${height}`,
            infoLine,
            uriLine,
            audioGroup
        });
    }

    // sort by width
    variants.sort(
        (a, b) =>
            Number(a.resolution.split('x')[0]) -
            Number(b.resolution.split('x')[0])
    );

    for (const v of variants) {
        const content = [
            '#EXTM3U',
            '#EXT-X-VERSION:3',
            '',
            ...audioLines.filter(l =>
                v.audioGroup ? l.includes(`GROUP-ID="${v.audioGroup}"`) : true
            ),
            '',
            v.infoLine,
            v.uriLine,
            ''
        ].join('\n');

        const filePath = `${filesDir}/${videoId}(${v.resolution}).m3u8`;
        await RNFS.writeFile(filePath, content, 'utf8');
    }

    return variants.map(v => v.resolution);
}