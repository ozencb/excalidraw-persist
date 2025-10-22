CREATE TABLE IF NOT EXISTS boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name  TEXT NOT NULL DEFAULT (
    strftime('%Y-%m-%d %H:%M:%S','now')
  ),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE TABLE IF NOT EXISTS elements (
  id TEXT NOT NULL,
  board_id INTEGER NOT NULL,
  data TEXT NOT NULL,
  element_index TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  is_deleted BOOLEAN NOT NULL DEFAULT 0,
  PRIMARY KEY (id, board_id),
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  UNIQUE (element_index, board_id)
);

CREATE INDEX IF NOT EXISTS idx_elements_board_id ON elements(board_id);

CREATE TABLE IF NOT EXISTS files (
  id TEXT NOT NULL,
  board_id INTEGER NOT NULL,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  PRIMARY KEY (id, board_id),
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_files_board_id ON files(board_id);

CREATE TABLE IF NOT EXISTS libraries (
  board_id INTEGER PRIMARY KEY,
  data TEXT NOT NULL DEFAULT '[]',
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);
