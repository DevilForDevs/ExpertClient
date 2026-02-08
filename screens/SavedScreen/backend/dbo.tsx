
import SQLite, { SQLiteDatabase, ResultSet } from 'react-native-sqlite-storage';

export async function createHistoryTable(db: SQLiteDatabase): Promise<void> {
    const query = `
    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      videoId TEXT UNIQUE,
      title TEXT,
      channelTitle TEXT,
      duration TEXT,
      watchedAt INTEGER
    );
  `;
    await db.executeSql(query);
}

// ✅ Add or update history
export async function addHistory(
    db: SQLiteDatabase,
    videoId: string,
    title: string,
    channelTitle: string,
    duration: string
): Promise<number> {
    const watchedAt = Date.now();

    const result = await db.executeSql(
        `
        INSERT INTO history (videoId, title, channelTitle, duration, watchedAt)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(videoId) DO UPDATE SET
          title = excluded.title,
          channelTitle = excluded.channelTitle,
          duration = excluded.duration,
          watchedAt = excluded.watchedAt
        `,
        [videoId, title, channelTitle, duration, watchedAt]
    );

    return result[0].insertId ?? 0;
}

// ✅ Load watch history
export async function loadHistory(db: SQLiteDatabase): Promise<any[]> {
    const results = await db.executeSql(
        'SELECT * FROM history ORDER BY watchedAt DESC'
    );

    const rows = results[0].rows;
    const items: any[] = [];

    for (let i = 0; i < rows.length; i++) {
        items.push(rows.item(i));
    }

    return items;
}
