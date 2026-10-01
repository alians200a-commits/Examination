export interface LogoImage { src: string; ratio: number }

const MAX_CHARS = 350_000; // نحو 260KB؛ أكبر من هذا يُحوَّل إلى JPEG

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('تعذر قراءة الصورة'));
    el.src = url;
  });
}

/**
 * يصغّر الشعار قبل حفظه. الصور الكبيرة (صور هاتف مثلًا) كانت تتجاوز حد التخزين المحلي (~5MB)
 * فيفشل الحفظ التلقائي للمشروع كله، وتتضخم ملفات JSON.
 */
export async function logoFromFile(file: File, maxSide = 480): Promise<LogoImage> {
  if (file.type === 'image/svg+xml') {
    const src = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const img = await loadImage(src);
    return { src, ratio: img.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : 1 };
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('تعذر معالجة الصورة');
    ctx.drawImage(img, 0, 0, w, h);

    let src = file.type === 'image/jpeg' ? canvas.toDataURL('image/jpeg', 0.9) : canvas.toDataURL('image/png');
    if (src.length > MAX_CHARS) {
      ctx.globalCompositeOperation = 'destination-over'; // خلفية بيضاء بدل الشفافية عند التحويل لـ JPEG
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      src = canvas.toDataURL('image/jpeg', 0.85);
    }
    return { src, ratio: h / w };
  } finally {
    URL.revokeObjectURL(url);
  }
}
