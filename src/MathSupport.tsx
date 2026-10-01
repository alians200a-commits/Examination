import { useEffect, useRef } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import katex from 'katex';
import 'mathlive';

type MathElement = HTMLElement & {
  value: string;
  getValue: (format?: string) => string;
  setValue: (latex: string) => void;
};

export function MathField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  const fieldRef = useRef<MathElement | null>(null);
  const currentValue = useRef(value);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (fieldRef.current && currentValue.current !== value) {
      fieldRef.current.setValue(value);
      currentValue.current = value;
    }
  }, [value]);

  useEffect(() => {
    const field = document.createElement('math-field') as MathElement;
    field.setAttribute('aria-label', 'محرّر المعادلة الرياضية');
    field.setAttribute('virtual-keyboard-mode', 'manual');
    field.setAttribute('smart-fence', '');
    field.className = 'math-input';
    field.value = value;
    fieldRef.current = field;
    const handleInput = () => {
      currentValue.current = field.getValue('latex');
      onChangeRef.current(currentValue.current);
    };
    field.addEventListener('input', handleInput);
    host.current?.appendChild(field);
    return () => {
      field.removeEventListener('input', handleInput);
      field.remove();
      fieldRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div className="math-host" dir="ltr" ref={host} />;
}

export function MathPreview({ latex, displayMode = false }: { latex: string; displayMode?: boolean }) {
  const markup = katex.renderToString(latex || '\\square', {
    throwOnError: false,
    displayMode,
    output: 'htmlAndMathml',
    strict: 'ignore',
  });
  return <span className="math-render" dir="ltr" dangerouslySetInnerHTML={{ __html: markup }} />;
}

export function ArabicMathPreview({ value }: { value: string }) {
  return <span className="arabic-math-render" dir="rtl">{value || 'س² + ٣س + ١ = ٠'}</span>;
}

/** المعادلة داخل الورقة: النقر يفتح نافذة التعديل (تعمل بالمس، بخلاف النقر المزدوج). */
function FormulaView({ node, extension, getPos, selected }: NodeViewProps) {
  const isArabic = extension.name === 'arabicMath';
  const value = String(isArabic ? node.attrs.value : node.attrs.latex);
  const edit = () => {
    const pos = getPos();
    if (typeof pos === 'number') extension.options.onEdit?.(pos, value);
  };
  return (
    <NodeViewWrapper as="span" className={`formula-node ${isArabic ? 'arabic-formula' : ''} ${selected ? 'selected-formula' : ''}`}>
      <span
        className="formula-display"
        contentEditable={false}
        role="button"
        tabIndex={0}
        title="اضغط لتعديل المعادلة"
        onClick={edit}
        onKeyDown={e => { if (e.key === 'Enter') edit(); }}
      >
        {isArabic ? <ArabicMathPreview value={value} /> : <MathPreview latex={value} />}
      </span>
    </NodeViewWrapper>
  );
}

type EditHandler = (pos: number, value: string) => void;

export const MathNode = Node.create<{ onEdit?: EditHandler }>({
  name: 'math',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addOptions() {
    return { onEdit: undefined };
  },
  addAttributes() {
    return {
      latex: {
        default: 'x^2',
        parseHTML: element => element.getAttribute('data-latex'),
        renderHTML: attrs => ({ 'data-latex': attrs.latex }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-type="math"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'math', dir: 'ltr' }), String(HTMLAttributes['data-latex'] || '')];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FormulaView);
  },
});

export const ArabicMathNode = Node.create<{ onEdit?: EditHandler }>({
  name: 'arabicMath',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addOptions() {
    return { onEdit: undefined };
  },
  addAttributes() {
    return {
      value: {
        default: 'س² + ٣س + ١ = ٠',
        parseHTML: element => element.getAttribute('data-value'),
        renderHTML: attrs => ({ 'data-value': attrs.value }),
      },
    };
  },
  parseHTML() {
    return [{ tag: 'span[data-type="arabic-math"]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'arabic-math', dir: 'rtl' }), String(HTMLAttributes['data-value'] || '')];
  },
  addNodeView() {
    return ReactNodeViewRenderer(FormulaView);
  },
});
