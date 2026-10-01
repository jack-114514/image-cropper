# API and integration guide

[中文](./API.md) · [Back to README](../README.en.md)

## Props

| Prop | Type | Default / meaning |
| --- | --- | --- |
| `src` | `string` | Required; local object URL, data URL or CORS-enabled image URL |
| `shape` | `'rectangle' \| 'circle'` | `rectangle` |
| `aspectRatio` | `number` | Omit for a free ratio; must be finite and positive; circles always use 1 |
| `initialSelection` | `CropSelection` | Restore a percentage selection when loading the image |
| `output.maxSize` | `number` | 2048; range 1–8192; never upscale the original pixels |
| `output.format` | PNG / JPEG / WebP MIME | `image/webp` |
| `output.quality` | `number` | 0.9; range 0–1; applies to JPEG/WebP |
| `output.transparentCircle` | `boolean` | false; true forces transparent PNG for circles |
| `locale` | `'zh-CN' \| 'en'` | `zh-CN`; set `en` for English controls and messages |
| `label` | `string` | Override the heading and accessible control group name |
| `className` | `string` | Add a wrapper class |
| `disabled` | `boolean` | false |
| `onChange` | `(selection) => void` | Fires while editing; suitable for lightweight previews |
| `onConfirm` | `(result) => void \| Promise<void>` | Show a confirmation button; remain busy until the callback completes |
| `onCancel` | `() => void` | Show an optional cancel button |
| `onError` | `(error: Error) => void` | Report loading, selection restoration or export errors |

`onChange` fires frequently. Submit to your server after confirmation or debounce updates. `initialSelection` restores an initial crop; it is not a controlled value. Do not feed every `onChange` result back into it. Changing the source, shape, ratio or initial selection creates a fresh editing session. Changing `locale` or `label` preserves the session and updates visible labels and existing error messages.

The component does not read browser language or local storage. Set its `locale` explicitly. The standalone demo adds its own language switch and preferences, described in the [README](../README.en.md#run-the-demo).

## Results and ref methods

```ts
interface CropSelection {
  left: number;
  top: number;
  width: number;
  height: number;
}
interface CropResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  selection: CropSelection;
}
interface ImageCropperHandle {
  getSelection(): CropSelection | null;
  getResult(): Promise<CropResult>;
  reset(): void;
}
```

Selections use percentages, 0–100. `left` and `top` start at the top-left of the orientation-corrected original; `width` and `height` are relative to the original image width and height. For example, `{ left: 12.5, top: 20, width: 50, height: 60 }`. Save the image identity and scenario ratio along with these coordinates.

`blob` is the encoded image, `mimeType` is its actual MIME type and `width`/`height` are output pixel dimensions. Use the returned MIME type to choose the file extension; a browser may fall back from WebP to PNG. A transparent circle forces PNG.

Call these methods through a React `ref` typed as `ImageCropperHandle`. `getSelection()` returns null before coordinates are available and never encodes an image. `getResult()` returns a Promise and rejects if the image is not ready or encoding fails; catch errors when calling it manually. `reset()` restores the engine's default crop, rather than reapplying saved coordinates. Change `initialSelection` or remount to reapply a saved crop.

## Display the exact crop from the original

For original dimensions `IW` and `IH` and a percentage selection `crop`, calculate the frame ratio:

```ts
const frameAspect = (IW * crop.width) / (IH * crop.height);
```

Position the original image inside the clipped frame:

```tsx
<div style={{ position: 'relative', overflow: 'hidden', aspectRatio: frameAspect }}>
  <img src={src} alt="Cover" style={{
    position: 'absolute', maxWidth: 'none',
    width: `${10000 / crop.width}%`, height: `${10000 / crop.height}%`,
    left: `${-100 * crop.left / crop.width}%`,
    top: `${-100 * crop.top / crop.height}%`,
  }} />
</div>
```

Use valid selections and the same orientation-corrected image. This displays the exact selected region at its original ratio. If the container ratio changes, the selected region cannot remain identical without stretching or showing a different area. Save separate crops per device, or apply your own subject-aware cover rules. `left`/`top` are not CSS `object-position` values.

## Theme

```css
.my-editor {
  --image-crop-accent: #6948d2;
  --image-crop-text: #f4f4f5;
  --image-crop-surface: #202427;
  --image-crop-border: #46504d;
}
```

Pass `className="my-editor"` and import `image-cropper/style.css` once. Component styles use the `image-cropper` prefix and include the cropping engine stylesheet. No website-wide styles are required.

## FAQ

**Why does an image URL display elsewhere but fail here or during export?** The image server must allow CORS. The component loads remote images in anonymous cross-origin mode. Prefer local files or configure the image server's response headers. No CORS proxy is provided.

**Why is a circular avatar still a square file by default?** Many websites display square avatar files inside a CSS circle. Set `transparentCircle: true` for an actual circular image with transparent corners; the output is PNG.

**Why is a small image not enlarged to `maxSize`?** This is an output limit, not a required size. Upscaling is avoided because it cannot add original detail.

**Why did my restored crop change?** Restore the same image, shape and ratio. Different ratios adjust the selection to meet constraints. Invalid coordinates trigger the error callback and retain a default crop. Finite coordinates extending beyond the image are clamped inside it.

**How do I use this with Next.js?** Import the component in a client component. Do not call `getResult()` or create object URLs on the server. The distribution entry includes `use client`. Import styles once, either in the client component or root layout.

**Are my images sent to the author?** The component has no upload, analytics or telemetry requests. Local object URLs stay in the browser. Remote URLs request the image server you specify. Your own `onConfirm` callback can upload results to your backend.

**Which browsers are tested?** Automated checks cover desktop and mobile-size Chromium. Firefox, Safari and physical iOS/Android devices require validation for your target environment. Full cross-browser and assistive-technology certification is not claimed.

**What are the image and editing limitations?** GIF exports a static frame. Canvas encoding removes original metadata, including EXIF. Large source images can use substantial memory even with a small output limit. There is no batching, rotation, authentication or storage service. Buttons support keyboard operation; complete keyboard-only stencil resizing is not provided.
