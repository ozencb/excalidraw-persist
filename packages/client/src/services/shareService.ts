import { api } from './api';
import type { BoardSceneData, DeltaPayload } from './elementService';
import type { BinaryFiles } from '@excalidraw/excalidraw/types';

export interface ShareInfo {
  name: string;
  permission: 'edit' | 'readonly';
}

export interface ShareLink {
  id: string;
  permission: 'edit' | 'readonly';
  created_at: number;
}

export const ShareService = {
  getShareInfo: (shareId: string) =>
    api.get<ShareInfo>(`/share/${shareId}`),

  getElements: (shareId: string) =>
    api.get<BoardSceneData>(`/share/${shareId}/elements`),

  saveDelta: (shareId: string, delta: DeltaPayload) =>
    api.patch<void>(`/share/${shareId}/elements`, delta),

  replaceAllElements: (shareId: string, scene: BoardSceneData) =>
    api.put<void>(`/share/${shareId}/elements`, scene),

  checkFiles: (shareId: string, fileIds: string[]) =>
    api.post<{ missingIds: string[] }>(`/share/${shareId}/files/check`, { fileIds }),

  uploadFiles: (shareId: string, files: BinaryFiles) =>
    api.post<void>(`/share/${shareId}/files`, { files }),

  getLibrary: (shareId: string) =>
    api.get<{ libraryItems: unknown[] }>(`/share/${shareId}/library`),

  saveLibrary: (shareId: string, libraryItems: readonly unknown[]) =>
    api.put<void>(`/share/${shareId}/library`, { libraryItems: [...libraryItems] }),

  // Owner-facing
  createShareLink: (boardId: string, permission: 'edit' | 'readonly') =>
    api.post<ShareLink>(`/boards/${boardId}/share`, { permission }),

  listShareLinks: (boardId: string) =>
    api.get<ShareLink[]>(`/boards/${boardId}/share`),
};
