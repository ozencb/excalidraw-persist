import { useState, useCallback } from 'react';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { ElementService, type BoardSceneData } from '../services/elementService';
import Utils from '../utils';
import logger from '../utils/logger';

const debouncedSave = Utils.debounce((boardId: string, scene: BoardSceneData) => {
  if (boardId) {
    ElementService.replaceAllElements(boardId, scene).catch(error =>
      logger.error('Error saving scene data:', error, true)
    );
  }
}, 500);

export const useExcalidrawEditor = (boardId: string | undefined) => {
  const [elements, setElements] = useState<ExcalidrawElement[]>([]);
  const [files, setFiles] = useState<BinaryFiles>({});
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

  const handleChange = useCallback(
    (excalidrawElements: readonly ExcalidrawElement[], excalidrawFiles: BinaryFiles | null) => {
      const elementsArray = [...excalidrawElements];
      const filesMap: BinaryFiles = excalidrawFiles ? { ...excalidrawFiles } : {};

      setElements(elementsArray);
      setFiles(filesMap);

      if (boardId) {
        debouncedSave(boardId, { elements: elementsArray, files: filesMap });
      }
    },
    [boardId]
  );

  return {
    elements,
    setElements,
    files,
    setFiles,
    excalidrawAPI,
    setExcalidrawAPI,
    handleChange,
  };
};
