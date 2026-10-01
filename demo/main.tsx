import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ImageCropper } from '../src';
import type { CropResult, CropSelection, ImageCropperHandle, CropShape } from '../src';
import './demo.css';

const presets: { name: string; shape: CropShape; aspectRatio?: number; detail: string }[] = [
  { name: '方形封面', shape: 'rectangle', aspectRatio: 1, detail: '1:1' },
  { name: '圆形头像', shape: 'circle', detail: '圆形' },
  { name: '横向背景', shape: 'rectangle', aspectRatio: 16 / 9, detail: '16:9' },
  { name: '手机背景', shape: 'rectangle', aspectRatio: 9 / 16, detail: '9:16' },
  { name: '自由比例', shape: 'rectangle', detail: '自由' },
];

function App() {
  const [source, setSource] = useState('./sample.svg');
  const [preset, setPreset] = useState(0);
  const [format, setFormat] = useState<'image/webp' | 'image/png' | 'image/jpeg'>('image/webp');
  const [transparent, setTransparent] = useState(true);
  const [selection, setSelection] = useState<CropSelection | null>(null);
  const [saved, setSaved] = useState<CropSelection | undefined>();
  const [initial, setInitial] = useState<CropSelection | undefined>();
  const [restoreId, setRestoreId] = useState(0);
  const [result, setResult] = useState<CropResult | null>(null);
  const [resultUrl, setResultUrl] = useState('');
  const [error, setError] = useState('');
  const ref = useRef<ImageCropperHandle>(null);
  const mode = presets[preset];

  useEffect(() => () => { if (source.startsWith('blob:')) URL.revokeObjectURL(source); }, [source]);
  useEffect(() => {
    if (!result) { setResultUrl(''); return; }
    const url = URL.createObjectURL(result.blob);
    setResultUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [result]);

  function upload(file?: File) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('请选择 JPEG、PNG、WebP 或 GIF 图片。'); return;
    }
    if (file.size > 20 * 1024 * 1024) { setError('请选择小于 20 MB 的图片。'); return; }
    setSource(URL.createObjectURL(file));
    setError(''); setResult(null); setSaved(undefined); setInitial(undefined); setSelection(null);
  }

  function saveSelection() {
    const current = ref.current?.getSelection();
    if (current) { setSaved(current); setError(''); }
  }

  function saveJson() {
    if (!selection) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(selection, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'crop-selection.json'; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <main className="demo">
    <header className="demo__nav"><a href="#" className="demo__brand"><span>in.</span> INTO Image Cropper</a><span className="demo__version">v0.1.0 · MIT</span></header>
    <section className="demo__intro"><p className="demo__eyebrow">A BETTER FRAME FOR YOUR IMAGES</p><h1>好照片，从选对画面开始。</h1><p>头像、封面、网站背景。选一张图片，调整取景，把结果带走。</p></section>
    <div className="demo__workspace">
      <section className="demo__editor">
        <div className="demo__topline"><span>01 / 调整画面</span><label className="demo__upload">选择本地图片<input aria-label="选择本地图片" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { upload(event.target.files?.[0]); event.target.value = ''; }} /></label></div>
        <div className="demo__presets" role="group" aria-label="取景场景">{presets.map((item, index) => <button type="button" key={item.name} aria-pressed={preset === index} onClick={() => { setPreset(index); setSaved(undefined); setInitial(undefined); setResult(null); }}><strong>{item.name}</strong><span>{item.detail}</span></button>)}</div>
        <ImageCropper key={restoreId} ref={ref} src={source} shape={mode.shape} aspectRatio={mode.aspectRatio}
          label={mode.name} initialSelection={initial} onChange={setSelection}
          output={{ maxSize: 1600, format, transparentCircle: transparent }}
          onConfirm={(value) => { setResult(value); setError(''); }}
          onError={() => setError('图片处理失败，请检查图片是否有效，然后重试。')} />
        {error && <p role="alert" className="demo__error">{error}</p>}
        <p className="demo__privacy">本地图片在浏览器内处理，不上传到服务器。</p>
      </section>
      <aside className="demo__side">
        <section className="demo__panel"><p className="demo__section-label">02 / 导出结果</p>
          <label className="demo__field">图片格式<select aria-label="图片格式" value={format} onChange={(event) => setFormat(event.target.value as typeof format)}><option value="image/webp">WebP · 推荐</option><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select></label>
          {mode.shape === 'circle' && <label className="demo__checkbox"><input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} /> 透明圆形 PNG</label>}
          <div className="demo__result">{resultUrl ? <img src={resultUrl} alt="裁剪结果" /> : <p>确认取景后<br/>在这里查看导出图片</p>}</div>
          {result && <p className="demo__result-info">{result.width} × {result.height} px · {result.mimeType.replace('image/', '').toUpperCase()} · {(result.blob.size / 1024).toFixed(1)} KB</p>}
          {resultUrl && result && <a className="demo__download" href={resultUrl} download={`into-crop.${result.mimeType === 'image/jpeg' ? 'jpg' : result.mimeType.split('/')[1]}`}>下载图片 ↓</a>}
        </section>
        <section className="demo__panel"><p className="demo__section-label">03 / 保留原图的取景</p><p className="demo__note">只保存选框的百分比坐标，原图可以继续用于大图展示。</p>
          <pre aria-label="取景坐标">{selection ? JSON.stringify(selection, null, 2) : '等待图片载入…'}</pre>
          <div className="demo__coordinate-actions"><button type="button" disabled={!selection} onClick={saveSelection}>记住此取景</button><button type="button" disabled={!saved} onClick={() => { setInitial(saved); setRestoreId((value) => value + 1); }}>恢复取景</button><button type="button" disabled={!selection} onClick={saveJson}>下载坐标</button></div>
          {saved && <p role="status" className="demo__saved">取景已记住。调整画面后可点击恢复。</p>}
        </section>
      </aside>
    </div>
    <footer className="demo__footer"><span>独立 React 组件 · 支持图片导出与取景坐标</span><span>Built on react-advanced-cropper · 示例插画由本项目原创</span></footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
