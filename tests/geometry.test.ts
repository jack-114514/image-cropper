import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSelection, outputDimensions, pixelsToSelection, selectionToPixels } from '../src/geometry.ts';

test('coordinates survive saving and restoration for landscape and portrait photos', () => {
  for (const [width, height] of [[4032, 3024], [1200, 2400]]) {
    const saved = { left: 12.5, top: 20, width: 50, height: 60 };
    const restored = selectionToPixels(saved, width, height);
    assert.deepEqual(pixelsToSelection(restored, width, height), saved);
  }
});
test('stored crop bounds cannot escape the original image', () => {
  assert.deepEqual(normalizeSelection({ left: 90, top: -5, width: 80, height: 140 }), { left: 20, top: 0, width: 80, height: 100 });
});
test('bad stored data and empty images fail explicitly', () => {
  assert.throws(() => normalizeSelection({ left: NaN, top: 0, width: 20, height: 20 }));
  assert.throws(() => normalizeSelection({ left: 0, top: 0, width: 0, height: 20 }));
  assert.throws(() => pixelsToSelection({ left: 0, top: 0, width: 10, height: 20 }, 0, 100));
  assert.throws(() => selectionToPixels({ left: 0, top: 0, width: 10, height: 20 }, Infinity, 100));
});
test('exports preserve aspect ratio, cap dimensions and never upscale', () => {
  assert.deepEqual(outputDimensions(4000, 2000), { width: 2048, height: 1024 });
  assert.deepEqual(outputDimensions(2000, 4000, 1000), { width: 500, height: 1000 });
  assert.deepEqual(outputDimensions(100, 75, 1600), { width: 100, height: 75 });
  assert.throws(() => outputDimensions(4000, 2000, 10000));
  assert.throws(() => outputDimensions(4000, 2000, NaN));
});
