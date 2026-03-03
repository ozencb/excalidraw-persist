import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BoardService } from '../services/boardService';
import { Board } from '../types/types';
import Utils from '../utils';
import logger from '../utils/logger';

interface BoardContextType {
  boards: Board[];
  isLoading: boolean;
  fetchBoards: () => Promise<void>;
  handleRenameBoard: (id: string, newName: string) => void;
  handleCreateBoard: () => Promise<void>;
  handleArchiveBoard: (id: string) => Promise<void>;
  activeBoardId: string | undefined;
}

const BoardContext = createContext<BoardContextType | null>(null);

export const useBoardContext = () => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardContext must be used within a BoardProvider');
  }
  return context;
};

interface BoardProviderProps {
  children: ReactNode;
}

export const BoardProvider: React.FC<BoardProviderProps> = ({ children }) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { boardId: activeBoardId } = useParams<{ boardId: string }>();
  const didAttemptInitialBoardCreation = useRef(false);

  const fetchBoards = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await BoardService.getAllBoards();
      setBoards(data);
      setIsLoading(false);
    } catch (error) {
      logger.error('Error fetching boards:', error, true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedUpdateBoardName = useCallback(
    Utils.debounce((id: string, newName: string) => {
      BoardService.updateBoardName(id, newName).catch(error => {
        logger.error(`Failed to update board ${id} name:`, error, true);
      });
    }, 500),
    []
  );

  const handleRenameBoard = useCallback(
    (id: string, newName: string) => {
      setBoards(prevBoards =>
        prevBoards.map(board => (board.id === id ? { ...board, name: newName } : board))
      );
      debouncedUpdateBoardName(id, newName);
    },
    [debouncedUpdateBoardName]
  );

  const handleCreateBoard = useCallback(async () => {
    setIsLoading(true);
    try {
      const newBoard = await BoardService.createBoard();
      setBoards(prevBoards => [...prevBoards, newBoard]);
      navigate(`/board/${newBoard.id}`);
    } catch (error) {
      logger.error('Failed to create board:', error, true);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleArchiveBoard = useCallback(
    async (id: string) => {
      const boardToDelete = boards.find(b => b.id === id);
      if (!boardToDelete) return;

      const previousBoards = boards;
      setBoards(prevBoards => prevBoards.filter(board => board.id !== id));

      let nextBoardId: string | undefined = undefined;
      const remainingBoards = previousBoards.filter(b => b.id !== id);
      if (activeBoardId === id) {
        if (remainingBoards.length > 0) {
          const deletedIndex = previousBoards.findIndex(b => b.id === id);
          const nextIndex = Math.max(0, deletedIndex - 1);
          nextBoardId = remainingBoards[nextIndex]?.id;
        }
      }

      try {
        await BoardService.moveToTrash(id);

        if (activeBoardId === id) {
          if (nextBoardId) {
            navigate(`/board/${nextBoardId}`);
          } else {
            await handleCreateBoard();
            return;
          }
        }
        await fetchBoards();
      } catch (error) {
        logger.error(`Failed to move board ${id} to trash:`, error, true);
        setBoards(previousBoards);
      }
    },
    [boards, navigate, activeBoardId, handleCreateBoard, fetchBoards]
  );

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    if (!isLoading && boards.length === 0 && !didAttemptInitialBoardCreation.current) {
      didAttemptInitialBoardCreation.current = true;
      handleCreateBoard();
    }
    if (boards.length > 0 || isLoading) {
      didAttemptInitialBoardCreation.current = false;
    }
    if (activeBoardId && boards.length > 0 && !boards.find(b => b.id === activeBoardId)) {
      logger.warn('Invalid board id, navigating to last board', true);
      navigate(`/board/${boards[boards.length - 1].id}`);
    }
  }, [boards, isLoading, handleCreateBoard, activeBoardId, navigate]);

  const value = {
    boards,
    isLoading,
    fetchBoards,
    handleRenameBoard,
    handleCreateBoard,
    handleArchiveBoard,
    activeBoardId,
  };

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
};
