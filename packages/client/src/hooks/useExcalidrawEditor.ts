import { useState, useCallback, useRef } from 'react';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { ElementService } from '../services/elementService';
import Utils from '../utils';
import logger from '../utils/logger';

export const useExcalidrawEditor = (boardId: string | undefined) => {
  const [elements, setElements] = useState<ExcalidrawElement[]>([]);
  const [files, setFiles] = useState<BinaryFiles>({});
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);

  const prevVersionsRef = useRef<Map<string, number>>(new Map());
  const needsFullSyncRef = useRef(false);
  const isSavingRef = useRef(false);

  const saveScene = useCallback(
    async (elementsArray: ExcalidrawElement[], filesMap: BinaryFiles) => {
      if (!boardId || isSavingRef.current) return;
      isSavingRef.current = true;

      try {
        // Upload new files first
        const fileIds = Object.keys(filesMap);
        if (fileIds.length > 0) {
          const { missingIds } = await ElementService.checkFiles(boardId, fileIds);
          if (missingIds.length > 0) {
            const newFiles: BinaryFiles = {};
            for (const id of missingIds) {
              newFiles[id] = filesMap[id];
            }
            await ElementService.uploadFiles(boardId, newFiles);
          }
        }

        // Full sync fallback
        if (needsFullSyncRef.current) {
          await ElementService.replaceAllElements(boardId, {
            elements: elementsArray,
            files: {},
          });
          // Reset tracking
          const newVersions = new Map<string, number>();
          for (const el of elementsArray) {
            newVersions.set(el.id, el.version);
          }
          prevVersionsRef.current = newVersions;
          needsFullSyncRef.current = false;
          return;
        }

        // Compute delta
        const prev = prevVersionsRef.current;
        const currentIds = new Set<string>();
        const upserted: ExcalidrawElement[] = [];

        for (const el of elementsArray) {
          currentIds.add(el.id);
          const prevVersion = prev.get(el.id);
          if (prevVersion === undefined || prevVersion !== el.version) {
            upserted.push(el);
          }
        }

        const deleted: string[] = [];
        for (const id of prev.keys()) {
          if (!currentIds.has(id)) {
            deleted.push(id);
          }
        }

        // Skip if nothing changed
        if (upserted.length === 0 && deleted.length === 0) return;

        try {
          await ElementService.saveDelta(boardId, { upserted, deleted });
        } catch {
          // Delta failed — fall back to full replace next time
          needsFullSyncRef.current = true;
          await ElementService.replaceAllElements(boardId, {
            elements: elementsArray,
            files: {},
          });
          needsFullSyncRef.current = false;
        }

        // Update tracking
        const newVersions = new Map<string, number>();
        for (const el of elementsArray) {
          newVersions.set(el.id, el.version);
        }
        prevVersionsRef.current = newVersions;
      } catch (error) {
        logger.error('Error saving scene data:', error, true);
      } finally {
        isSavingRef.current = false;
      }
    },
    [boardId]
  );

  const saveSceneRef = useRef(saveScene);
  saveSceneRef.current = saveScene;

  const debouncedSaveRef = useRef<ReturnType<typeof Utils.debounce>>();
  if (!debouncedSaveRef.current) {
    debouncedSaveRef.current = Utils.debounce(
      (elems: ExcalidrawElement[], filesMap: BinaryFiles) => {
        saveSceneRef.current(elems, filesMap);
      },
      500
    );
  }

  const handleChange = useCallback(
    (excalidrawElements: readonly ExcalidrawElement[], excalidrawFiles: BinaryFiles | null) => {
      const elementsArray = [...excalidrawElements];
      const filesMap: BinaryFiles = excalidrawFiles ? { ...excalidrawFiles } : {};

      setElements(elementsArray);
      setFiles(filesMap);

      if (boardId) {
        debouncedSaveRef.current!(elementsArray, filesMap);
      }
    },
    [boardId]
  );

  const initializeVersionTracking = useCallback((loadedElements: ExcalidrawElement[]) => {
    const versions = new Map<string, number>();
    for (const el of loadedElements) {
      versions.set(el.id, el.version);
    }
    prevVersionsRef.current = versions;
    needsFullSyncRef.current = false;
  }, []);

  return {
    elements,
    setElements,
    files,
    setFiles,
    excalidrawAPI,
    setExcalidrawAPI,
    handleChange,
    initializeVersionTracking,
  };
};
