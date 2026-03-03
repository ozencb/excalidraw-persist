import crypto from 'crypto';
import { getDb } from '../lib/database';
import { Board, BoardStatus, UpdateBoardInput } from '../types';

export class BoardModel {
  public static async create(): Promise<Board> {
    const db = await getDb();
    const id = crypto.randomUUID();
    const result = await db.get<Board>(
      'INSERT INTO boards (id) VALUES (?) RETURNING *',
      [id]
    );

    if (!result) {
      throw new Error('Failed to create board');
    }

    return result;
  }

  public static async findById(id: string): Promise<Board | undefined> {
    const db = await getDb();
    return db.get<Board>('SELECT * FROM boards WHERE id = ?', [id]);
  }

  public static async findAllActive(): Promise<Board[]> {
    const db = await getDb();
    const result = await db.all<Board[]>('SELECT * FROM boards WHERE status = ? ORDER BY created_at ASC', [
      BoardStatus.ACTIVE,
    ]);
    return result;
  }

  public static async findAllDeleted(): Promise<Board[]> {
    const db = await getDb();
    const result = await db.all<Board[]>(
      'SELECT * FROM boards WHERE status = ? ORDER BY updated_at DESC',
      [BoardStatus.DELETED]
    );
    return result;
  }

  public static async update(id: string, input: UpdateBoardInput = {}): Promise<Board | undefined> {
    const db = await getDb();
    const board = await this.findById(id);

    if (!board) {
      return undefined;
    }

    const now = Date.now();
    const updates: Partial<Omit<Board, 'id'>> = {
      updated_at: now,
    };

    if (input.name !== undefined) {
      updates.name = input.name;
    }

    if (input.status !== undefined) {
      updates.status = input.status;
    }

    const setClause = Object.keys(updates)
      .map(key => `${key} = ?`)
      .join(', ');
    const values = [...Object.values(updates), id];

    await db.run(`UPDATE boards SET ${setClause} WHERE id = ?`, values);

    return {
      ...board,
      ...updates,
    };
  }

  public static async moveToTrash(id: string): Promise<Board | undefined> {
    return this.update(id, { status: BoardStatus.DELETED });
  }

  public static async restoreFromTrash(id: string): Promise<Board | undefined> {
    return this.update(id, { status: BoardStatus.ACTIVE });
  }

  public static async permanentlyDelete(id: string): Promise<void> {
    const db = await getDb();
    await db.run('DELETE FROM boards WHERE id = ?', [id]);
  }

  public static async delete(id: string): Promise<void> {
    return this.permanentlyDelete(id);
  }
}
