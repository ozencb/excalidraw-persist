import { Request, Response } from 'express';
import { ElementModel } from '../models/elementModel';
import { BoardModel } from '../models/boardModel';
import { FileModel } from '../models/fileModel';
import { getDb } from '../lib/database';
import { ExcalidrawElement, ExcalidrawFilesMap, ExcalidrawSceneData } from '../types';
import logger from '../utils/logger';

export const elementController = {
  async getByBoardId(req: Request<{ boardId: string }>, res: Response) {
    try {
      const { boardId: boardIdParam } = req.params;
      const boardId = parseInt(boardIdParam, 10);
      if (isNaN(boardId)) {
        return res.status(400).json({ success: false, message: 'Invalid board ID format' });
      }

      const board = await BoardModel.findById(boardId);

      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found',
        });
      }

      const elements = await ElementModel.findAllByBoardId(boardId);
      const files = await FileModel.findAllByBoardId(boardId);

      const excalidrawElements = ElementModel.convertToExcalidrawElements(elements);
      const excalidrawFiles = FileModel.convertToExcalidrawFiles(files);

      return res.status(200).json({
        success: true,
        data: {
          elements: excalidrawElements,
          files: excalidrawFiles,
        },
      });
    } catch (error) {
      logger.error(`Error getting elements for board ${req.params.boardId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get elements',
      });
    }
  },

  async replaceAll(
    req: Request<{ boardId: string }, unknown, ExcalidrawSceneData | ExcalidrawElement[]>,
    res: Response
  ) {
    try {
      const { boardId: boardIdParam } = req.params;
      const body = req.body;
      const boardId = parseInt(boardIdParam, 10);
      if (isNaN(boardId)) {
        return res.status(400).json({ success: false, message: 'Invalid board ID format' });
      }

      let elements: ExcalidrawElement[] = [];
      let files: ExcalidrawFilesMap = {};

      if (Array.isArray(body)) {
        elements = body;
      } else if (body && typeof body === 'object') {
        const scenePayload = body as Partial<ExcalidrawSceneData>;
        if (!scenePayload.elements || !Array.isArray(scenePayload.elements)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid scene payload: elements must be an array',
          });
        }
        elements = scenePayload.elements;

        if (
          scenePayload.files &&
          typeof scenePayload.files === 'object' &&
          !Array.isArray(scenePayload.files)
        ) {
          files = { ...scenePayload.files } as ExcalidrawFilesMap;
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid request payload',
        });
      }

      const board = await BoardModel.findById(boardId);
      if (!board) {
        return res.status(404).json({
          success: false,
          message: 'Board not found',
        });
      }

      const db = await getDb();
      await db.run('BEGIN TRANSACTION');

      try {
        await ElementModel.replaceAll(boardId, elements, { db, useTransaction: false });
        await FileModel.replaceAll(boardId, files, { db, useTransaction: false });
        await db.run('COMMIT');
      } catch (transactionError) {
        await db.run('ROLLBACK');
        throw transactionError;
      }

      await BoardModel.update(boardId, {});

      return res.status(200).json({
        success: true,
        message: `Elements replaced for board ${boardId}`,
      });
    } catch (error) {
      logger.error(`Error replacing elements for board ${req.params.boardId}:`, error);
      return res.status(500).json({
        success: false,
        message: 'Failed to replace elements',
      });
    }
  },
};
