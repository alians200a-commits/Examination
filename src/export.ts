import { toPng } from 'html-to-image';
import type { Aspect, ExamMeta } from './data';

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export function saveJSON(data: unknown) {
  save(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' }), 'امتحان-examination.json');
}
export async function exportPNG(node: HTMLElement) {
  // A4 at 300 dpi is approximately 2480 × 3508 pixels.
  const image = await toPng(node, { pixelRatio: 3.125, backgroundColor: '#fff', cacheBust: true });
  const response = await fetch(image);
  save(await response.blob(), 'ورقة-امتحانية-300dpi.png');
}

export async function exportVideo(node: HTMLElement, meta: ExamMeta, aspect: Aspect): Promise<void> {
  if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
    throw new Error('تصدير الفيديو غير مدعوم في هذا المتصفح. استخدم Chrome أو Edge على الحاسوب.');
  }
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find(type => MediaRecorder.isTypeSupported(type));
  if (!mime) throw new Error('المتصفح لا يدعم حفظ WebM.');

  const png = await toPng(node, { pixelRatio: 1.5, backgroundColor: '#fff', cacheBust: true });
  const paper = new Image(); paper.src = png; await paper.decode();
  const vertical = aspect === 'portrait';
  const canvas = document.createElement('canvas');
  canvas.width = vertical ? 720 : 1280; canvas.height = vertical ? 1280 : 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('تعذر إعداد مساحة الفيديو.');
  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
  const chunks: BlobPart[] = [];
  const duration = 8000;
  let raf = 0;
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  const finished = new Promise<void>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('حصل خطأ أثناء تسجيل الفيديو.'));
    recorder.onstop = () => {
      cancelAnimationFrame(raf); stream.getTracks().forEach(track => track.stop());
      if (!chunks.length) { reject(new Error('لم يُسجّل المتصفح أي إطارات.')); return; }
      save(new Blob(chunks, { type: mime }), 'فيديو-الامتحان.webm'); resolve();
    };
  });
  recorder.start(250);
  const start = performance.now();
  const draw = (now: number) => {
    const t = Math.min(1, (now - start) / duration);
    const { width: w, height: h } = canvas;
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, '#102642'); gradient.addColorStop(1, '#2d5482');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc((i * 221 + 75) % w, (i * 313 + 90 + 30 * Math.sin(t * Math.PI * 2)) % h, 50 + i * 15, 0, 2 * Math.PI); ctx.fill(); }
    ctx.direction = 'rtl'; ctx.textAlign = 'right';
    ctx.fillStyle = '#f3f7ff'; ctx.font = `bold ${vertical ? 37 : 35}px Tahoma,Arial`;
    ctx.fillText(meta.examTitle.slice(0, 38), w - 40, vertical ? 84 : 66, w - 80);
    ctx.font = `${vertical ? 23 : 20}px Tahoma,Arial`;
    ctx.fillText(`${meta.subject}  |  ${meta.grade}`, w - 43, vertical ? 123 : 103, w - 86);
    const maxW = vertical ? w - 100 : w * .56;
    const maxH = vertical ? h - 245 : h - 155;
    const fit = Math.min(maxW / paper.width, maxH / paper.height);
    const zoom = fit * (1.015 + t * 0.035);
    const pw = paper.width * zoom; const ph = paper.height * zoom;
    const px = vertical ? (w - pw) / 2 : w * .05;
    const py = vertical ? 155 - t * 25 : 130 - t * 12;
    ctx.shadowColor = 'rgba(0,0,0,.34)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#fff'; ctx.fillRect(px, py, pw, ph);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.save(); ctx.beginPath(); ctx.rect(px, py, pw, Math.min(ph, maxH)); ctx.clip(); ctx.drawImage(paper, px, py, pw, ph); ctx.restore();
    ctx.fillStyle = '#dbeafe'; ctx.font = '19px Tahoma,Arial';
    ctx.textAlign = vertical ? 'center' : 'right';
    ctx.fillText('استوديو الامتحانات', vertical ? w / 2 : w - 45, h - 32);
    if (t < 1) raf = requestAnimationFrame(draw);
    else if (recorder.state === 'recording') recorder.stop();
  };
  raf = requestAnimationFrame(draw);
  await finished;
}