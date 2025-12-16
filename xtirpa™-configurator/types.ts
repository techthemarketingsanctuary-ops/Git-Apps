export interface SceneObject {
  id: string;
  name: string;
  type: 'primitive' | 'uploaded';
  geometryType?: 'box' | 'sphere' | 'cylinder'; // For primitives
  fileUrl?: string; // For uploaded/cloud models
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
}

export interface Measurement {
  id: string;
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  distance: number;
}

export interface DropboxFile {
  id: string;
  name: string;
  type: 'folder' | 'file';
  geometryType?: 'box' | 'sphere' | 'cylinder'; // Simulating 3D file content
  size?: string;
}

export enum ToolMode {
  SELECT = 'SELECT',
  MOVE = 'MOVE',
  ROTATE = 'ROTATE',
  SCALE = 'SCALE',
  MEASURE = 'MEASURE',
}

export interface RenderConfig {
  prompt: string;
  aspectRatio: string;
}

export interface WatermarkConfig {
  text: string;
  enabled: boolean;
  opacity: number;
}
