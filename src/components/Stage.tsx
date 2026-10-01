import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

const MM = 96 / 25.4;               // بكسل لكل ملم
const SHEET_PX = 210 * MM;          // عرض A4
const MARGIN_MM = 12;               // هامش الطباعة (يطابق @page و padding الورقة)
const CONTENT_MM = 297 - MARGIN_MM * 2;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * يعرض الورقة بعرض A4 حقيقي ثابت ثم يصغّرها لتناسب الشاشة (مثل معاينة الطباعة في Word)،
 * بدل إعادة ترتيب محتواها في عمود ضيق على الموبايل. حدود الصفحات تقريبية لأن القص الفعلي يحدث عند الطباعة.
 */
export function Stage({ children }: { children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(800);
  const [sheetHeight, setSheetHeight] = useState(297 * MM);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');

  useEffect(() => {
    const viewport = viewportRef.current;
    const sheet = sheetRef.current;
    if (!viewport || !sheet) return;
    const a = new ResizeObserver(() => setAvailable(viewport.clientWidth));
    const b = new ResizeObserver(() => setSheetHeight(sheet.offsetHeight));
    a.observe(viewport);
    b.observe(sheet);
    return () => { a.disconnect(); b.disconnect(); };
  }, []);

  const fit = clamp((available - 24) / SHEET_PX, 0.3, 1);
  const scale = zoom === 'fit' ? fit : zoom;
  const step = (delta: number) => setZoom(clamp(Math.round((scale + delta) * 100) / 100, 0.3, 2));

  // الارتفاع الأدنى للورقة (297mm) صفحة واحدة؛ هامش 4px يمنع ظهور حدّ صفحة وهمي بسبب تقريب البكسل.
  const pages = Math.max(1, Math.ceil((sheetHeight - 2 * MARGIN_MM * MM - 4) / (CONTENT_MM * MM)));
  const guides = Array.from({ length: pages - 1 }, (_, i) => i + 1);

  return (
    <div className="stage">
      <div className="stage-scroll" ref={viewportRef}>
        <div className="sheet-box" style={{ width: SHEET_PX * scale, height: sheetHeight * scale }}>
          <div className="sheet-scale" ref={sheetRef} style={{ transform: `scale(${scale})` }}>
            {children}
            <div className="page-guides" aria-hidden>
              {guides.map(n => (
                <div key={n} className="page-guide" style={{ top: (MARGIN_MM + CONTENT_MM * n) * MM }}>
                  <span>نهاية الصفحة {n} (تقريبي)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="zoom-bar" role="group" aria-label="التكبير">
        <button type="button" onClick={() => step(-0.1)} aria-label="تصغير"><ZoomOut size={16} /></button>
        <span>{Math.round(scale * 100)}%</span>
        <button type="button" onClick={() => step(0.1)} aria-label="تكبير"><ZoomIn size={16} /></button>
        <button type="button" className={zoom === 'fit' ? 'on' : ''} onClick={() => setZoom('fit')} aria-label="ملاءمة العرض"><Maximize2 size={15} /></button>
      </div>
    </div>
  );
}
