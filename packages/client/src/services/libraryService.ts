import type { LibraryItems } from '@excalidraw/excalidraw/types';
import { api } from './api';

interface LibraryResponse {
  libraryItems: LibraryItems;
}

export const LibraryService = {
  getBoardLibrary: (boardId: string) =>
    api.get<LibraryResponse>(`/boards/${boardId}/library`),
  saveBoardLibrary: (boardId: string, libraryItems: LibraryItems) =>
    api.put<void>(`/boards/${boardId}/library`, { libraryItems }),
};
