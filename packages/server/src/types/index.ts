export enum BoardStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DELETED',
}

export interface Board {
  id: number;
  name: string;
  status: 'ACTIVE' | 'DELETED';
  created_at: number;
  updated_at: number;
}

export interface Element {
  id: string;
  board_id: number;
  data: string; // JSON string
  element_index: string;
  type: string;
  created_at: number;
  updated_at: number;
  is_deleted: boolean;
}

export interface StoredFile {
  id: string;
  board_id: number;
  data: string;
  created_at: number;
  updated_at: number;
}

export interface ExcalidrawElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  angle: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: string;
  strokeWidth: number;
  strokeStyle: string;
  roughness: number;
  opacity: number;
  groupIds: string[];
  frameId?: string | null;
  index?: string; // Index from Excalidraw element (a0, a1, etc.)
  seed: number;
  version: number;
  versionNonce: number;
  isDeleted: boolean;
  boundElements?: BoundElement[] | null;
  updated: number;
  link?: string | null;
  locked: boolean;
  fileId?: string; // For image elements
  status?: string;

  // Additional optional properties that may be present
  fontSize?: number;
  fontFamily?: string;
  text?: string;
  textAlign?: string;
  verticalAlign?: string;
  baseline?: number;
  containerId?: string;
  points?: readonly [number, number][];
  customData?: Record<string, unknown>;

  // For other unknown properties
  [key: string]: unknown;
}

export interface ExcalidrawBinaryFileData {
  id: string;
  dataURL: string;
  mimeType: string;
  created?: number;
  lastRetrieved?: number;
  size?: number;
  type?: string;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

export type ExcalidrawFilesMap = Record<string, ExcalidrawBinaryFileData>;

export interface ExcalidrawSceneData {
  elements: ExcalidrawElement[];
  files: ExcalidrawFilesMap;
}

export type UpdateBoardInput = {
  name?: string;
  status?: BoardStatus;
};

export interface BoundElement {
  id: string;
  type: string;
}
