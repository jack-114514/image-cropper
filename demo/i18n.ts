export type DemoLocale = 'zh-CN' | 'en';

export function resolveDemoLocale(query: string, stored: string | null, browserLanguage: string): DemoLocale {
  const requested = new URLSearchParams(query).get('lang');
  if (requested === 'en' || requested === 'zh-CN') return requested;
  if (stored === 'en' || stored === 'zh-CN') return stored;
  return browserLanguage.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

export const demoCopy = {
  'zh-CN': {
    language: '语言', title: '好照片，从选对画面开始。',
    description: '头像、封面、网站背景。选一张图片，调整取景，把结果带走。',
    meta: 'Image Cropper — 独立的头像、封面和网站背景裁剪组件。',
    adjust: '01 / 调整画面', upload: '选择本地图片', scenarios: '取景场景',
    presets: {
      square: { name: '方形封面', detail: '1:1' }, circle: { name: '圆形头像', detail: '圆形' },
      landscape: { name: '横向背景', detail: '16:9' }, portrait: { name: '手机背景', detail: '9:16' },
      free: { name: '自由比例', detail: '自由' },
    },
    formatError: '请选择 JPEG、PNG、WebP 或 GIF 图片。', sizeError: '请选择小于 20 MB 的图片。',
    processingError: '图片处理失败，请检查图片是否有效，然后重试。',
    privacy: '本地图片在浏览器内处理，不上传到服务器。',
    export: '02 / 导出结果', format: '图片格式', recommended: 'WebP · 推荐',
    transparent: '透明圆形 PNG', resultAlt: '裁剪结果', emptyResult: '确认取景后在这里查看导出图片',
    download: '下载图片', coordinatesHeading: '03 / 保留原图的取景',
    coordinatesNote: '只保存选框的百分比坐标，原图可以继续用于大图展示。',
    coordinates: '取景坐标', loading: '等待图片载入…', remember: '记住此取景', restore: '恢复取景',
    downloadCoordinates: '下载坐标', saved: '取景已记住。调整画面后可点击恢复。',
    footer: '独立 React 组件 · 支持图片导出与取景坐标',
    credit: 'Built on react-advanced-cropper · 示例插画由本项目原创',
  },
  en: {
    language: 'Language', title: 'Find the right frame.',
    description: 'Avatars, covers and backgrounds. Choose an image, adjust the crop and take it with you.',
    meta: 'Image Cropper — independent React image cropping for avatars, covers and backgrounds.',
    adjust: '01 / Adjust your image', upload: 'Choose a local image', scenarios: 'Crop presets',
    presets: {
      square: { name: 'Square cover', detail: '1:1' }, circle: { name: 'Circle avatar', detail: 'Circle' },
      landscape: { name: 'Landscape', detail: '16:9' }, portrait: { name: 'Portrait', detail: '9:16' },
      free: { name: 'Free ratio', detail: 'Free' },
    },
    formatError: 'Choose a JPEG, PNG, WebP or GIF image.', sizeError: 'Choose an image smaller than 20 MB.',
    processingError: 'Image processing failed. Check that the image is valid and try again.',
    privacy: 'Local images stay in your browser. Nothing is uploaded.',
    export: '02 / Export the result', format: 'Image format', recommended: 'WebP · Recommended',
    transparent: 'Transparent circle PNG', resultAlt: 'Cropped image', emptyResult: 'Confirm your crop to preview the exported image here.',
    download: 'Download image', coordinatesHeading: '03 / Keep the original',
    coordinatesNote: 'Save the crop as percentage coordinates and keep the full original for larger views.',
    coordinates: 'Crop coordinates', loading: 'Waiting for the image…', remember: 'Remember this crop', restore: 'Restore crop',
    downloadCoordinates: 'Download coordinates', saved: 'Crop saved. Adjust the image, then restore it whenever you like.',
    footer: 'Independent React component · Image exports and crop coordinates',
    credit: 'Built on react-advanced-cropper · Original sample illustration',
  },
};
