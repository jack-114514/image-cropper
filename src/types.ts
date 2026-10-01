export type CropShape = 'rectangle' | 'circle';
export type ImageFormat = 'image/png' | 'image/jpeg' | 'image/webp';

/** Percentages relative to the orientation-corrected source image, all in [0, 100]. */
export interface CropSelection {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface CropOutputOptions {
  /** Limit the longest side. Does not upscale. Default: 2048; maximum: 8192. */
  maxSize?: number;
  format?: ImageFormat;
  /** Between 0 and 1. Only used for JPEG/WebP. Default: 0.9. */
  quality?: number;
  /** Circle output with transparent corners (forces PNG). Default: false. */
  transparentCircle?: boolean;
}

export interface CropResult {
  blob: Blob;
  /** The format actually produced by the browser, including any fallback. */
  mimeType: string;
  width: number;
  height: number;
  selection: CropSelection;
}

export interface ImageCropperHandle {
  getSelection(): CropSelection | null;
  getResult(): Promise<CropResult>;
  reset(): void;
}

export interface ImageCropperProps {
  /** A local object URL, data URL or CORS-enabled image URL. */
  src: string;
  shape?: CropShape;
  /** Undefined means free ratio. A circle always uses 1:1. */
  aspectRatio?: number;
  /** Applied when an image loads; changing this prop remounts/restores the editor. */
  initialSelection?: CropSelection;
  output?: CropOutputOptions;
  locale?: 'zh-CN' | 'en';
  label?: string;
  className?: string;
  disabled?: boolean;
  onChange?(selection: CropSelection): void;
  /** Return a Promise to keep the confirm button busy during upload/save. */
  onConfirm?(result: CropResult): void | Promise<void>;
  onCancel?(): void;
  onError?(error: Error): void;
}
