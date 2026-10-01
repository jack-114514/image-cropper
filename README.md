# INTO Image Cropper

面向网站头像、封面和背景的独立 React 图片裁剪组件。

[English](./README.en.md) · [API 与常见问题](./docs/API.md) · [更新日志](./CHANGELOG.md) · [MIT](./LICENSE)

**项目状态：0.1.0，独立源码与可安装版本包。尚未发布到 npm。** 可以直接安装 GitHub Release 中的 tarball，不要求 npm 上存在同名包。

![独立裁剪演示](./docs/demo.png)

## 能做什么

- 圆形头像、方形封面、横向/竖向背景、自由比例选框。
- 拖动图片和选框、调整选框边缘、滚轮和双指缩放；也提供可通过键盘操作的按钮。
- 选框拖到预览边缘时持续平移图片，松开后停止；圆形选框可沿圆周拖动调整大小。
- 导出 PNG、JPEG 或 WebP `Blob`，可以直接预览、下载或接入自己的上传接口。
- 圆形既可导出方形头像文件，也可导出带透明四角的圆形 PNG。
- 只获取原图百分比取景坐标，保存后恢复选框；这种方式不需要裁掉或重新编码原图。
- TypeScript 类型、中英文组件文字、CSS 变量主题、可运行演示和测试。

项目有自己的依赖、构建、演示和版本，不需要 INTO 网站、后台、数据库或服务器。第一版是 **React 18/19 组件**，适用于 Vite、Next.js 等 React 项目；不是 Vue 或普通 HTML 的直接嵌入库。

## 先运行演示

需要 Node.js >=22.13.0。克隆并启动：

```bash
git clone https://github.com/jack-114514/into-image-cropper.git
cd into-image-cropper
npm ci
npm run dev
```

打开终端提示的本地地址。选择本地图片 → 选择场景 → 调整选框 → 点击“使用此取景” → 下载图片。演示页还可以记住、恢复和下载取景坐标。

所有本地图片处理都发生在浏览器内；演示没有上传接口、账户服务或图片分析服务。示例插画随项目提供，不请求外部图片。

## 接入已有网站

在你的网站目录直接安装已构建的版本包：

```bash
npm install https://github.com/jack-114514/into-image-cropper/releases/download/v0.1.0/into-image-cropper-0.1.0.tgz
```

或者先构建源码，再安装本地文件。

在组件源码目录构建安装包：

```bash
npm ci
npm run check
npm pack
```

在你的网站目录安装生成的文件（替换为实际路径）：

```bash
npm install /path/to/into-image-cropper-0.1.0.tgz
```

Windows 也可以使用带引号的绝对路径：`npm install "C:/path/to/into-image-cropper-0.1.0.tgz"`。

```tsx
'use client';

import { useEffect, useState } from 'react';
import { ImageCropper } from 'into-image-cropper';
import type { CropResult } from 'into-image-cropper';
import 'into-image-cropper/style.css';

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
      aria-label="选择头像"
      onChange={(event) => {
        const file = event.target.files?.[0];
        if (file) { setSrc(URL.createObjectURL(file)); setResult(null); }
        event.target.value = '';
      }} />
    {src && <ImageCropper src={src} shape="circle"
      output={{ maxSize: 1024, transparentCircle: true }}
      onConfirm={setResult} onError={console.error} />}
    {preview && <img src={preview} alt="新头像" width={128} height={128} />}
  </>;
}
```

样式导入一次即可，已包含底层裁剪引擎所需样式。Next.js App Router 可以在客户端组件导入，也可以在根布局导入样式。

## 保留原图，只保存取景

```tsx
import { useRef } from 'react';
import { ImageCropper } from 'into-image-cropper';
import type { CropSelection, ImageCropperHandle } from 'into-image-cropper';
import 'into-image-cropper/style.css';

export function CoverEditor({ src, saved, onSave }: {
  src: string;
  saved?: CropSelection;
  onSave: (selection: CropSelection) => void;
}) {
  const cropper = useRef<ImageCropperHandle>(null);
  return <>
    <ImageCropper ref={cropper} src={src} aspectRatio={16 / 9}
      initialSelection={saved} />
    <button type="button" onClick={() => {
      const selection = cropper.current?.getSelection();
      if (selection) onSave(selection);
    }}>保存取景坐标</button>
  </>;
}
```

坐标相对于方向校正后的原图，单位是 **百分比 0–100**。例如：

```json
{ "left": 12.5, "top": 20, "width": 50, "height": 60 }
```

`initialSelection` 用于恢复同一图片上的选框。比例或图片变化时，应清除旧取景；改变 `initialSelection` 会重建编辑器。取景矩形与 CSS `object-position` 的含义不同，不能把 `left/top` 直接当作 `object-position`；具体展示方法见 [API 文档](./docs/API.md#展示原图中的精确取景区域)。

## 上传到自己的后端

组件只返回结果。使用 `Blob` 构造表单，把结果发送到你自己的接口：

```tsx
<ImageCropper src={src} aspectRatio={1}
  onConfirm={async ({ blob, mimeType, selection }) => {
    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType.split('/')[1];
    const form = new FormData();
    form.append('image', blob, `cover.${extension}`);
    form.append('selection', JSON.stringify(selection));
    const response = await fetch('/your-upload-endpoint', { method: 'POST', body: form });
    if (!response.ok) throw new Error('上传失败');
  }} />
```

异步 `onConfirm` 完成前按钮保持忙碌，失败时允许重试。后端自行处理身份验证、文件检查和存储。

## 开发和验证

```bash
npm run check           # 类型、坐标测试、组件构建、演示构建
npx playwright install chromium
npm run test:e2e        # 桌面及手机 Chromium 浏览器测试
npm run verify:package # 全新 React 18/19 项目安装、类型、构建和渲染检查
npm pack --dry-run     # 检查可分发文件清单
```

源码目录结构：`src/` 通用组件；`demo/` 演示；`tests/` 测试；`docs/` 接入说明；`.github/workflows/ci.yml` 自动检查。`npm run build:demo` 生成的 `demo-dist/` 可以放到任何静态站点托管服务。

## 边界和许可证

- 远程图片导出要求图片服务器允许 CORS；本地文件不需要。
- WebP 不被浏览器支持时可能回退到 PNG，应按返回的 `mimeType` 决定扩展名。
- GIF 只导出静态帧；不保留动画、EXIF 或原图文件元数据。不包含批量处理、旋转或云存储。
- 默认最大输出边长 2048，不放大原始像素。手机上极大尺寸原图仍可能占用较多内存，建议上传前限制文件大小和像素尺寸。
- 完整键盘选框编辑与所有浏览器辅助技术组合尚未认证；缩放、移动、重置和确认按钮均可通过键盘操作。

本项目使用 [MIT](./LICENSE)，允许个人和商业使用。底层裁剪引擎来自 [react-advanced-cropper](https://github.com/advanced-cropper/react-advanced-cropper)，相关版权和许可见 [第三方声明](./THIRD_PARTY_NOTICES.md)。
