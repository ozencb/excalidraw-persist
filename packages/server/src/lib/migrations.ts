import crypto from 'crypto';
import { getDb } from './database';
import logger from '../utils/logger';

export async function runMigrations(): Promise<void> {
  await migrateBoardIdsToUuid();
  await createShareLinksTable();
}

async function createShareLinksTable(): Promise<void> {
  const db = await getDb();

  const tables = await db.all<{ name: string }[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='share_links'"
  );

  if (tables.length > 0) return;

  logger.info('Creating share_links table...');

  await db.run(`CREATE TABLE share_links (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL,
    permission TEXT NOT NULL CHECK (permission IN ('edit', 'readonly')),
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    UNIQUE (board_id, permission)
  )`);

  logger.info('share_links table created.');
}

async function migrateBoardIdsToUuid(): Promise<void> {
  const db = await getDb();

  const tableInfo = await db.all<{ name: string; type: string }[]>(
    "PRAGMA table_info('boards')"
  );
  const idCol = tableInfo.find(col => col.name === 'id');

  if (!idCol || idCol.type !== 'INTEGER') {
    return;
  }

  logger.info('Migrating board IDs from INTEGER to UUID...');

  const boards = await db.all<{ id: number; name: string; status: string; created_at: number; updated_at: number }[]>(
    'SELECT * FROM boards'
  );

  const idMap = new Map<number, string>();
  for (const board of boards) {
    idMap.set(board.id, crypto.randomUUID());
  }

  await db.run('PRAGMA foreign_keys = OFF');

  try {
    await db.run('BEGIN TRANSACTION');

    // Recreate boards table with TEXT id
    await db.run('ALTER TABLE boards RENAME TO _boards_old');
    await db.run(`CREATE TABLE boards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%S','now')),
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    )`);

    for (const board of boards) {
      await db.run(
        'INSERT INTO boards (id, name, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [idMap.get(board.id), board.name, board.status, board.created_at, board.updated_at]
      );
    }
    await db.run('DROP TABLE _boards_old');

    // Recreate elements table
    const elements = await db.all<{ id: string; board_id: number; data: string; element_index: string; type: string; created_at: number; updated_at: number; is_deleted: number }[]>(
      'SELECT * FROM elements'
    );
    await db.run('DROP TABLE elements');
    await db.run(`CREATE TABLE elements (
      id TEXT NOT NULL,
      board_id TEXT NOT NULL,
      data TEXT NOT NULL,
      element_index TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      is_deleted BOOLEAN NOT NULL DEFAULT 0,
      PRIMARY KEY (id, board_id),
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
      UNIQUE (element_index, board_id)
    )`);
    await db.run('CREATE INDEX IF NOT EXISTS idx_elements_board_id ON elements(board_id)');

    for (const el of elements) {
      const newBoardId = idMap.get(el.board_id);
      if (!newBoardId) continue;
      await db.run(
        'INSERT INTO elements (id, board_id, data, element_index, type, created_at, updated_at, is_deleted) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [el.id, newBoardId, el.data, el.element_index, el.type, el.created_at, el.updated_at, el.is_deleted]
      );
    }

    // Recreate files table
    const files = await db.all<{ id: string; board_id: number; data: string; created_at: number; updated_at: number }[]>(
      'SELECT * FROM files'
    );
    await db.run('DROP TABLE files');
    await db.run(`CREATE TABLE files (
      id TEXT NOT NULL,
      board_id TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      PRIMARY KEY (id, board_id),
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    )`);
    await db.run('CREATE INDEX IF NOT EXISTS idx_files_board_id ON files(board_id)');

    for (const file of files) {
      const newBoardId = idMap.get(file.board_id);
      if (!newBoardId) continue;
      await db.run(
        'INSERT INTO files (id, board_id, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [file.id, newBoardId, file.data, file.created_at, file.updated_at]
      );
    }

    // Recreate libraries table
    const libraries = await db.all<{ board_id: number; data: string; updated_at: number }[]>(
      'SELECT * FROM libraries'
    );
    await db.run('DROP TABLE libraries');
    await db.run(`CREATE TABLE libraries (
      board_id TEXT PRIMARY KEY,
      data TEXT NOT NULL DEFAULT '[]',
      updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    )`);

    for (const lib of libraries) {
      const newBoardId = idMap.get(lib.board_id);
      if (!newBoardId) continue;
      await db.run(
        'INSERT INTO libraries (board_id, data, updated_at) VALUES (?, ?, ?)',
        [newBoardId, lib.data, lib.updated_at]
      );
    }

    await db.run('COMMIT');
    logger.info(`Migration complete. Converted ${boards.length} board(s) to UUID IDs.`);
  } catch (error) {
    await db.run('ROLLBACK');
    logger.error('Migration failed, rolled back:', error);
    throw error;
  } finally {
    await db.run('PRAGMA foreign_keys = ON');
  }
}
