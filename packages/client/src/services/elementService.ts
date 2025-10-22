import { api } from './api';
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { BinaryFiles } from '@excalidraw/excalidraw/types';

export interface BoardSceneData {
  elements: ExcalidrawElement[];
  files: BinaryFiles;
  [key: string]: unknown;
}

export const ElementService = {
  getBoardElements: (boardId: string) => api.get<BoardSceneData>(`/boards/${boardId}/elements`),

  replaceAllElements: (boardId: string, scene: BoardSceneData) =>
    api.put<void>(`/boards/${boardId}/elements`, scene),
};
