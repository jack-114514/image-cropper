import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ImageCropper } from '../src';
import type { CropResult, CropSelection, ImageCropperHandle, CropShape } from '../src';
import { demoCopy, resolveDemoLocale } from './i18n';
import type { DemoLocale } from './i18n';
import './demo.css';

const presets: { id: keyof typeof demoCopy.en.presets; shape: CropShape; aspectRatio?: number }[] = [
  { id: 'square', shape: 'rectangle', aspectRatio: 1 },
  { id: 'circle', shape: 'circle' },
  { id: 'landscape', shape: 'rectangle', aspectRatio: 16 / 9 },
  { id: 'portrait', shape: 'rectangle', aspectRatio: 9 / 16 },
  { id: 'free', shape: 'rectangle' },
];

function App() {
  const [locale, setLocale] = useState<DemoLocale>(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem('image-cropper-demo-locale'); } catch { /* Storage may be disabled. */ }
    return resolveDemoLocale(window.location.search, stored, navigator.language);
  });
  const text = demoCopy[locale];
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
  const [error, setError] = useState<'' | 'formatError' | 'sizeError' | 'processingError'>('');
  const ref = useRef<ImageCropperHandle>(null);
  const mode = presets[preset];
  const modeText = text.presets[mode.id];

  useEffect(() => {
    document.documentElement.lang = locale;
    document.querySelector('meta[name="description"]')?.setAttribute('content', text.meta);
  }, [locale, text.meta]);

  function chooseLanguage(next: DemoLocale) {
    setLocale(next);
    try { localStorage.setItem('image-cropper-demo-locale', next); } catch { /* The current session still works. */ }
    const url = new URL(window.location.href);
    url.searchParams.set('lang', next);
    window.history.replaceState(null, '', url);
  }

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
      setError('formatError'); return;
    }
    if (file.size > 20 * 1024 * 1024) { setError('sizeError'); return; }
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
    <header className="demo__nav"><a href="#" className="demo__brand"><span>ic.</span> Image Cropper</a><div className="demo__nav-actions"><div className="demo__languages" role="group" aria-label={text.language}><button type="button" aria-pressed={locale === 'zh-CN'} onClick={() => chooseLanguage('zh-CN')}>中文</button><button type="button" aria-pressed={locale === 'en'} onClick={() => chooseLanguage('en')}>English</button></div><span className="demo__version">v0.2.0 · MIT</span></div></header>
    <section className="demo__intro"><p className="demo__eyebrow">A BETTER FRAME FOR YOUR IMAGES</p><h1>{text.title}</h1><p>{text.description}</p></section>
    <div className="demo__workspace">
      <section className="demo__editor">
        <div className="demo__topline"><span>{text.adjust}</span><label className="demo__upload">{text.upload}<input aria-label={text.upload} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => { upload(event.target.files?.[0]); event.target.value = ''; }} /></label></div>
        <div className="demo__presets" role="group" aria-label={text.scenarios}>{presets.map((item, index) => <button type="button" key={item.id} aria-pressed={preset === index} onClick={() => { setPreset(index); setSaved(undefined); setInitial(undefined); setResult(null); }}><strong>{text.presets[item.id].name}</strong><span>{text.presets[item.id].detail}</span></button>)}</div>
        <ImageCropper key={restoreId} ref={ref} src={source} shape={mode.shape} aspectRatio={mode.aspectRatio}
          locale={locale} label={modeText.name} initialSelection={initial} onChange={setSelection}
          output={{ maxSize: 1600, format, transparentCircle: transparent }}
          onConfirm={(value) => { setResult(value); setError(''); }}
          onError={() => setError('processingError')} />
        {error && <p role="alert" className="demo__error">{text[error]}</p>}
        <p className="demo__privacy">{text.privacy}</p>
      </section>
      <aside className="demo__side">
        <section className="demo__panel"><p className="demo__section-label">{text.export}</p>
          <label className="demo__field">{text.format}<select aria-label={text.format} value={format} onChange={(event) => setFormat(event.target.value as typeof format)}><option value="image/webp">{text.recommended}</option><option value="image/png">PNG</option><option value="image/jpeg">JPEG</option></select></label>
          {mode.shape === 'circle' && <label className="demo__checkbox"><input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} /> {text.transparent}</label>}
          <div className="demo__result">{resultUrl ? <img src={resultUrl} alt={text.resultAlt} /> : <p>{text.emptyResult}</p>}</div>
          {result && <p className="demo__result-info">{result.width} × {result.height} px · {result.mimeType.replace('image/', '').toUpperCase()} · {(result.blob.size / 1024).toFixed(1)} KB</p>}
          {resultUrl && result && <a className="demo__download" href={resultUrl} download={`image-crop.${result.mimeType === 'image/jpeg' ? 'jpg' : result.mimeType.split('/')[1]}`}>{text.download} ↓</a>}
        </section>
        <section className="demo__panel"><p className="demo__section-label">{text.coordinatesHeading}</p><p className="demo__note">{text.coordinatesNote}</p>
          <pre aria-label={text.coordinates}>{selection ? JSON.stringify(selection, null, 2) : text.loading}</pre>
          <div className="demo__coordinate-actions"><button type="button" disabled={!selection} onClick={saveSelection}>{text.remember}</button><button type="button" disabled={!saved} onClick={() => { setInitial(saved); setRestoreId((value) => value + 1); }}>{text.restore}</button><button type="button" disabled={!selection} onClick={saveJson}>{text.downloadCoordinates}</button></div>
          {saved && <p role="status" className="demo__saved">{text.saved}</p>}
        </section>
      </aside>
    </div>
    <footer className="demo__footer"><span>{text.footer}</span><span>{text.credit}</span></footer>
  </main>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
