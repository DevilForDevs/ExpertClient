import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
SQLite.enablePromise(true);

// ✅ Initialize database
export async function initDB(): Promise<SQLiteDatabase> {
    try {
        const dbInstance = await SQLite.openDatabase({
            name: 'mydb.db',
            location: 'default',
        });
        return dbInstance;
    } catch (error) {
        console.error('DB Error:', error);
        throw error;
    }
}


// ✅ Create table
export async function createDownloadsTable(db: SQLiteDatabase): Promise<void> {
    const query = `
    CREATE TABLE IF NOT EXISTS downloads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      folder TEXT,
      videoId TEXT,
      isFinished INTEGER,
      isMuxed INTEGER,
      duration TEXT
    );
  `;
    await db.executeSql(query);
}

// ✅ Load all downloads (returns array of items)
export async function loadDownloads(db: SQLiteDatabase): Promise<any[]> {
    const results = await db.executeSql('SELECT * FROM downloads');
    const rows = results[0].rows;
    const items: any[] = [];
    for (let i = 0; i < rows.length; i++) {
        items.push(rows.item(i));
    }
    return items;
}

// ✅ Add a download (returns inserted ID)
export async function addDownload(
    db: SQLiteDatabase,
    title: string,
    folder: string,
    videoId: string,
    isMuxed: number,
    isFinished: number,
    duration: string
): Promise<number> {
    const result = await db.executeSql(
        'INSERT INTO downloads (title, folder, videoId, isFinished, isMuxed, duration) VALUES (?, ?, ?, ?, ?, ?)',
        [title, folder, videoId, isFinished, isMuxed, duration]
    );

    // ResultSet.insertId gives the auto-generated ID
    const insertId = result[0].insertId ?? 0;
    return insertId;
}

// ✅ Remove a download (returns number of rows affected)
export async function removeDownload(
    db: SQLiteDatabase,
    id: number
): Promise<number> {
    const result = await db.executeSql('DELETE FROM downloads WHERE id = ?', [id]);
    const rowsAffected = result[0].rowsAffected ?? 0;
    return rowsAffected;
}

export async function deleteOldM3U8Files() {
    try {
        const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);

        const m3u8Files = files.filter(
            f => f.isFile() && f.name.endsWith(".m3u8")
        );

        for (const file of m3u8Files) {
            await RNFS.unlink(file.path);
        }

        console.log("Old m3u8 files deleted:", m3u8Files.length);
    } catch (err) {
        console.warn("Failed to delete old m3u8 files", err);
    }
}



