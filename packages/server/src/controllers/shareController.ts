import { Request, Response } from 'express';
import { ShareLinkModel } from '../models/shareLinkModel';
import { BoardModel } from '../models/boardModel';
import { ElementModel } from '../models/elementModel';
import { FileModel } from '../models/fileModel';
import { LibraryModel } from '../models/libraryModel';
import { getDb } from '../lib/database';
import { ExcalidrawElement, ExcalidrawFilesMap, ExcalidrawSceneData } from '../types';
import logger from '../utils/logger';

// Owner-facing: create/get share link for a board
export const shareController = {
  async createShareLink(req: Request<{ boardId: string }>, res: Response) {
    try {
      const { boardId } = req.params;
      const { permission } = req.body as { permission: 'edit' | 'readonly' };

      if (!permission || !['edit', 'readonly'].includes(permission)) {
        return res.status(400).json({ success: false, message: "permission must be 'edit' or 'readonly'" });
      }

      const board = await BoardModel.findById(boardId);
      if (!board) {
        return res.status(404).json({ success: false, message: 'Board not found' });
      }

      const shareLink = await ShareLinkModel.create(boardId, permission);

      return res.status(200).json({
        success: true,
        data: { id: shareLink.id, permission: shareLink.permission, created_at: shareLink.created_at },
      });
    } catch (error) {
      logger.error(`Error creating share link for board ${req.params.boardId}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to create share link' });
    }
  },

  async listShareLinks(req: Request<{ boardId: string }>, res: Response) {
    try {
      const { boardId } = req.params;

      const board = await BoardModel.findById(boardId);
      if (!board) {
        return res.status(404).json({ success: false, message: 'Board not found' });
      }

      const links = await ShareLinkModel.findAllByBoardId(boardId);

      return res.status(200).json({
        success: true,
        data: links.map(l => ({ id: l.id, permission: l.permission, created_at: l.created_at })),
      });
    } catch (error) {
      logger.error(`Error listing share links for board ${req.params.boardId}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to list share links' });
    }
  },
};

// Shared-user-facing: resolve shareId → board, enforce permissions
export const sharedController = {
  async getShareInfo(req: Request<{ shareId: string }>, res: Response) {
    try {
      const link = await ShareLinkModel.findById(req.params.shareId);
      if (!link) {
        return res.status(404).json({ success: false, message: 'Share link not found' });
      }

      const board = await BoardModel.findById(link.board_id);
      if (!board) {
        return res.status(404).json({ success: false, message: 'Board not found' });
      }

      return res.status(200).json({
        success: true,
        data: { name: board.name, permission: link.permission },
      });
    } catch (error) {
      logger.error(`Error getting share info for ${req.params.shareId}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to get share info' });
    }
  },

  async getElements(req: Request<{ shareId: string }>, res: Response) {
    try {
      const link = await ShareLinkModel.findById(req.params.shareId);
      if (!link) {
        return res.status(404).json({ success: false, message: 'Share link not found' });
      }

      const elements = await ElementModel.findAllByBoardId(link.board_id);
      const files = await FileModel.findAllByBoardId(link.board_id);

      return res.status(200).json({
        success: true,
        data: {
          elements: ElementModel.convertToExcalidrawElements(elements),
          files: FileModel.convertToExcalidrawFiles(files),
        },
      });
    } catch (error) {
      logger.error(`Error getting elements for share ${req.params.shareId}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to get elements' });
    }
  },

  async applyDelta(req: Request<{ shareId: string }>, res: Response) {
    try {
      const link = await ShareLinkModel.findById(req.params.shareId);
      if (!link) {
        return res.status(404).json({ success: false, message: 'Share link not found' });
      }
      if (link.permission !== 'edit') {
        return res.status(403).json({ success: false, message: 'Read-only share link' });
      }

      const { upserted, deleted } = req.body as {
        upserted: ExcalidrawElement[];
        deleted: string[];
      };

      const db = await getDb();
      await db.run('BEGIN TRANSACTION');

      try {
        if (upserted && upserted.length > 0) {
          await ElementModel.upsertMany(link.board_id, upserted);
        }
        if (deleted && deleted.length > 0) {
          await ElementModel.deleteMany(link.board_id, deleted);
        }
        await db.run('COMMIT');
      } catch (txError) {
        await db.run('ROLLBACK');
        throw txError;
      }

      await BoardModel.update(link.board_id, {});

      return res.status(200).json({ success: true, message: 'Delta applied' });
    } catch (error) {
      logger.error(`Error applying delta for share ${req.params.shareId}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to apply delta' });
    }
  },

  async replaceAll(
    req: Request<{ shareId: string }, unknown, ExcalidrawSceneData | ExcalidrawElement[]>,
    res: Response
  ) {
    try {
      const link = await ShareLinkModel.findById(req.params.shareId);
      if (!link) {
        return res.status(404).json({ success: false, message: 'Share link not found' });
      }
      if (link.permission !== 'edit') {
        return res.status(403).json({ success: false, message: 'Read-only share link' });
      }

      const body = req.body;
      let elements: ExcalidrawElement[] = [];
      let files: ExcalidrawFilesMap = {};

      if (Array.isArray(body)) {
        elements = body;
      } else if (body && typeof body === 'object') {
        const scene = body as Partial<ExcalidrawSceneData>;
        if (!scene.elements || !Array.isArray(scene.elements)) {
          return res.status(400).json({ success: false, message: 'elements must be an array' });
        }
        elements = scene.elements;
        if (scene.files && typeof scene.files === 'object' && !Array.isArray(scene.files)) {
          files = { ...scene.files } as ExcalidrawFilesMap;
        }
      } else {
        return res.status(400).json({ success: false, message: 'Invalid request payload' });
      }

      const db = await getDb();
      await db.run('BEGIN TRANSACTION');

      try {
        await ElementModel.replaceAll(link.board_id, elements, { db, useTransaction: false });
        await FileModel.replaceAll(link.board_id, files, { db, useTransaction: false });
        await db.run('COMMIT');
      } catch (txError) {
        await db.run('ROLLBACK');
        throw txError;
      }

      await BoardModel.update(link.board_id, {});

      return res.status(200).json({ success: true, message: 'Elements replaced' });
    } catch (error) {
      logger.error(`Error replacing elements for share ${req.params.shareId}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to replace elements' });
    }
  },

  async checkFiles(req: Request<{ shareId: string }>, res: Response) {
    try {
      const link = await ShareLinkModel.findById(req.params.shareId);
      if (!link) {
        return res.status(404).json({ success: false, message: 'Share link not found' });
      }
      if (link.permission !== 'edit') {
        return res.status(403).json({ success: false, message: 'Read-only share link' });
      }

      const { fileIds } = req.body as { fileIds: string[] };
      if (!Array.isArray(fileIds)) {
        return res.status(400).json({ success: false, message: 'fileIds must be an array' });
      }

      const existingIds = await FileModel.checkExisting(link.board_id, fileIds);
      const missingIds = fileIds.filter(id => !existingIds.includes(id));

      return res.status(200).json({ success: true, data: { missingIds } });
    } catch (error) {
      logger.error(`Error checking files for share ${req.params.shareId}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to check files' });
    }
  },

  async uploadFiles(req: Request<{ shareId: string }>, res: Response) {
    try {
      const link = await ShareLinkModel.findById(req.params.shareId);
      if (!link) {
        return res.status(404).json({ success: false, message: 'Share link not found' });
      }
      if (link.permission !== 'edit') {
        return res.status(403).json({ success: false, message: 'Read-only share link' });
      }

      const { files } = req.body as { files: ExcalidrawFilesMap };
      if (!files || typeof files !== 'object') {
        return res.status(400).json({ success: false, message: 'files must be an object' });
      }

      await FileModel.upsertMany(link.board_id, files);

      return res.status(200).json({ success: true, message: 'Files uploaded' });
    } catch (error) {
      logger.error(`Error uploading files for share ${req.params.shareId}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to upload files' });
    }
  },

  async getLibrary(req: Request<{ shareId: string }>, res: Response) {
    try {
      const link = await ShareLinkModel.findById(req.params.shareId);
      if (!link) {
        return res.status(404).json({ success: false, message: 'Share link not found' });
      }

      const libraryData = await LibraryModel.getByBoardId(link.board_id);

      return res.status(200).json({
        success: true,
        data: libraryData ?? { libraryItems: [] },
      });
    } catch (error) {
      logger.error(`Error getting library for share ${req.params.shareId}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to get library' });
    }
  },

  async saveLibrary(req: Request<{ shareId: string }>, res: Response) {
    try {
      const link = await ShareLinkModel.findById(req.params.shareId);
      if (!link) {
        return res.status(404).json({ success: false, message: 'Share link not found' });
      }
      if (link.permission !== 'edit') {
        return res.status(403).json({ success: false, message: 'Read-only share link' });
      }

      const { libraryItems } = req.body ?? {};
      if (!Array.isArray(libraryItems)) {
        return res.status(400).json({ success: false, message: 'libraryItems must be an array' });
      }

      await LibraryModel.save(link.board_id, libraryItems);
      await BoardModel.update(link.board_id, {});

      return res.status(200).json({ success: true, message: 'Library saved' });
    } catch (error) {
      logger.error(`Error saving library for share ${req.params.shareId}:`, error);
      return res.status(500).json({ success: false, message: 'Failed to save library' });
    }
  },
};
