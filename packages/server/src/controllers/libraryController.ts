import { Request, Response } from 'express';
import { BoardModel } from '../models/boardModel';
import { LibraryModel } from '../models/libraryModel';
import type { LibraryPersistedData } from '../types';
import logger from '../utils/logger';

export const libraryController = {
  async getByBoardId(req: Request<{ boardId: string }>, res: Response) {
    try {
      const { boardId: boardIdParam } = req.params;
      const boardId = parseInt(boardIdParam, 10);

      if (isNaN(boardId)) {
        return res.status(400).json({ success: false, message: 'Invalid board ID format' });
      }

      const board = await BoardModel.findById(boardId);
      if (!board) {
        return res.status(404).json({ success: false, message: 'Board not found' });
      }

      const libraryData = await LibraryModel.getByBoardId(boardId);

      return res.status(200).json({
        success: true,
        data: libraryData ?? { libraryItems: [] },
      });
    } catch (error) {
      logger.error(`Error getting library for board ${req.params.boardId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get library data',
      });
    }
  },

  async save(req: Request<{ boardId: string }, unknown, LibraryPersistedData>, res: Response) {
    try {
      const { boardId: boardIdParam } = req.params;
      const boardId = parseInt(boardIdParam, 10);

      if (isNaN(boardId)) {
        return res.status(400).json({ success: false, message: 'Invalid board ID format' });
      }

      const { libraryItems } = req.body ?? {};

      if (!Array.isArray(libraryItems)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid payload: libraryItems must be an array',
        });
      }

      const board = await BoardModel.findById(boardId);
      if (!board) {
        return res.status(404).json({ success: false, message: 'Board not found' });
      }

      await LibraryModel.save(boardId, libraryItems);
      await BoardModel.update(boardId, {});

      return res.status(200).json({
        success: true,
        message: `Library saved for board ${boardId}`,
      });
    } catch (error) {
      logger.error(`Error saving library for board ${req.params.boardId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save library data',
      });
    }
  },
};
