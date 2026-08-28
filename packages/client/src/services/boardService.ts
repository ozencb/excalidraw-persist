import { api } from './api';
import { Board, TrashBoard } from '../types/types';

export const BoardService = {
  getAllBoards: () => api.get<Board[]>('/boards'),

  getTrashedBoards: () => api.get<TrashBoard[]>('/boards/trash'),

  createBoard: () => api.post<Board>('/boards'),

  findOrCreateByName: (name: string) =>
    api.post<Board>(`/boards/by-name/${encodeURIComponent(name)}`),

  updateBoardName: (boardId: string, name: string) =>
    api.put<Board>(`/boards/${boardId}`, { name }),

  moveToTrash: (boardId: string) => api.delete(`/boards/${boardId}`),

  restoreBoard: (boardId: string) => api.post<Board>(`/boards/${boardId}/restore`),

  permanentlyDeleteBoard: (boardId: string) => api.delete(`/boards/${boardId}/permanent`),
};
