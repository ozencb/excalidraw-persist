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
import { ShareService } from '../services/shareService';
import { useExcalidrawEditor } from '../hooks/useExcalidrawEditor';
import Loader from './Loader';
import { useTheme } from '../contexts/ThemeProvider';
import { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import logger from '../utils/logger';
import { LibraryService } from '../services/libraryService';

interface ExcalidrawEditorProps {
  boardId?: string;
  shareId?: string;
  readOnly?: boolean;
}

const ExcalidrawEditor = ({ boardId, shareId, readOnly }: ExcalidrawEditorProps) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { theme: currentAppTheme, setTheme: setAppTheme } = useTheme();

  const {
    excalidrawAPI,
    elements,
    files,
    setElements,
    setFiles,
    setExcalidrawAPI,
    handleChange: onSceneChange,
    initializeVersionTracking,
  } = useExcalidrawEditor({ boardId, shareId, readOnly });

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

      onSceneChange(updatedElements, updatedFiles);

      if (appState?.theme && appState.theme !== currentAppTheme) {
        setAppTheme(appState.theme);
      }
    },
    [onSceneChange, currentAppTheme, setAppTheme]
  );

  const libraryAdapter = useMemo(() => {
    const resourceId = shareId || boardId;
    if (!resourceId) return null;

    return {
      load: async (): Promise<{ libraryItems: LibraryItems } | null> => {
        try {
          const response = shareId
            ? await ShareService.getLibrary(shareId)
            : await LibraryService.getBoardLibrary(resourceId);
          return { libraryItems: (response.libraryItems ?? []) as LibraryItems };
        } catch (error) {
          logger.error(`Error loading library:`, error, true);
          return null;
        }
      },
      save: async ({ libraryItems }: { libraryItems: LibraryItems }) => {
        if (readOnly) return;
        try {
          if (shareId) {
            await ShareService.saveLibrary(shareId, libraryItems);
          } else {
            await LibraryService.saveBoardLibrary(resourceId, libraryItems);
          }
        } catch (error) {
          logger.error(`Error saving library:`, error, true);
        }
      },
    };
  }, [boardId, shareId, readOnly]);

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
    const resourceId = shareId || boardId;
    if (!resourceId) {
      setElements([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const fetchedScene = shareId
        ? await ShareService.getElements(shareId)
        : await ElementService.getBoardElements(resourceId);
      if (fetchedScene) {
        const loadedElements = fetchedScene.elements || [];
        setElements(loadedElements);
        setFiles(fetchedScene.files || {});
        initializeVersionTracking(loadedElements);
      } else {
        setElements([]);
        setFiles({});
        initializeVersionTracking([]);
      }
    } catch (error) {
      logger.error('Error fetching board scene:', error, true);
      setElements([]);
      setFiles({});
      initializeVersionTracking([]);
    } finally {
      setIsLoading(false);
    }
  }, [boardId, shareId, setElements, setFiles, initializeVersionTracking]);

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

  const resourceId = shareId || boardId;

  if (!resourceId) {
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
          key={resourceId}
          initialData={{
            elements,
            files,
            appState: {
              theme: currentAppTheme,
            },
          }}
          onChange={handleChange}
          viewModeEnabled={readOnly}
          name={`Board: ${resourceId}`}
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
