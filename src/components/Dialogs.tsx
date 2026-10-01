import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { PenTool, Sigma, Trash2, X } from 'lucide-react';
import { ArabicMathPreview, MathField, MathPreview } from '../MathSupport';

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

function Actions({ mode, onClose, onDelete, onSubmit }: { mode: 'insert' | 'edit'; onClose: () => void; onDelete: () => void; onSubmit: () => void }) {
  return (
    <div className="dialog-actions">
      {mode === 'edit' && <button type="button" className="btn danger" onClick={onDelete}><Trash2 size={16} /> حذف</button>}
      <span className="grow" />
      <button type="button" className="btn" onClick={onClose}>إلغاء</button>
      <button type="button" className="btn primary" onClick={onSubmit}>{mode === 'edit' ? 'تحديث' : 'إدراج'}</button>
    </div>
  );
}

export function LatinMathDialog({ mode, initial, onSubmit, onDelete, onClose }: FormulaDialogProps) {
  const [latex, setLatex] = useState(initial);
  return (
    <Modal title="معادلة (LaTeX)" icon={<Sigma size={20} />} onClose={onClose}>
      <MathField value={latex} onChange={setLatex} />
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
  '²', '³', '√', '×', '÷', '±', '=', '≠', '≈', '≤', '≥', '<', '>',
  '∈', '∉', '⊂', '∪', '∩', '∅', 'ℝ', 'ℕ', 'ℤ', 'ℚ',
  'π', '∞', '°', '→', '⟹', '∑', '∫', 'جا', 'جتا', 'ظا', 'لو',
];

export function ArabicMathDialog({ mode, initial, onSubmit, onDelete, onClose }: FormulaDialogProps) {
  const [value, setValue] = useState(initial);
  const areaRef = useRef<HTMLTextAreaElement>(null);

  // الإدراج عند موضع المؤشر (كان يُضاف دائمًا في نهاية النص).
  const insert = (text: string) => {
    const el = areaRef.current;
    if (!el) { setValue(v => v + text); return; }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    setValue(value.slice(0, start) + text + value.slice(end));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(start + text.length, start + text.length); });
  };

  return (
    <Modal title="معادلة عربية" icon={<PenTool size={20} />} onClose={onClose}>
      <textarea ref={areaRef} className="arabic-math-editor" dir="rtl" rows={3} value={value} onChange={e => setValue(e.target.value)} />
      <div className="symbol-row">
        {ARABIC_SYMBOLS.map(s => <button type="button" key={s} onClick={() => insert(s)}>{s}</button>)}
      </div>
      <div className="math-sample"><span>المعاينة:</span><ArabicMathPreview value={value} /></div>
      <Actions mode={mode} onClose={onClose} onDelete={onDelete} onSubmit={() => onSubmit(value)} />
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
