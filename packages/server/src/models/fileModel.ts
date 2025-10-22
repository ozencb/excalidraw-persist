import type { Database } from 'sqlite';
import { getDb } from '../lib/database';
import { ExcalidrawBinaryFileData, ExcalidrawFilesMap, StoredFile } from '../types';

interface ReplaceAllOptions {
  db?: Database;
  useTransaction?: boolean;
}

export class FileModel {
  public static async replaceAll(
    boardId: number,
    files: ExcalidrawFilesMap = {},
    options: ReplaceAllOptions = {}
  ): Promise<void> {
    const db = options.db ?? (await getDb());
    const shouldManageTransaction = options.useTransaction ?? !options.db;
    const now = Date.now();

    if (shouldManageTransaction) {
      await db.run('BEGIN TRANSACTION');
    }

    try {
      await db.run('DELETE FROM files WHERE board_id = ?', [boardId]);

      const entries = Object.entries(files);
      if (entries.length > 0) {
        const sql = `INSERT INTO files (id, board_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`;
        const stmt = await db.prepare(sql);

        for (const [id, file] of entries) {
          const fileId = file.id || id;
          const serializedFile = JSON.stringify({ ...file, id: fileId });
          await stmt.run([fileId, boardId, serializedFile, now, now]);
        }

        await stmt.finalize();
      }

      if (shouldManageTransaction) {
        await db.run('COMMIT');
      }
    } catch (error) {
      if (shouldManageTransaction) {
        await db.run('ROLLBACK');
      }
      console.error(`Error replacing files for board ${boardId}:`, error);
      throw error;
    }
  }

  public static async findAllByBoardId(boardId: number): Promise<StoredFile[]> {
    const db = await getDb();
    return db.all<StoredFile[]>('SELECT * FROM files WHERE board_id = ?', [boardId]);
  }

  public static convertToExcalidrawFiles(files: StoredFile[]): ExcalidrawFilesMap {
    return files.reduce<ExcalidrawFilesMap>((acc, file) => {
      try {
        const parsed = JSON.parse(file.data) as ExcalidrawBinaryFileData;
        if (!parsed.id) {
          parsed.id = file.id;
        }
        acc[file.id] = parsed;
      } catch (error) {
        console.error('Error parsing file data:', error);
      }
      return acc;
    }, {});
  }
}
