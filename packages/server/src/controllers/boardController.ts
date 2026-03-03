import { Request, Response } from 'express';
import { BoardModel } from '../models/boardModel';
import { BoardStatus } from '../types';
import logger from '../utils/logger';

export const boardController = {
  async create(req: Request, res: Response) {
    try {
      const board = await BoardModel.create();

      return res.status(201).json({
        success: true,
        data: board,
      });
    } catch (error) {
      logger.error('Error creating board:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create board',
      });
    }
  },

  async listActive(req: Request, res: Response) {
    try {
      const boards = await BoardModel.findAllActive();

      return res.status(200).json({
        success: true,
        data: boards,
      });
    } catch (error) {
      logger.error('Error listing active boards:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to list active boards',
      });
    }
  },

  async listTrash(req: Request, res: Response) {
    try {
      const boards = await BoardModel.findAllDeleted();

      return res.status(200).json({
        success: true,
        data: boards,
      });
    } catch (error) {
      logger.error('Error listing boards in trash:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to list boards in trash',
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const board = await BoardModel.findById(id);

      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found',
        });
      }

      if (board.status === BoardStatus.DELETED) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update a board in trash',
        });
      }

      const updatedBoard = await BoardModel.update(id, { name });

      return res.status(200).json({
        success: true,
        data: updatedBoard,
      });
    } catch (error) {
      logger.error(`Error updating board ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update board',
      });
    }
  },

  async moveToTrash(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const board = await BoardModel.findById(id);

      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found',
        });
      }

      if (board.status === BoardStatus.DELETED) {
        return res.status(400).json({
          success: false,
          message: 'Board is already in trash',
        });
      }

      await BoardModel.moveToTrash(id);

      return res.status(200).json({
        success: true,
        message: 'Board moved to trash',
      });
    } catch (error) {
      logger.error(`Error moving board ${req.params.id} to trash:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to move board to trash',
      });
    }
  },

  async restoreFromTrash(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const board = await BoardModel.findById(id);

      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found',
        });
      }

      if (board.status !== BoardStatus.DELETED) {
        return res.status(400).json({
          success: false,
          message: 'Board is not in trash',
        });
      }

      await BoardModel.restoreFromTrash(id);

      return res.status(200).json({
        success: true,
        message: 'Board restored from trash',
      });
    } catch (error) {
      logger.error(`Error restoring board ${req.params.id} from trash:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to restore board from trash',
      });
    }
  },

  async permanentDelete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const board = await BoardModel.findById(id);
      if (!board) {
        return res.status(404).json({ success: false, message: 'Board not found' });
      }

      await BoardModel.permanentlyDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Board and associated data permanently deleted',
      });
    } catch (error) {
      logger.error(`Error permanently deleting board ${req.params.id}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to permanently delete board',
      });
    }
  },
};
