import type { Database } from 'sqlite';
import { getDb } from '../lib/database';
import { Element, ExcalidrawElement } from '../types';

interface ReplaceAllOptions {
  db?: Database;
  useTransaction?: boolean;
}

export class ElementModel {
  public static async replaceAll(
    boardId: string,
    elements: ExcalidrawElement[],
    options: ReplaceAllOptions = {}
  ): Promise<void> {
    const db = options.db ?? (await getDb());
    const shouldManageTransaction = options.useTransaction ?? !options.db;
    const now = Date.now();

    if (shouldManageTransaction) {
      await db.run('BEGIN TRANSACTION');
    }

    try {
      await db.run('DELETE FROM elements WHERE board_id = ?', [boardId]);

      if (elements.length > 0) {
        const sql = `INSERT INTO elements 
          (id, board_id, data, element_index, type, created_at, updated_at, is_deleted) 
        VALUES 
          (?, ?, ?, ?, ?, ?, ?, ?)`;

        const stmt = await db.prepare(sql);

        for (const element of elements) {
          const dbElementData = [
            element.id,
            boardId,
            JSON.stringify(element),
            element.index ?? '',
            element.type,
            now,
            now,
            element.isDeleted ? 1 : 0,
          ];
          await stmt.run(dbElementData);
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
      console.error(`Error replacing elements for board ${boardId}:`, error);
      throw error;
    }
  }

  public static async upsertMany(
    boardId: string,
    elements: ExcalidrawElement[]
  ): Promise<void> {
    if (elements.length === 0) return;

    const db = await getDb();
    const now = Date.now();
    const sql = `INSERT OR REPLACE INTO elements
      (id, board_id, data, element_index, type, created_at, updated_at, is_deleted)
    VALUES
      (?, ?, ?, ?, ?, COALESCE((SELECT created_at FROM elements WHERE id = ? AND board_id = ?), ?), ?, ?)`;

    const stmt = await db.prepare(sql);
    for (const element of elements) {
      await stmt.run([
        element.id,
        boardId,
        JSON.stringify(element),
        element.index ?? '',
        element.type,
        element.id, boardId, now, // for COALESCE: preserve original created_at
        now,
        element.isDeleted ? 1 : 0,
      ]);
    }
    await stmt.finalize();
  }

  public static async deleteMany(boardId: string, ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const db = await getDb();
    const placeholders = ids.map(() => '?').join(',');
    await db.run(
      `DELETE FROM elements WHERE board_id = ? AND id IN (${placeholders})`,
      [boardId, ...ids]
    );
  }

  public static async findById(boardId: string, id: string): Promise<Element | undefined> {
    const db = await getDb();
    const result = await db.get<Element | undefined>(
      'SELECT * FROM elements WHERE board_id = ? AND id = ?',
      [boardId, id]
    );
    return result;
  }

  public static async findAllByBoardId(boardId: string): Promise<Element[]> {
    const db = await getDb();

    const result = await db.all<Element[]>(
      'SELECT * FROM elements WHERE board_id = ? AND is_deleted = 0 ORDER BY element_index ASC',
      [boardId]
    );

    return result;
  }

  public static async markAsDeleted(boardId: string, id: string): Promise<void> {
    const db = await getDb();
    const now = Date.now();

    const element = await this.findById(boardId, id);

    if (!element) {
      return;
    }

    const elementData = JSON.parse(element.data) as ExcalidrawElement;
    elementData.isDeleted = true;

    await db.run(
      'UPDATE elements SET data = ?, is_deleted = 1, updated_at = ? WHERE id = ? AND board_id = ?',
      [JSON.stringify(elementData), now, id, boardId]
    );
  }

  public static async permanentlyDelete(boardId: string, id: string): Promise<void> {
    const db = await getDb();
    await db.run('DELETE FROM elements WHERE board_id = ? AND id = ?', [boardId, id]);
  }

  public static convertToExcalidrawElements(elements: Element[]): ExcalidrawElement[] {
    return elements
      .map(element => {
        try {
          return JSON.parse(element.data) as ExcalidrawElement;
        } catch (error) {
          console.error('Error parsing element data:', error);
          return null;
        }
      })
      .filter((element): element is ExcalidrawElement => element !== null);
  }

  public static async countByBoardId(
    boardId: string,
    includeDeleted: boolean = false
  ): Promise<number> {
    const db = await getDb();

    let query = 'SELECT COUNT(*) as count FROM elements WHERE board_id = ?';
    const params: (string | number)[] = [boardId];

    if (!includeDeleted) {
      query += ' AND is_deleted = 0';
    }

    const result = await db.get<{ count: number }>(query, params);
    return result?.count || 0;
  }
}
