import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import {
  AlignCenter, AlignLeft, AlignRight, Bold, BookOpen, Check, Heading2, ImagePlus, Italic, List, ListOrdered,
  Minus, PanelRightOpen, PenTool, Plus, Printer, Redo2, Save, SeparatorHorizontal, Sigma, Table2,
  Trash2, Type, Underline as UnderlineIcon, Undo2, Upload, ClipboardList, Eye,
} from 'lucide-react';
import { defaultLogo, defaults, logoHome } from './data';
import type { ExamMeta, LogoSettings, Project, Theme } from './data';
import { ArabicMathNode, MathNode } from './MathSupport';
import { Direction, FontAttributes, PageBreak } from './extensions';
import { printToPDF, saveJSON } from './export';
import { loadProject, sanitizeProject, saveProject } from './storage';
import { logoFromFile } from './image';
import { Stage } from './components/Stage';
import { ExamSheet } from './components/ExamSheet';
import { SettingsPanel } from './components/SettingsPanel';
import { ArabicMathDialog, ConfirmDialog, LatinMathDialog } from './components/Dialogs';
import { QuestionBuilder, type FormulaTarget } from './components/QuestionBuilder';
import { StructuredSheet } from './components/StructuredSheet';
import { newExam, type StructuredExam, type QuestionFormula } from './formExam';
import { numberingFor } from './curriculum';


type RibbonTab = 'home' | 'insert';
const RIBBON_LABELS: Record<RibbonTab, string> = { home: 'الرئيسية', insert: 'إدراج' };

const FONTS = [
  { label: 'الخط الافتراضي', value: '' },
  { label: 'Noto Naskh', value: "'Noto Naskh Arabic', serif" },
  { label: 'Cairo', value: "'Cairo', sans-serif" },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: "'Times New Roman', serif" },
];
const SIZES = [10, 11, 12, 13, 14, 16, 18, 20, 24];

const NO_UI = {
  bold: false, italic: false, underline: false, inTable: false, ol: false, ul: false, h2: false,
  right: false, center: false, left: false, canUndo: false, canRedo: false, fontFamily: '', fontSize: '',
};

type FormulaState = { mode: 'insert' } | { mode: 'edit'; pos: number; value: string } | null;

function Tool({ title, onClick, active = false, disabled = false, children }: { title: string; onClick: () => void; active?: boolean; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" className={`tool-btn ${active ? 'active' : ''}`} title={title} aria-label={title} aria-pressed={active} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
const Sep = () => <span className="sep" aria-hidden />;

export default function App() {
  const initial = useMemo(() => loadProject(), []);
  const [meta, setMeta] = useState<ExamMeta>(() => ({ ...defaults, ...initial.meta }));
  const [theme, setTheme] = useState<Theme>(initial.theme || 'official');
  const [logo, setLogo] = useState<LogoSettings>(() => ({ ...defaultLogo, ...initial.logo }));
  const [ribbon, setRibbon] = useState<RibbonTab>('home');
  const mode = 'form' as const;
  const [structured, setStructured] = useState<StructuredExam>(() => {
    if(initial.structured) return {...initial.structured,showFreeText:initial.structured.showFreeText||initial.mode==='free'};
    const start=newExam();
    return {...start,questions:initial.mode==='free'?[]:start.questions,
      pageCount:import.meta.env.DEV && new URLSearchParams(location.search).get('smokePages')==='2'?2:1,
      showFreeText:initial.mode==='free'};
  });
  const [mobileView, setMobileView] = useState<'builder' | 'preview'>(() => import.meta.env.DEV && new URLSearchParams(location.search).has('smokePreview') ? 'preview' : 'builder');
  const [activePage,setActivePage]=useState(0);
  const [overflowPages,setOverflowPages]=useState<number[]>([]);
  const [formTarget, setFormTarget] = useState<FormulaTarget | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [latexDialog, setLatexDialog] = useState<FormulaState>(null);
  const [arabicDialog, setArabicDialog] = useState<FormulaState>(null);
  const [confirm, setConfirm] = useState<{ message: string; run: () => void } | null>(null);
  const [revision, setRevision] = useState(0);
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'error'>('saved');
  const [toast, setToast] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const fontRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<number>();

  const notify = useCallback((text: string) => {
    setToast(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 2600);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }), Underline, TextStyle, Color,
      TextAlign.configure({ types: ['heading', 'paragraph', 'tableCell', 'tableHeader'] }),
      // تغيير عرض الأعمدة بالسحب يعمل معكوسًا في الاتجاه RTL، لذلك أُوقف.
      Table.configure({ resizable: false }), TableRow, TableCell, TableHeader,
      MathNode.configure({ onEdit: (pos, value) => setLatexDialog({ mode: 'edit', pos, value }) }),
      ArabicMathNode.configure({ onEdit: (pos, value) => setArabicDialog({ mode: 'edit', pos, value }) }),
      Direction, FontAttributes, PageBreak,
    ],
    content: initial.document ?? '<p></p>',
    editorProps: { attributes: { class: 'exam-editor', dir: 'rtl', spellcheck: 'false', 'aria-label': 'محرّر ورقة الامتحان' } },
    onUpdate: () => setRevision(v => v + 1),
  });

  const ui = useEditorState<typeof NO_UI>({
    editor,
    selector: ({ editor: e }) => ({
      bold: !!e?.isActive('bold'), italic: !!e?.isActive('italic'), underline: !!e?.isActive('underline'),
      inTable: !!e?.isActive('table'),
      ol: !!e?.isActive('orderedList'), ul: !!e?.isActive('bulletList'), h2: !!e?.isActive('heading', { level: 2 }),
      right: !!e?.isActive({ textAlign: 'right' }), center: !!e?.isActive({ textAlign: 'center' }), left: !!e?.isActive({ textAlign: 'left' }),
      canUndo: !!e?.can().undo(), canRedo: !!e?.can().redo(),
      fontFamily: (e?.getAttributes('textStyle').fontFamily as string | null) || '',
      fontSize: (e?.getAttributes('textStyle').fontSize as string | null) || '',
    }),
  }) ?? NO_UI;

  const buildProject = useCallback((): Project => ({
    version: 2, meta, theme, logo, document: editor?.getJSON() ?? { type: 'doc', content: [] }, mode, structured,
  }), [editor, meta, theme, logo, mode, structured]);

  useEffect(() => {
    if (!editor) return;
    setSaveState('saving');
    const id = window.setTimeout(() => setSaveState(saveProject(buildProject()) ? 'saved' : 'error'), 700);
    return () => window.clearTimeout(id);
    // revision يتغير مع كل تعديل في المحتوى
  }, [editor, buildProject, revision]);

  const run = () => editor?.chain().focus();
  const setTextStyle = (attrs: Record<string, string | null>) => {
    if (!editor) return;
    const prev = editor.getAttributes('textStyle');
    editor.chain().focus().setMark('textStyle', { ...prev, ...attrs }).removeEmptyTextStyle().run();
  };
  const applyDirection = (dir: 'rtl' | 'ltr') => {
    if (!editor) return;
    const target = editor.isActive('heading') ? 'heading' : editor.isActive('listItem') ? 'listItem' : 'paragraph';
    editor.chain().focus().updateAttributes(target, { dir }).run();
  };

  const updateMeta = (key: keyof ExamMeta, value: string) => setMeta(v => ({ ...v, [key]: value }));

  useEffect(()=>{
    if(!meta.customFontSrc)return;
    let live=true;
    const font=new FontFace('ExamUserFont', `url(${meta.customFontSrc})`);
    document.fonts.add(font);
    font.load().catch(()=>{if(live)notify('تعذر تحميل الخط المرفوع، اختر ملف خط صالحًا.');});
    return()=>{live=false;document.fonts.delete(font);};
  },[meta.customFontSrc,notify]);
  const onFontUpload=async(e:ChangeEvent<HTMLInputElement>)=>{
    const file=e.currentTarget.files?.[0];e.currentTarget.value='';if(!file)return;
    if(!/\.(ttf|otf|woff2?)$/i.test(file.name)||file.size>1_000_000){notify('الخط يجب أن يكون TTF أو OTF أو WOFF2 وأقل من 1 ميغابايت.');return;}
    const reader=new FileReader();
    reader.onload=()=>{
      setMeta(v=>({...v,customFontSrc:String(reader.result),customFontName:file.name,fontFamily:"'ExamUserFont', serif"}));
      notify('تم رفع الخط؛ سيظهر في المعاينة والطباعة.');
    };
    reader.onerror=()=>notify('تعذر قراءة الخط.');
    reader.readAsDataURL(file);
  };
  const onLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const { src, ratio } = await logoFromFile(file);
      setLogo(v => ({ ...v, src, ratio, name: file.name, ...logoHome(v.width, ratio) }));
      notify('تم رفع الشعار');
    } catch {
      notify('تعذر قراءة الصورة');
    }
  };

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    let project: Partial<Project> | null = null;
    try { project = sanitizeProject(JSON.parse(await file.text())); } catch { /* ملف غير صالح */ }
    if (!project) { notify('الملف ليس مشروع امتحان صالحًا'); return; }
    const p = project;
    setConfirm({
      message: 'سيتم استبدال المشروع الحالي بمحتوى الملف. متابعة؟',
      run: () => {
        setMeta({ ...defaults, ...p.meta });
        setTheme(p.theme || 'official');
        setLogo({ ...defaultLogo, ...p.logo });
        editor?.commands.setContent(p.document!);
        setStructured(p.structured ? {...p.structured,showFreeText:p.structured.showFreeText || p.mode==='free'} : {...newExam(),questions:p.mode==='free'?[]:newExam().questions,showFreeText:p.mode==='free'});
        setActivePage(0);
        notify('تم استيراد المشروع');
      },
    });
  };

  const editFormFormula = useCallback((target: FormulaTarget) => {
    setFormTarget(target);
    if (target.language === 'arabic') setArabicDialog({ mode: 'insert' });
    else setLatexDialog({ mode: 'insert' });
  }, []);
  const setFormFormula = (target: FormulaTarget, value: string) => {
    const formula: QuestionFormula = { language: target.language, value };
    setStructured(previous => ({ ...previous,
      questions: previous.questions.map(q => {
        if (q.id !== target.questionId) return q;
        if (!target.partId) return { ...q, formula };
        return { ...q, parts: q.parts.map(p => p.id === target.partId ? { ...p, formula } : p) };
      }),
    }));
    setFormTarget(null);
  };

  const submitLatex = (latex: string) => {
    if (formTarget?.language === 'latin') { setFormFormula(formTarget, latex); setLatexDialog(null); return; }
    if (!editor || !latexDialog) return;
    if (latexDialog.mode === 'edit') {
      const pos = latexDialog.pos;
      editor.chain().focus().command(({ tr }) => { tr.setNodeMarkup(pos, undefined, { latex }); return true; }).run();
    } else {
      editor.chain().focus().insertContent({ type: 'math', attrs: { latex } }).run();
    }
    setLatexDialog(null);
  };
  const submitArabic = (value: string) => {
    if (formTarget?.language === 'arabic') { setFormFormula(formTarget, value); setArabicDialog(null); return; }
    if (!editor || !arabicDialog) return;
    if (arabicDialog.mode === 'edit') {
      const pos = arabicDialog.pos;
      editor.chain().focus().command(({ tr }) => { tr.setNodeMarkup(pos, undefined, { value }); return true; }).run();
    } else {
      editor.chain().focus().insertContent({ type: 'arabicMath', attrs: { value } }).run();
    }
    setArabicDialog(null);
  };
  const deleteFormula = (dialog: FormulaState, close: () => void) => {
    if (!editor || !dialog || dialog.mode !== 'edit') return;
    const pos = dialog.pos;
    editor.chain().focus().command(({ tr, state }) => {
      const node = state.doc.nodeAt(pos);
      if (node) tr.delete(pos, pos + node.nodeSize);
      return true;
    }).run();
    close();
  };

  const numbered = meta.numbering && meta.numbering !== 'auto' ? meta.numbering : numberingFor(meta.stage,meta.subject);
  const pageCount = Math.max(1, Math.min(30, structured.pageCount || 1));
  const measurePages=useCallback(()=>{
    const nodes=Array.from(document.querySelectorAll<HTMLElement>('.a4-stack .page-content'));
    if(!nodes.length || nodes.some(n=>n.clientHeight===0))return [];
    const result=nodes.flatMap((n,i)=>n.scrollHeight>n.clientHeight+2?[i]:[]);
    setOverflowPages(previous=>previous.join(',')===result.join(',')?previous:result);
    return result;
  },[]);
  useEffect(()=>{
    if(mobileView==='builder' && window.matchMedia('(max-width:1099px)').matches)return;
    const roots=Array.from(document.querySelectorAll<HTMLElement>('.a4-stack .sq-exam, .a4-stack .free-extra'));
    const observer=new ResizeObserver(()=>measurePages());
    roots.forEach(root=>observer.observe(root));
    const raf=requestAnimationFrame(measurePages);
    return()=>{observer.disconnect();cancelAnimationFrame(raf);};
  },[structured,meta,logo,revision,mobileView,measurePages]);
  const exportPDF=async()=>{
    setMobileView('preview');
    try{
      await document.fonts.ready;
      const images=Array.from(document.querySelectorAll<HTMLImageElement>('.a4-stack img'));
      await Promise.all(images.map(img=>img.decode().catch(()=>undefined)));
      await new Promise<void>(res=>requestAnimationFrame(()=>requestAnimationFrame(()=>res())));
      const over=measurePages();
      if(over.length){notify('الصفحة '+over.map(i=>i+1).join('، ')+' ممتلئة؛ انقل الأسئلة أو قلّل حجم المحتوى قبل تصدير PDF.');return;}
      printToPDF();
    }catch{notify('تعذّر إعداد الطباعة. افتح البرنامج في Chrome ثم حاول مرة أخرى.');}
  };

  const saveLabel = saveState === 'saving' ? 'جارٍ الحفظ…' : saveState === 'error' ? 'تعذر الحفظ التلقائي — احفظ المشروع كملف' : 'تم الحفظ تلقائيًا';

  return (
    <div className={`app mode-${mode}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><BookOpen size={20} /></span>
          <div className="brand-text"><strong>استوديو الامتحانات</strong><small>{meta.examTitle}</small></div>
        </div>
        <div className="top-actions">
          <button type="button" className="btn compact settings-toggle" onClick={() => setPanelOpen(true)} aria-label="الإعدادات"><PanelRightOpen size={17} /><span className="lbl">الإعدادات</span></button>
          <button type="button" className="btn compact" onClick={() => importRef.current?.click()} aria-label="فتح مشروع"><Upload size={17} /><span className="lbl">فتح</span></button>
          <button type="button" className="btn compact" onClick={() => saveJSON(buildProject())} aria-label="حفظ مشروع"><Save size={17} /><span className="lbl">حفظ</span></button>
          <button type="button" className="btn compact primary" onClick={()=>void exportPDF()} aria-label="تصدير PDF"><Printer size={17} /><span className="lbl">PDF</span></button>
        </div>
        <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={onImport} />
        <input ref={logoRef} type="file" accept="image/*" hidden onChange={onLogoUpload} />
        <input ref={fontRef} type="file" accept=".ttf,.otf,.woff,.woff2" hidden onChange={onFontUpload} />
      </header>

      {structured.showFreeText && <div className="ribbon">
        <nav className="ribbon-tabs" role="tablist">
          {(Object.keys(RIBBON_LABELS) as RibbonTab[]).map(k => (
            <button key={k} type="button" role="tab" aria-selected={ribbon === k} className={ribbon === k ? 'current' : ''} onClick={() => setRibbon(k)}>{RIBBON_LABELS[k]}</button>
          ))}
        </nav>
        <div className="ribbon-strip">
          {ribbon === 'home' && <>
            <Tool title="تراجع" disabled={!ui.canUndo} onClick={() => run()?.undo().run()}><Undo2 size={18} /></Tool>
            <Tool title="إعادة" disabled={!ui.canRedo} onClick={() => run()?.redo().run()}><Redo2 size={18} /></Tool>
            <Sep />
            <Tool title="عريض" active={ui.bold} onClick={() => run()?.toggleBold().run()}><Bold size={18} /></Tool>
            <Tool title="مائل" active={ui.italic} onClick={() => run()?.toggleItalic().run()}><Italic size={18} /></Tool>
            <Tool title="تسطير" active={ui.underline} onClick={() => run()?.toggleUnderline().run()}><UnderlineIcon size={18} /></Tool>
            <Sep />
            <select className="tool-select" aria-label="نوع الخط" value={ui.fontFamily} onChange={e => setTextStyle({ fontFamily: e.target.value || null })}>
              {FONTS.map(f => <option key={f.label} value={f.value}>{f.label}</option>)}
            </select>
            <select className="tool-select narrow" aria-label="حجم الخط" value={ui.fontSize} onChange={e => setTextStyle({ fontSize: e.target.value || null })}>
              <option value="">الحجم</option>
              {SIZES.map(s => <option key={s} value={`${s}pt`}>{s}</option>)}
            </select>
            <label className="color-control" title="لون النص"><Type size={16} /><input type="color" defaultValue="#163a70" aria-label="لون النص" onChange={e => run()?.setColor(e.target.value).run()} /></label>
            <Sep />
            <Tool title="محاذاة لليمين" active={ui.right} onClick={() => run()?.setTextAlign('right').run()}><AlignRight size={18} /></Tool>
            <Tool title="توسيط" active={ui.center} onClick={() => run()?.setTextAlign('center').run()}><AlignCenter size={18} /></Tool>
            <Tool title="محاذاة لليسار" active={ui.left} onClick={() => run()?.setTextAlign('left').run()}><AlignLeft size={18} /></Tool>
            <Sep />
            <Tool title="قائمة مرقمة" active={ui.ol} onClick={() => run()?.toggleOrderedList().run()}><ListOrdered size={18} /></Tool>
            <Tool title="قائمة نقطية" active={ui.ul} onClick={() => run()?.toggleBulletList().run()}><List size={18} /></Tool>
            <Sep />
            <button type="button" className="chip" onClick={() => applyDirection('rtl')}>عربي RTL</button>
            <button type="button" className="chip" onClick={() => applyDirection('ltr')}>English LTR</button>
          </>}

          {ribbon === 'insert' && <>
            <Tool title="عنوان سؤال" active={ui.h2} onClick={() => run()?.toggleHeading({ level: 2 }).run()}><Heading2 size={18} /></Tool>
            <Tool title="جدول" onClick={() => run()?.insertTable({ rows: 2, cols: 3, withHeaderRow: false }).run()}><Table2 size={18} /></Tool>
            <Tool title="خط فاصل" onClick={() => run()?.setHorizontalRule().run()}><Minus size={18} /></Tool>
            <Tool title="إضافة صفحة A4" onClick={() => setStructured(p=>({...p,pageCount:Math.min(30,(p.pageCount||1)+1)}))}><SeparatorHorizontal size={18} /></Tool>
            <Tool title="إدراج شعار" onClick={() => { setPanelOpen(true); logoRef.current?.click(); }}><ImagePlus size={18} /></Tool>
            <Sep />
            <button type="button" className="chip" onClick={() => setLatexDialog({ mode: 'insert' })}><Sigma size={15} /> معادلة</button>
            <button type="button" className="chip" onClick={() => setArabicDialog({ mode: 'insert' })}><PenTool size={15} /> معادلة عربية</button>
            {ui.inTable && <>
              <Sep />
              <button type="button" className="chip" onClick={() => run()?.addRowAfter().run()}><Plus size={14} /> صف</button>
              <button type="button" className="chip" onClick={() => run()?.addColumnAfter().run()}><Plus size={14} /> عمود</button>
              <button type="button" className="chip" onClick={() => run()?.deleteRow().run()}><Trash2 size={14} /> صف</button>
              <button type="button" className="chip" onClick={() => run()?.deleteColumn().run()}><Trash2 size={14} /> عمود</button>
              <button type="button" className="chip danger" onClick={() => run()?.deleteTable().run()}><Trash2 size={14} /> الجدول</button>
            </>}
          </>}

        </div>
      </div>}

      <div className="workspace form-workspace">
        <div className="form-workflow">
          <nav className="form-mobile-switch" aria-label="كتابة ومعاينة الامتحان">
            <button type="button" className={mobileView==='builder'?'active':''} onClick={()=>setMobileView('builder')}><ClipboardList size={16}/> كتابة الأسئلة</button>
            <button type="button" className={mobileView==='preview'?'active':''} onClick={()=>setMobileView('preview')}><Eye size={16}/> معاينة A4</button>
          </nav>
          <div className={`form-builder-pane ${mobileView==='builder'?'mobile-active':''}`}>
            <QuestionBuilder exam={structured} setExam={setStructured} meta={meta} onMeta={updateMeta} onFormula={editFormFormula}
              onPrint={()=>void exportPDF()} onError={notify} onFontUpload={()=>fontRef.current?.click()} activePage={activePage} onActivePage={page=>setActivePage(page)} overflowPages={overflowPages}/>
          </div>
          <div className={`form-preview-pane ${mobileView==='preview'?'mobile-active':''}`}>
            <Stage><div className="a4-stack">{Array.from({length:pageCount},(_,index)=><ExamSheet key={index} editor={editor}
              body={<><StructuredSheet exam={structured} page={index} numbering={numbered}/>
                {index===pageCount-1 && structured.showFreeText && <section className="free-extra"><h3>نص إضافي — تحرير حر</h3><EditorContent editor={editor}/></section>}
              </>}
              closing={structured.closing} showNameLine={index===0} showHeader={index===0} showFooter={index===pageCount-1}
              flipPage={index<pageCount-1} pageIndex={index} meta={meta} theme={theme} logo={logo} setLogo={setLogo}/>)}</div></Stage>
          </div>
        </div>
        <SettingsPanel
          open={panelOpen} onClose={() => setPanelOpen(false)}
          theme={theme} onTheme={setTheme}
          logo={logo} setLogo={setLogo} onPickLogo={() => logoRef.current?.click()}
        />
      </div>

      <div className="statusbar">
        <span className={`save-state ${saveState}`}>{saveState === 'saved' && <Check size={13} />} {saveLabel}</span>
        <span>{structured.questions.reduce((sum,q)=>sum+q.prompt.length+q.parts.reduce((n,p)=>n+p.text.length,0),0)} حرف · {pageCount} صفحة</span>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}

      {latexDialog && (
        <LatinMathDialog
          mode={latexDialog.mode} initial={formTarget?.language === 'latin' ? (formTarget.initial || '\\frac{a}{b}') : latexDialog.mode === 'edit' ? latexDialog.value : '\\frac{a}{b}'}
          onSubmit={submitLatex} onClose={() => { setLatexDialog(null); setFormTarget(null); }}
          onDelete={() => deleteFormula(latexDialog, () => setLatexDialog(null))}
        />
      )}
      {arabicDialog && (
        <ArabicMathDialog
          mode={arabicDialog.mode} initial={formTarget?.language === 'arabic' ? (formTarget.initial || 'س² + ٣س + ١ = ٠') : arabicDialog.mode === 'edit' ? arabicDialog.value : 'س² + ٣س + ١ = ٠'}
          onSubmit={submitArabic} onClose={() => { setArabicDialog(null); setFormTarget(null); }}
          onDelete={() => deleteFormula(arabicDialog, () => setArabicDialog(null))}
        />
      )}
      {confirm && (
        <ConfirmDialog
          message={confirm.message}
          onCancel={() => setConfirm(null)}
          onConfirm={() => { confirm.run(); setConfirm(null); }}
        />
      )}
    </div>
  );
}
