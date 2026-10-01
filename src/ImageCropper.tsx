'use client';

import { forwardRef, useId, useImperativeHandle, useRef, useState } from 'react';
import { Cropper, ImageRestriction } from 'react-advanced-cropper';
import type { CropperRef } from 'react-advanced-cropper';
import { exportCanvas } from './export';
import { SelectionCircleStencil, SelectionRectangleStencil } from './selectionStencils';
import { outputDimensions, pixelsToSelection, selectionToPixels } from './geometry';
import type { ImageCropperHandle, ImageCropperProps } from './types';
import 'react-advanced-cropper/dist/style.css';
import './style.css';

const copy = {
  'zh-CN': { label: '图片裁剪', hint: '拖动图片或选框调整位置；拖动边缘改变范围；滚轮或双指缩放。也可使用下方按钮。',
    loading: '正在载入图片…', empty: '请先选择一张图片', failed: '图片无法载入，请选择本地图片或允许跨域访问的图片地址。',
    exporting: '正在处理…', confirm: '使用此取景', cancel: '取消', reset: '重置',
    zoomIn: '放大', zoomOut: '缩小', left: '图片左移', right: '图片右移', up: '图片上移', down: '图片下移',
    resultError: '暂时无法生成图片，请检查图片来源和导出参数。', notReady: '图片尚未载入完成。' },
  en: { label: 'Image cropper', hint: 'Drag the image or selection. Resize at the edges. Use the wheel, pinch gesture or buttons to zoom and move.',
    loading: 'Loading image…', empty: 'Choose an image first', failed: 'Cannot load this image. Choose a local file or a CORS-enabled URL.',
    exporting: 'Processing…', confirm: 'Use this crop', cancel: 'Cancel', reset: 'Reset',
    zoomIn: 'Zoom in', zoomOut: 'Zoom out', left: 'Move image left', right: 'Move image right', up: 'Move image up', down: 'Move image down',
    resultError: 'Cannot export. Check the image source and output options.', notReady: 'The image is not ready.' },
};

/** Changing the source, shape, ratio or initial selection creates a fresh editor session. */
export const ImageCropper = forwardRef<ImageCropperHandle, ImageCropperProps>(function ImageCropper(props, ref) {
  const { src, shape = 'rectangle', aspectRatio, initialSelection } = props;
  const key = JSON.stringify([src, shape, aspectRatio ?? null, initialSelection ?? null]);
  return <CropSession key={key} {...props} ref={ref} />;
});

const CropSession = forwardRef<ImageCropperHandle, ImageCropperProps>(function CropSession({
  src, shape = 'rectangle', aspectRatio, initialSelection, output, locale = 'zh-CN', label,
  className = '', disabled = false, onChange, onConfirm, onCancel, onError,
}, ref) {
  const text = copy[locale];
  const id = useId();
  const engine = useRef<CropperRef | null>(null);
  const alive = useRef(true);
  const busyRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<'' | 'failed' | 'resultError'>('');
  // Ref callback also prevents asynchronous completion from updating an old session.
  const assignRef = (instance: CropperRef | null) => { engine.current = instance; alive.current = instance !== null; };
  const ratio = shape === 'circle' ? 1 : aspectRatio;
  const validRatio = ratio === undefined || (Number.isFinite(ratio) && ratio > 0);
  const blocked = disabled || !ready || busy;

  function report(error: unknown, fallback: 'failed' | 'resultError') {
    const problem = error instanceof Error ? error : new Error(text[fallback]);
    if (alive.current) setMessage(fallback);
    onError?.(problem);
  }

  function getSelection() {
    const instance = engine.current;
    const rect = instance?.getCoordinates();
    const image = instance?.getImage();
    return rect && image ? pixelsToSelection(rect, image.width, image.height) : null;
  }

  async function getResult() {
    const instance = engine.current;
    const rect = instance?.getCoordinates();
    const selection = getSelection();
    if (!ready || !instance || !rect || !selection) throw new Error(text.notReady);
    const size = outputDimensions(rect.width, rect.height, output?.maxSize);
    const canvas = instance.getCanvas({ ...size, imageSmoothingEnabled: true, imageSmoothingQuality: 'high' });
    if (!canvas) throw new Error(text.notReady);
    return exportCanvas(canvas, selection, shape, output);
  }

  function reset() {
    if (!blocked) { setMessage(''); engine.current?.reset(); }
  }

  useImperativeHandle(ref, () => ({ getSelection, getResult, reset }));

  function onReady(instance: CropperRef) {
    try {
      const image = instance.getImage();
      if (initialSelection && image) instance.setCoordinates(selectionToPixels(initialSelection, image.width, image.height));
      setMessage('');
      setReady(true);
      const rect = instance.getCoordinates();
      if (rect && image) onChange?.(pixelsToSelection(rect, image.width, image.height));
    } catch (error) {
      // Invalid stored coordinates do not make a newly selected local file unusable.
      setReady(true);
      report(error, 'resultError');
    }
  }

  async function confirm() {
    if (blocked || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setMessage('');
    try {
      const result = await getResult();
      if (alive.current) await onConfirm?.(result);
    } catch (error) { if (alive.current) report(error, 'resultError'); }
    finally {
      busyRef.current = false;
      if (alive.current) setBusy(false);
    }
  }

  function move(x: number, y: number) {
    if (blocked) return;
    const area = engine.current?.getVisibleArea();
    if (area) engine.current?.moveImage(x * area.width * 0.03, y * area.height * 0.03);
  }

  return <section className={`image-cropper ${className}`} aria-labelledby={`${id}-label`} aria-busy={busy}>
    <h2 id={`${id}-label`} className="image-cropper__label">{label ?? text.label}</h2>
    <p id={`${id}-hint`} className="image-cropper__hint">{text.hint}</p>
    <div className="image-cropper__stage" aria-describedby={`${id}-hint`}>
      {src && validRatio ? <Cropper ref={assignRef} src={src} className="image-cropper__engine"
        stencilComponent={shape === 'circle' ? SelectionCircleStencil : SelectionRectangleStencil}
        stencilProps={{ aspectRatio: ratio, movable: true, resizable: true, disabled: disabled || busy }}
        imageRestriction={ImageRestriction.fillArea} crossOrigin="anonymous" checkOrientation
        disabled={disabled || busy} backgroundWrapperProps={{ moveImage: true, scaleImage: true, rotateImage: false }} transitions={false}
        onReady={onReady}
        onError={() => { setReady(false); report(new Error(text.failed), 'failed'); }}
        onChange={(instance) => {
          const rect = instance.getCoordinates();
          const image = instance.getImage();
          if (rect && image) onChange?.(pixelsToSelection(rect, image.width, image.height));
        }} /> : <p className="image-cropper__placeholder">{src ? 'aspectRatio must be greater than zero.' : text.empty}</p>}
      {src && validRatio && !ready && !message && <span className="image-cropper__loading" role="status">{text.loading}</span>}
    </div>
    <div className="image-cropper__tools" role="group" aria-label={label ?? text.label}>
      <button type="button" disabled={blocked} onClick={() => engine.current?.zoomImage(1.15)}>{text.zoomIn}</button>
      <button type="button" disabled={blocked} onClick={() => engine.current?.zoomImage(1 / 1.15)}>{text.zoomOut}</button>
      <button type="button" disabled={blocked} onClick={() => move(-1, 0)} aria-label={text.left}>←</button>
      <button type="button" disabled={blocked} onClick={() => move(1, 0)} aria-label={text.right}>→</button>
      <button type="button" disabled={blocked} onClick={() => move(0, -1)} aria-label={text.up}>↑</button>
      <button type="button" disabled={blocked} onClick={() => move(0, 1)} aria-label={text.down}>↓</button>
      <button type="button" disabled={blocked} onClick={reset}>{text.reset}</button>
    </div>
    {message && <p className="image-cropper__error" role="alert">{text[message]}</p>}
    {(onConfirm || onCancel) && <div className="image-cropper__actions">
      {onConfirm && <button type="button" className="image-cropper__confirm" disabled={blocked} onClick={() => void confirm()}>{busy ? text.exporting : text.confirm}</button>}
      {onCancel && <button type="button" disabled={busy} onClick={onCancel}>{text.cancel}</button>}
    </div>}
  </section>;
});
