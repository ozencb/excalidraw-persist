import crypto from 'crypto';
import { getDb } from '../lib/database';

export interface ShareLink {
  id: string;
  board_id: string;
  permission: 'edit' | 'readonly';
  created_at: number;
}

export class ShareLinkModel {
  public static async findById(id: string): Promise<ShareLink | undefined> {
    const db = await getDb();
    return db.get<ShareLink>('SELECT * FROM share_links WHERE id = ?', [id]);
  }

  public static async findByBoardAndPermission(
    boardId: string,
    permission: 'edit' | 'readonly'
  ): Promise<ShareLink | undefined> {
    const db = await getDb();
    return db.get<ShareLink>(
      'SELECT * FROM share_links WHERE board_id = ? AND permission = ?',
      [boardId, permission]
    );
  }

  public static async create(
    boardId: string,
    permission: 'edit' | 'readonly'
  ): Promise<ShareLink> {
    const existing = await this.findByBoardAndPermission(boardId, permission);
    if (existing) return existing;

    const db = await getDb();
    const id = crypto.randomUUID();
    const result = await db.get<ShareLink>(
      'INSERT INTO share_links (id, board_id, permission) VALUES (?, ?, ?) RETURNING *',
      [id, boardId, permission]
    );

    if (!result) {
      throw new Error('Failed to create share link');
    }

    return result;
  }

  public static async findAllByBoardId(boardId: string): Promise<ShareLink[]> {
    const db = await getDb();
    return db.all<ShareLink[]>(
      'SELECT * FROM share_links WHERE board_id = ? ORDER BY created_at ASC',
      [boardId]
    );
  }
}
