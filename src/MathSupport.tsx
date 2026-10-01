import { useEffect, useRef, useState } from 'react';
import { Extension, Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react';
import katex from 'katex';
import 'mathlive';

type MathElement = HTMLElement & { value: string; getValue: (format?: string) => string; setValue: (latex: string) => void };

/** MathLive is MIT-licensed. LaTeX is the source of truth; KaTeX is only presentation. */
export function MathField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  useEffect(() => {
    const field = document.createElement('math-field') as MathElement;
    field.setAttribute('aria-label', 'محرّر المعادلة الرياضية');
    field.setAttribute('virtual-keyboard-mode', 'auto');
    field.setAttribute('smart-fence', '');
    field.className = 'math-input';
    field.value = value;
    const handleInput = () => onChangeRef.current(field.getValue('latex'));
    field.addEventListener('input', handleInput);
    host.current?.appendChild(field);
    return () => { field.removeEventListener('input', handleInput); field.remove(); };
  }, []);
  return <div className="math-host" dir="ltr" ref={host} />;
}

export function MathPreview({ latex, displayMode = false }: { latex: string; displayMode?: boolean }) {
  let markup: string;
  try { markup = katex.renderToString(latex || '\\square', { throwOnError: false, displayMode, output: 'htmlAndMathml', strict: 'ignore' }); }
  catch { markup = 'صيغة المعادلة غير صالحة'; }
  return <span className="math-render" dir="ltr" dangerouslySetInnerHTML={{ __html: markup }} />;
}

function MathView({ node, updateAttributes, selected }: NodeViewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(node.attrs.latex || ''));
  useEffect(() => { if (!editing) setDraft(String(node.attrs.latex || '')); }, [node.attrs.latex, editing]);
  return <NodeViewWrapper as="span" className={`formula-node ${selected ? 'selected-formula' : ''}`}>
    {editing ? <span className="formula-popover" contentEditable={false} onMouseDown={e => e.stopPropagation()}>
      <MathField value={draft} onChange={setDraft} />
      <button type="button" onClick={() => { updateAttributes({ latex: draft }); setEditing(false); }}>حفظ</button>
      <button type="button" className="ghost" onClick={() => setEditing(false)}>إلغاء</button>
    </span> : <span className="formula-display" contentEditable={false} title="انقر مرتين لتعديل المعادلة" onDoubleClick={() => setEditing(true)}><MathPreview latex={String(node.attrs.latex)} /></span>}
  </NodeViewWrapper>;
}

export const MathNode = Node.create({
  name: 'math', group: 'inline', inline: true, atom: true, selectable: true,
  addAttributes() { return { latex: { default: 'x^2', parseHTML: element => element.getAttribute('data-latex'), renderHTML: attrs => ({ 'data-latex': attrs.latex }) } }; },
  parseHTML() { return [{ tag: 'span[data-type="math"]' }]; },
  renderHTML({ HTMLAttributes }) { return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'math', dir: 'ltr' }), String(HTMLAttributes['data-latex'] || '')]; },
  addNodeView() { return ReactNodeViewRenderer(MathView); },
});

export const Direction = Extension.create({
  name: 'textDirection',
  addGlobalAttributes() { return [{ types: ['paragraph', 'heading', 'listItem', 'tableCell', 'tableHeader'], attributes: {
    dir: { default: null, parseHTML: element => element.getAttribute('dir'), renderHTML: attrs => attrs.dir ? { dir: attrs.dir } : {} },
  } }]; },
});

export const FontAttributes = Extension.create({
  name: 'fontAttributes',
  addGlobalAttributes() { return [{ types: ['textStyle'], attributes: {
    fontSize: { default: null, parseHTML: el => (el as HTMLElement).style.fontSize || null, renderHTML: attrs => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {} },
    fontFamily: { default: null, parseHTML: el => (el as HTMLElement).style.fontFamily || null, renderHTML: attrs => attrs.fontFamily ? { style: `font-family: ${attrs.fontFamily}` } : {} },
  } }]; },
});