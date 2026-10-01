import type { CropOutputOptions, CropResult, CropSelection, CropShape } from './types';

export async function exportCanvas(canvas: HTMLCanvasElement, selection: CropSelection,
  shape: CropShape, options: CropOutputOptions = {}): Promise<CropResult> {
  const quality = options.quality ?? 0.9;
  if (!Number.isFinite(quality) || quality < 0 || quality > 1) {
    throw new RangeError('quality must be between 0 and 1.');
  }
  const transparent = shape === 'circle' && options.transparentCircle === true;
  const format = transparent ? 'image/png' : options.format ?? 'image/webp';
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(format)) {
    throw new TypeError('Unsupported output format.');
  }
  // Always copy the engine canvas. Consumers may await an upload while the user changes the crop.
  const output = document.createElement('canvas');
  output.width = canvas.width;
  output.height = canvas.height;
  const context = output.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable.');
  if (format === 'image/jpeg') {
    context.fillStyle = '#fff';
    context.fillRect(0, 0, output.width, output.height);
  }
  if (transparent) {
    context.beginPath();
    context.ellipse(output.width / 2, output.height / 2, output.width / 2, output.height / 2, 0, 0, Math.PI * 2);
    context.clip();
  }
  context.drawImage(canvas, 0, 0);
  const blob = await new Promise<Blob>((resolve, reject) => {
    try {
      output.toBlob((value) => value ? resolve(value) : reject(new Error('Image encoding failed.')), format, quality);
    } catch {
      reject(new Error('Cannot export this image. Use a local file or a URL that allows CORS.'));
    }
  });
  return { blob, mimeType: blob.type, width: output.width, height: output.height, selection };
}
