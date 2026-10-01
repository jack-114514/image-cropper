import type { CropSelection } from './types';

export interface PixelRect { left: number; top: number; width: number; height: number }

const clamp = (n: number, low: number, high: number) => Math.min(high, Math.max(low, n));

function validImage(width: number, height: number) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('Image dimensions must be finite and greater than zero.');
  }
}

/** Validate stored coordinates before they reach the crop engine. */
export function normalizeSelection(selection: CropSelection): CropSelection {
  if (!selection || !['left', 'top', 'width', 'height'].every((key) =>
    Number.isFinite(selection[key as keyof CropSelection]))) {
    throw new TypeError('Crop selection must contain four finite numbers.');
  }
  if (selection.width <= 0 || selection.height <= 0) {
    throw new RangeError('Crop width and height must be greater than zero.');
  }
  const width = clamp(selection.width, 0, 100);
  const height = clamp(selection.height, 0, 100);
  return { left: clamp(selection.left, 0, 100 - width), top: clamp(selection.top, 0, 100 - height), width, height };
}

export function selectionToPixels(selection: CropSelection, imageWidth: number, imageHeight: number): PixelRect {
  validImage(imageWidth, imageHeight);
  const rect = normalizeSelection(selection);
  return { left: rect.left * imageWidth / 100, top: rect.top * imageHeight / 100,
    width: rect.width * imageWidth / 100, height: rect.height * imageHeight / 100 };
}

export function pixelsToSelection(rect: PixelRect, imageWidth: number, imageHeight: number): CropSelection {
  validImage(imageWidth, imageHeight);
  return normalizeSelection({ left: rect.left / imageWidth * 100, top: rect.top / imageHeight * 100,
    width: rect.width / imageWidth * 100, height: rect.height / imageHeight * 100 });
}

export function outputDimensions(width: number, height: number, maxSize = 2048) {
  validImage(width, height);
  if (!Number.isFinite(maxSize) || maxSize < 1 || maxSize > 8192) {
    throw new RangeError('maxSize must be between 1 and 8192.');
  }
  const scale = Math.min(1, maxSize / Math.max(width, height));
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}
