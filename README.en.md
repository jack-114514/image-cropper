# Image Cropper

An independent React component for avatar, cover and website background cropping.

[中文](./README.md) · [API and FAQ](./docs/API.en.md) · [Changelog](./CHANGELOG.md) · [MIT](./LICENSE)

Version 0.2.0 provides standalone source and an installable release tarball. It is **not published to npm yet**. It has no dependency on any existing website, backend or database.

![English cropper demo](./docs/demo.en.png)

## Run the demo

Node.js >=22.13.0 is required for development. Obtain this repository's source, then run:

```bash
git clone https://github.com/jack-114514/image-cropper.git
cd image-cropper
npm ci
npm run dev
```

The demo supports local uploads, square covers, circular avatars, landscape/portrait backgrounds, free ratios, real image downloads and saved crop coordinates. Local files are processed in the browser; the demo does not upload images. The included sample illustration is original project artwork.

Open the local URL printed in the terminal with `?lang=en` (for example, `http://127.0.0.1:5173/?lang=en`). You can also use the **English / 中文** buttons. The URL parameter takes priority over the saved preference; without either, Chinese browser languages select Chinese and other languages select English. Switching languages preserves your image, crop, saved coordinates and exported preview. `?lang=zh-CN` opens Chinese explicitly.

![English mobile demo](./docs/demo-mobile.en.png)

## Install into a React website

Install the prebuilt GitHub Release package directly:

```bash
npm install https://github.com/jack-114514/image-cropper/releases/download/v0.2.0/image-cropper-0.2.0.tgz
```

Or build and install from source:

Build the package in this repository:

```bash
npm ci
npm run check
npm pack
```

Then install the resulting tarball in your website project:

```bash
npm install /path/to/image-cropper-0.2.0.tgz
```

React 18.2+ and React 19 are supported peers. Vue and plain HTML need a separate integration. The package is ESM and ships TypeScript declarations.

```tsx
'use client';
import { ImageCropper } from 'image-cropper';
import 'image-cropper/style.css';

// src can be a local URL.createObjectURL(file) or a CORS-enabled image URL.
<ImageCropper src={src} shape="circle" locale="en"
  output={{ maxSize: 1024, transparentCircle: true }}
  onConfirm={async ({ blob, mimeType, selection }) => {
    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
    const form = new FormData();
    form.append('image', blob, `avatar.${extension}`);
    form.append('selection', JSON.stringify(selection));
    const response = await fetch('/your-upload-endpoint', { method: 'POST', body: form });
    if (!response.ok) throw new Error('Upload failed');
  }}
  onError={(error) => console.error(error)} />
```

### Complete local file and preview example

This example cleans up object URLs when a file or preview is replaced or the editor unmounts:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ImageCropper } from 'image-cropper';
import type { CropResult } from 'image-cropper';
import 'image-cropper/style.css';

export default function AvatarEditor() {
  const [src, setSrc] = useState('');
  const [result, setResult] = useState<CropResult | null>(null);
  const [preview, setPreview] = useState('');

  useEffect(() => () => { if (src) URL.revokeObjectURL(src); }, [src]);
  useEffect(() => {
    if (!result) { setPreview(''); return; }
    const url = URL.createObjectURL(result.blob);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  return <>
    <input type="file" accept="image/jpeg,image/png,image/webp"
      aria-label="Choose an avatar"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) { setSrc(URL.createObjectURL(file)); setResult(null); }
        event.target.value = '';
      }} />
    {src && <ImageCropper src={src} shape="circle" locale="en"
      output={{ maxSize: 1024, transparentCircle: true }}
      onConfirm={setResult} onError={console.error} />}
    {preview && <img src={preview} alt="New avatar" width={128} height={128} />}
  </>;
}
```

Import the stylesheet once. For Next.js App Router, use a client component; the stylesheet can also be imported in your root layout.

### Keep the original and save only crop coordinates

```tsx
'use client';

import { useRef } from 'react';
import { ImageCropper } from 'image-cropper';
import type { CropSelection, ImageCropperHandle } from 'image-cropper';
import 'image-cropper/style.css';

export function CoverEditor({ src, saved, onSave }: {
  src: string;
  saved?: CropSelection;
  onSave: (selection: CropSelection) => void;
}) {
  const cropper = useRef<ImageCropperHandle>(null);
  return <>
    <ImageCropper ref={cropper} src={src} aspectRatio={16 / 9}
      locale="en" initialSelection={saved} />
    <button type="button" onClick={() => {
      const selection = cropper.current?.getSelection();
      if (selection) onSave(selection);
    }}>Save crop coordinates</button>
  </>;
}
```

Save the coordinates with the original image identity and aspect ratio. See the [English API guide](./docs/API.en.md#display-the-exact-crop-from-the-original) for displaying the exact crop without encoding a new image.

## Props and methods

| Prop | Default | Meaning |
| --- | --- | --- |
| `src` | required | Local object URL, data URL or CORS-enabled image URL |
| `shape` | `rectangle` | `rectangle` or `circle` |
| `aspectRatio` | free | Positive width/height ratio; circle always uses 1 |
| `initialSelection` | none | Restore a percentage crop for the same source image |
| `output` | see below | Format, quality, size limit and transparent circle |
| `locale` | `zh-CN` | `zh-CN` or `en` |
| `label` | localized | Accessible editor heading |
| `disabled` | false | Disable editing and confirmation |
| `onChange` | none | Current percentage coordinates; fires during editing |
| `onConfirm` | none | Receives `CropResult`; may return a Promise |
| `onCancel` | none | Optional cancel button callback |
| `onError` | none | Receives an Error |
| `className` | empty | Additional wrapper class |

`output`: `maxSize` defaults to 2048 (1–8192, no upscaling), `format` defaults to `image/webp`, `quality` defaults to 0.9 (0–1), `transparentCircle` defaults to false (true forces PNG for a circle).

`CropResult` contains `blob`, actual `mimeType`, output `width`, `height` and `selection`.

With `ref: ImageCropperHandle`, call `getSelection(): CropSelection | null`, `getResult(): Promise<CropResult>` or `reset(): void`. Coordinate-only saves do not encode or replace the original image. `getResult()` rejects if no image is ready or encoding fails; callers must handle this rejection.

`CropSelection` is `{ left, top, width, height }`, all in percentages relative to the orientation-corrected original image. Changing `src`, shape, ratio or `initialSelection` resets the editor session. Do not feed every `onChange` result into `initialSelection`: it is a restoration prop, not a controlled value. Store coordinates with the image identity. Different aspect ratios may adjust a restored selection to fit their constraints. CSS `object-position` is not equivalent to these coordinates.

## Theme and limitations

Override `--image-crop-accent`, `--image-crop-text`, `--image-crop-surface` and `--image-crop-border` on `.image-cropper`. Dragging, edge resizing, wheel/pinch zoom and keyboard-operable controls are available. Full keyboard-only stencil resizing and comprehensive assistive-technology certification are not claimed.

Remote sources require CORS. GIF output is a static frame. Canvas encoding does not retain original metadata. Use the returned MIME type because WebP can fall back to PNG. Large originals can still consume substantial memory. The component does not provide authentication, storage, batching or rotation.

## Validate

```bash
npm run check
npx playwright install chromium
npm run test:e2e
npm run verify:package
npm pack --dry-run
```

`npm run build:demo` creates a static `demo-dist/` directory. CI runs type, geometry, package/demo build and desktop/mobile Chromium checks.

MIT license. Cropping is powered by [react-advanced-cropper](https://github.com/advanced-cropper/react-advanced-cropper) by Norserium. See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
