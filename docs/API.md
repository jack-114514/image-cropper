# API 与接入说明

## 属性

| 属性 | 类型 | 默认值 / 说明 |
| --- | --- | --- |
| `src` | `string` | 必填，本地 object URL、data URL 或允许 CORS 的地址 |
| `shape` | `'rectangle' \| 'circle'` | `rectangle` |
| `aspectRatio` | `number` | 不传为自由比例，必须有限且大于 0；圆形固定为 1 |
| `initialSelection` | `CropSelection` | 原图百分比选框，载入时恢复 |
| `output.maxSize` | `number` | 默认 2048，范围 1–8192，不放大原始像素 |
| `output.format` | PNG / JPEG / WebP MIME | 默认 `image/webp` |
| `output.quality` | `number` | 默认 0.9，0–1，只对 JPEG/WebP 有效 |
| `output.transparentCircle` | `boolean` | 默认 false；圆形为 true 时强制透明 PNG |
| `locale` | `'zh-CN' \| 'en'` | `zh-CN` |
| `label` | `string` | 替换组件标题及操作分组的可访问名称 |
| `className` | `string` | 添加包装类名 |
| `disabled` | `boolean` | 默认 false |
| `onChange` | `(selection) => void` | 拖动过程中触发，可用于轻量预览 |
| `onConfirm` | `(result) => void \| Promise<void>` | 存在时展示确认按钮；异步完成前保持忙碌 |
| `onCancel` | `() => void` | 存在时展示取消按钮 |
| `onError` | `(error: Error) => void` | 加载、坐标恢复或导出失败 |

`onChange` 频繁触发，保存到服务器时建议在确认后提交或自行防抖。`initialSelection` 是初始恢复值，不是受控属性，不要每次 `onChange` 都回填它。图片、比例、形状或初始坐标变化时会建立新的编辑会话。

## 结果

```ts
interface CropSelection { left: number; top: number; width: number; height: number }
interface CropResult {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
  selection: CropSelection;
}
```

取景单位为百分比。`left/top` 从方向校正后的原图左上角开始，`width/height` 分别相对于原图宽高。保存坐标时同时保存图片 ID/地址和场景比例。

通过 ref 可调用 `getSelection()`、`getResult()` 和 `reset()`。`getSelection()` 不需要导出图片，即使只想保存原图取景也可使用。`getResult()` 是 Promise，手动调用时自行 catch 错误。图片未载入时返回拒绝的 Promise。`reset()` 恢复引擎默认选框，不会重新应用初始保存坐标；重新应用坐标可更新 `initialSelection` 或重挂载组件。

## 展示原图中的精确取景区域

对于原图宽高 `IW/IH` 和百分比选框 `crop`，精确取景的容器比例为：

```ts
const frameAspect = (IW * crop.width) / (IH * crop.height);
```

将原图绝对定位在该容器内：

```tsx
<div style={{ position: 'relative', overflow: 'hidden', aspectRatio: frameAspect }}>
  <img src={src} alt="封面" style={{
    position: 'absolute', maxWidth: 'none',
    width: `${10000 / crop.width}%`, height: `${10000 / crop.height}%`,
    left: `${-100 * crop.left / crop.width}%`,
    top: `${-100 * crop.top / crop.height}%`,
  }} />
</div>
```

这是固定比例下的精确选框展示。容器换成不同的比例后，无法同时保证选中区域完全一致和画面不变形；可以按设备单独保存取景，或按你的网站规则围绕主体重新 cover。不要直接将 `left/top` 当成 `object-position`。

## 样式

```css
.my-editor {
  --into-crop-accent: #6948d2;
  --into-crop-text: #f4f4f5;
  --into-crop-surface: #202427;
  --into-crop-border: #46504d;
}
```

传入 `className="my-editor"`。组件 CSS 使用 `into-cropper` 前缀，并包含引擎 CSS，不要求网站具有任何全局样式。

## 常见问题

**图片 URL 可以显示，却无法导出？** 图片服务器必须允许 CORS。组件以匿名跨域模式载入远程图片；优先使用用户选择的本地文件，或配置自己的图片域名响应头。组件不提供跨域代理。

**圆形头像为什么默认还是方形文件？** 很多网站用 CSS 把方形图片显示成圆形。需要真实透明圆形文件时开启 `transparentCircle`，结果为 PNG。

**为什么小图没有被放大到 maxSize？** `maxSize` 是输出上限，而不是强制尺寸，避免把小图放大后误认为变清晰。

**选框恢复后有变化？** 恢复同一原图、同一形状与同一比例。更换比例时引擎会调整选框以满足约束。非法坐标触发错误回调并保留默认选框；超出原图边界的有限坐标会被限制到图内。

**Next.js 报浏览器 API 问题？** 使用客户端组件；不要在服务端执行 `getResult()` 或创建 object URL。分发入口带有 `use client`。样式只导入一次。

**图片会发送给作者吗？** 组件没有上传、分析或遥测请求。本地 object URL 不离开浏览器；如果传入远程地址，浏览器会请求你指定的图片服务器。你的 `onConfirm` 可自行实现上传。

**支持哪些浏览器？** 浏览器验证覆盖桌面与手机尺寸的 Chromium。Firefox/Safari 和实际 iOS/Android 设备需要使用者按目标环境验收，目前不宣称完成全部跨浏览器认证。
