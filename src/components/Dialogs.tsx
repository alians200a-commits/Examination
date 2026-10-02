import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { PenTool, Sigma, Trash2, X } from 'lucide-react';
import { ArabicMathPreview, MathField, MathPreview } from '../MathSupport';
import { arabicDigits, arabicEquationToLatex, normalizeArabicEquation } from '../arabicMath';

function Modal({ title, icon, onClose, children }: { title: string; icon: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="dialog-shade" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <div className="dialog-header">
          <h2>{icon} {title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface FormulaDialogProps {
  mode: 'insert' | 'edit';
  initial: string;
  onSubmit: (value: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

function Actions({ mode, onClose, onDelete, onSubmit, disabled = false }: { mode: 'insert' | 'edit'; onClose: () => void; onDelete: () => void; onSubmit: () => void; disabled?: boolean }) {
  return (
    <div className="dialog-actions">
      {mode === 'edit' && <button type="button" className="btn danger" onClick={onDelete}><Trash2 size={16} /> حذف</button>}
      <span className="grow" />
      <button type="button" className="btn" onClick={onClose}>إلغاء</button>
      <button type="button" className="btn primary" disabled={disabled} onClick={onSubmit}>{mode === 'edit' ? 'تحديث' : 'إدراج'}</button>
    </div>
  );
}

export function LatinMathDialog({ mode, initial, onSubmit, onDelete, onClose }: FormulaDialogProps) {
  const [latex, setLatex] = useState(initial);
  return (
    <Modal title="معادلة (LaTeX)" icon={<Sigma size={20} />} onClose={onClose}>
      <MathField value={latex.startsWith('longdiv(')?'':latex} onChange={setLatex} />
      <div className="math-symbol-strip" dir="ltr">
        {['<','>','=','\\leq','\\geq','\\neq','\\approx','\\frac{a}{b}','longdiv(12,3,4)'].map((symbol,i)=><button key={i} type="button" onClick={()=>setLatex(symbol)}>{['<','>','=','≤','≥','≠','≈','كسر عمودي','قسمة طويلة'][i]}</button>)}
      </div>
      <label className="latex-label">
        صيغة LaTeX
        <input dir="ltr" value={latex} onChange={e => setLatex(e.target.value)} />
      </label>
      <div className="math-sample"><span>المعاينة:</span><MathPreview latex={latex} displayMode /></div>
      <Actions mode={mode} onClose={onClose} onDelete={onDelete} onSubmit={() => onSubmit(latex)} />
    </Modal>
  );
}

const ARABIC_SYMBOLS = [
  'س', 'ص', 'ع', 'ل', 'م', 'ن', 'أ', 'ب', 'ج',
  '٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩', '٫',
  '²', '³', '×', '÷', '±', '=', '≠', '≈', '≤', '≥', '<', '>',
  '∈', '∉', '∪', '∩', '∞', '∑', '∫', '°', 'جا', 'جتا', 'ظا',
];

const ARABIC_STRUCTURES = [
  { label: 'كسر عمودي', body: '(س)/(ص)', icon: '½' },
  { label: 'جذر تربيعي', body: '√(س+١)', icon: '√' },
  { label: 'جذر تكعيبي', body: '∛(س+١)', icon: '∛' },
  { label: 'أسّ', body: '(س)^(٢)', icon: 'س²' },
  { label: 'قيمة مطلقة', body: '|س-٣|', icon: '|س|' },
  { label: 'كسر مركب', body: '(س+١)/(ص-٢)', icon: '▤' },
  { label: 'قسمة طويلة', body: 'قسمة(١٢،٣،٤)', icon: '⟌' },
];

export function ArabicMathDialog({ mode, initial, onSubmit, onDelete, onClose }: FormulaDialogProps) {
  const [value, setValue] = useState(normalizeArabicEquation(initial));
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const parsed = arabicEquationToLatex(value);

  const insert = (text: string, wrap?: 'fraction' | 'root' | 'square' | 'absolute') => {
    const area = areaRef.current;
    if (!area) return;
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const selected = value.slice(start, end);
    const output = wrap === 'fraction' ? `(${selected || 'س'})/(ص)`
      : wrap === 'root' ? `√(${selected || 'س'})`
      : wrap === 'square' ? `(${selected || 'س'})^(٢)`
      : wrap === 'absolute' ? `|${selected || 'س'}|` : text;
    setValue(previous => normalizeArabicEquation(previous.slice(0, start) + output + previous.slice(end)));
    requestAnimationFrame(() => { area.focus(); area.setSelectionRange(start + output.length, start + output.length); });
  };

  return (
    <Modal title="محرّر المعادلات العربية" icon={<PenTool size={20} />} onClose={onClose}>
      <p className="math-help">اكتب س، ص والأرقام العربية. للكسور والجذور والأسس استخدم الأزرار؛ يُرسَم الكسر عموديًا والجذر بصيغته الرياضية الصحيحة.</p>
      <div className="math-structure-row">
        {ARABIC_STRUCTURES.map(item => (
          <button type="button" key={item.label} onClick={() => insert(item.body,
            item.label === 'كسر عمودي' ? 'fraction'
              : item.label === 'جذر تربيعي' ? 'root'
              : item.label === 'أسّ' ? 'square'
              : item.label === 'قيمة مطلقة' ? 'absolute' : undefined
          )} title={item.label}>
            <span aria-hidden>{item.icon}</span>{item.label}
          </button>
        ))}
      </div>
      <label className="math-entry-label" htmlFor="arabic-expression">نص المعادلة بالعربية</label>
      <textarea id="arabic-expression" ref={areaRef} className="arabic-math-editor" dir="rtl" rows={3}
        value={value} onChange={e => setValue(arabicDigits(e.target.value))} spellCheck={false} />
      <div className="symbol-row" dir="rtl">
        {ARABIC_SYMBOLS.map(s => <button type="button" key={s} onClick={() => insert(s)}>{s}</button>)}
      </div>
      <div className="math-sample"><strong>معاينة الطباعة:</strong> <ArabicMathPreview value={value} displayMode /></div>
      {parsed.error && <p className="math-parse-error" role="alert">{parsed.error}</p>}
      <div className="math-examples">
        <span>أمثلة جاهزة:</span>
        {['س² + ٣س + ١ = ٠', '(س+١)/(ص-٢)', '√(س²+٩)', '٣س + ٢ص = ٩'].map(example => (
          <button type="button" key={example} onClick={() => setValue(example)}><ArabicMathPreview value={example} /></button>
        ))}
      </div>
      <Actions mode={mode} onClose={onClose} onDelete={onDelete} disabled={!!parsed.error || !value.trim()}
        onSubmit={() => onSubmit(normalizeArabicEquation(value))} />
    </Modal>
  );
}

export function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal title="تأكيد" icon={null} onClose={onCancel}>
      <p className="confirm-text">{message}</p>
      <div className="dialog-actions">
        <span className="grow" />
        <button type="button" className="btn" onClick={onCancel}>إلغاء</button>
        <button type="button" className="btn primary" onClick={onConfirm}>متابعة</button>
      </div>
    </Modal>
  );
}
