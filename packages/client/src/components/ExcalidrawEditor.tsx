import { useState, useEffect, useCallback, useMemo } from 'react';
import { Excalidraw, useHandleLibrary } from '@excalidraw/excalidraw';
import type {
  ExcalidrawImperativeAPI,
  AppState,
  BinaryFiles,
  LibraryItems,
} from '@excalidraw/excalidraw/types';
import '../styles/ExcalidrawEditor.scss';
import { ElementService } from '../services/elementService';
import { useExcalidrawEditor } from '../hooks/useExcalidrawEditor';
import Loader from './Loader';
import { useTheme } from '../contexts/ThemeProvider';
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import logger from '../utils/logger';
import Utils from '../utils';
import { LibraryService } from '../services/libraryService';

interface ExcalidrawEditorProps {
  boardId: string;
}

const debouncedHandleChange = Utils.debounce((f: () => void) => {
  f();
}, 500);

const ExcalidrawEditor = ({ boardId }: ExcalidrawEditorProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { theme: currentAppTheme, setTheme: setAppTheme } = useTheme();

  const {
    excalidrawAPI,
    elements,
    files,
    setElements,
    setFiles,
    setExcalidrawAPI,
    handleChange: originalHandleChange,
  } = useExcalidrawEditor(boardId);

  const handleExcalidrawAPI = useCallback(
    (api: ExcalidrawImperativeAPI) => setExcalidrawAPI(api),
    [setExcalidrawAPI]
  );

  const handleChange = useCallback(
    (
      updatedElements: readonly ExcalidrawElement[],
      appState: AppState,
      updatedFiles: BinaryFiles | null
    ) => {
      if (
        updatedElements.length === 0 &&
        (!updatedFiles || Object.keys(updatedFiles).length === 0)
      ) {
        return;
      }

      const filesSnapshot: BinaryFiles = updatedFiles ? { ...updatedFiles } : {};

      debouncedHandleChange(() => {
        originalHandleChange(updatedElements, filesSnapshot);
      });

      if (appState?.theme && appState.theme !== currentAppTheme) {
        setAppTheme(appState.theme);
      }
    },
    [originalHandleChange, currentAppTheme, setAppTheme]
  );

  const libraryAdapter = useMemo(() => {
    if (!boardId) {
      return null;
    }

    return {
      load: async (): Promise<{ libraryItems: LibraryItems } | null> => {
        try {
          const response = await LibraryService.getBoardLibrary(boardId);
          return {
            libraryItems: response.libraryItems ?? [],
          };
        } catch (error) {
          logger.error(`Error loading library for board ${boardId}:`, error, true);
          return null;
        }
      },
      save: async ({ libraryItems }: { libraryItems: LibraryItems }) => {
        try {
          await LibraryService.saveBoardLibrary(boardId, libraryItems);
        } catch (error) {
          logger.error(`Error saving library for board ${boardId}:`, error, true);
        }
      },
    };
  }, [boardId]);

  useHandleLibrary(libraryAdapter ? { excalidrawAPI, adapter: libraryAdapter } : { excalidrawAPI });

  useEffect(() => {
    if (excalidrawAPI) {
      const currentExcalidrawTheme = excalidrawAPI.getAppState().theme;
      if (currentExcalidrawTheme !== currentAppTheme) {
        excalidrawAPI.updateScene({ appState: { theme: currentAppTheme } });
      }
      const updatedExcalidrawTheme = excalidrawAPI.getAppState().theme;
      if (updatedExcalidrawTheme !== currentAppTheme) {
        setAppTheme(updatedExcalidrawTheme);
      }
    }
  }, [excalidrawAPI, currentAppTheme, setAppTheme]);

  const fetchBoardElements = useCallback(async () => {
    if (!boardId) {
      setElements([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const fetchedScene = await ElementService.getBoardElements(boardId);
      if (fetchedScene) {
        setElements(fetchedScene.elements || []);
        setFiles(fetchedScene.files || {});
      } else {
        setElements([]);
        setFiles({});
      }
    } catch (error) {
      logger.error('Error fetching board scene:', error, true);
      setElements([]);
      setFiles({});
    } finally {
      setIsLoading(false);
    }
  }, [boardId, setElements, setFiles]);

  useEffect(() => {
    fetchBoardElements();
  }, [fetchBoardElements]);

  if (isLoading) {
    return (
      <div className="excalidraw-editor">
        <div className="excalidraw-container">
          <Loader message="Loading board elements..." />
        </div>
      </div>
    );
  }

  if (!boardId) {
    return (
      <div className="excalidraw-editor">
        <div className="excalidraw-container">
          <p>Please select or create a board.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="excalidraw-editor">
      <div className="excalidraw-container relative">
        <Excalidraw
          key={boardId}
          initialData={{
            elements,
            files,
            appState: {
              theme: currentAppTheme,
            },
          }}
          onChange={handleChange}
          name={`Board: ${boardId}`}
          excalidrawAPI={handleExcalidrawAPI}
          UIOptions={{
            canvasActions: {
              saveToActiveFile: false,
              saveAsImage: true,
              export: false,
              loadScene: false,
            },
          }}
        />
      </div>
    </div>
  );
};

export default ExcalidrawEditor;
