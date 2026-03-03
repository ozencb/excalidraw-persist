import { api } from './api';
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { BinaryFiles } from '@excalidraw/excalidraw/types';

export interface BoardSceneData {
  elements: ExcalidrawElement[];
  files: BinaryFiles;
  [key: string]: unknown;
}

export interface DeltaPayload {
  upserted: ExcalidrawElement[];
  deleted: string[];
  [key: string]: unknown;
}

export const ElementService = {
  getBoardElements: (boardId: string) => api.get<BoardSceneData>(`/boards/${boardId}/elements`),

  replaceAllElements: (boardId: string, scene: BoardSceneData) =>
    api.put<void>(`/boards/${boardId}/elements`, scene),

  saveDelta: (boardId: string, delta: DeltaPayload) =>
    api.patch<void>(`/boards/${boardId}/elements`, delta),

  checkFiles: (boardId: string, fileIds: string[]) =>
    api.post<{ missingIds: string[] }>(`/boards/${boardId}/files/check`, { fileIds }),

  uploadFiles: (boardId: string, files: BinaryFiles) =>
    api.post<void>(`/boards/${boardId}/files`, { files }),
};
