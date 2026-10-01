import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
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
  AlignCenter, AlignLeft, AlignRight, Bold, BookOpen, Check, ChevronDown, Download,
  FileDown, FileJson, FileText, Film, Heading2, Image as ImageIcon, Italic,
  LayoutTemplate, List, ListOrdered, Menu, Minus, Plus, Printer, Redo2, Save,
  Settings2, Sigma, Table2, Type, Underline as UnderlineIcon, Undo2, Upload, X,
} from 'lucide-react';
import { defaults, samples, STORAGE_KEY, templates, THEME_OPTIONS } from './data';
import type { Aspect, ExamMeta, Format, Project, Theme } from './data';
import { Direction, FontAttributes, MathField, MathNode, MathPreview } from './MathSupport';
import { exportPNG, exportVideo, saveJSON } from './export';

type Ribbon = 'home' | 'insert' | 'layout' | 'themes';
const label: Record<Ribbon, string> = { home: 'الرئيسية', insert: 'إدراج', layout: 'تخطيط', themes: 'التصاميم' };
function readSaved(): Partial<Project> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || !value || !('version' in value) || value.version !== 1) return {};
    return value as Partial<Project>;
  } catch { return {}; }
}
const saved = typeof window !== 'undefined' ? readSaved() : {};

function Tool({ children, title, onClick, active = false, disabled = false }: {
  children: ReactNode; title: string; onClick: () => void; active?: boolean; disabled?: boolean;
}) {
  return <button type="button" title={title} aria-label={title} aria-pressed={active} disabled={disabled}
    className={`tool-btn ${active ? 'active' : ''}`} onClick={onClick}>{children}</button>;
}
function Divider() { return <span className="ribbon-divider" aria-hidden="true" />; }

export default function App() {
  const [meta, setMeta] = useState<ExamMeta>({ ...defaults, ...(saved.meta || {}) });
  const [theme, setTheme] = useState<Theme>(saved.theme || 'official');
  const [format, setFormat] = useState<Format>(saved.format || 'image');
  const [aspect, setAspect] = useState<Aspect>(saved.aspect || 'portrait');
  const [ribbon, setRibbon] = useState<Ribbon>('home');
  const [sidebar, setSidebar] = useState<'templates' | 'settings'>('templates');
  const [asideOpen, setAsideOpen] = useState(true);
  const [mathDialog, setMathDialog] = useState(false);
  const [latex, setLatex] = useState('\\frac{a}{b}');
  const [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState<'image' | 'video' | null>(null);
  const [notice, setNotice] = useState('جاهز للتحرير');
  const paperRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }), Underline, TextStyle,
      Color, TextAlign.configure({ types: ['heading', 'paragraph', 'tableCell'] }),
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
      MathNode, Direction, FontAttributes,
    ],
    content: saved.document?.type === 'doc' ? saved.document : samples,
    editorProps: { attributes: { class: 'exam-editor', dir: 'rtl', spellcheck: 'true', 'aria-label': 'محرّر ورقة الامتحان' } },
    onUpdate: () => setRevision(value => value + 1),
  });

  useEffect(() => {
    if (!editor) return;
    const timeout = window.setTimeout(() => {
      try {
        const project: Project = { version: 1, meta, theme, format, aspect, document: editor.getJSON() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      } catch { setNotice('المساحة المحلية ممتلئة. صدّر ملف JSON للاحتفاظ بالعمل.'); }
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [editor, revision, meta, theme, format, aspect]);

  const updateMeta = (field: keyof ExamMeta, value: string) => setMeta(previous => ({ ...previous, [field]: value }));
  const project = (): Project => ({ version: 1, meta, theme, format, aspect, document: editor?.getJSON() || { type: 'doc', content: [] } });
  const insertHTML = (html: string) => { editor?.chain().focus().insertContent(html).run(); setNotice('أُضيف القالب في موضع المؤشر'); };
  const setDir = (direction: 'rtl' | 'ltr') => {
    if (!editor) return;
    const node = editor.isActive('heading') ? 'heading' : editor.isActive('tableCell') ? 'tableCell' : 'paragraph';
    editor.chain().focus().updateAttributes(node, { dir: direction }).run();
    setNotice(direction === 'rtl' ? 'اتجاه الفقرة: من اليمين لليسار' : 'Paragraph direction: left to right');
  };
  const runExport = async (kind: 'image' | 'video') => {
    if (!paperRef.current || busy) return;
    setBusy(kind); setNotice(kind === 'image' ? 'جارٍ تجهيز الصورة بدقة الطباعة…' : 'جارٍ تسجيل فيديو مدته 8 ثوانٍ…');
    try {
      if (kind === 'image') await exportPNG(paperRef.current);
      else await exportVideo(paperRef.current, meta, aspect);
      setNotice('اكتمل التصدير بنجاح');
    } catch (err) { setNotice(err instanceof Error ? err.message : 'فشل التصدير. أعد المحاولة.'); }
    finally { setBusy(null); }
  };
  const onImport = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('الملف أكبر من الحد المسموح (2 MB).');
      const imported: unknown = JSON.parse(await file.text());
      if (typeof imported !== 'object' || !imported || !('version' in imported) || imported.version !== 1 || !('document' in imported)
        || !imported.document || typeof imported.document !== 'object' || !('type' in imported.document) || imported.document.type !== 'doc')
        throw new Error('ملف المشروع غير صالح.');
      const data = imported as Project;
      setMeta({ ...defaults, ...data.meta });
      setTheme(THEME_OPTIONS.some(t => t.id === data.theme) ? data.theme : 'official');
      setFormat(data.format === 'video' ? 'video' : 'image');
      setAspect(data.aspect === 'landscape' ? 'landscape' : 'portrait');
      editor?.commands.setContent(data.document);
      setNotice('استُورد المشروع بنجاح');
    } catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر استيراد الملف.'); }
    event.currentTarget.value = '';
  };

  return <div className="app-shell" dir="rtl">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><BookOpen size={23} strokeWidth={1.9}/></span><span><strong>استوديو الامتحانات</strong><small>EXAMINATION STUDIO</small></span></div>
      <div className="doc-title"><FileText size={17}/><span>{meta.examTitle || 'امتحان جديد'}</span><span className="saved"><Check size={13}/> حفظ تلقائي</span></div>
      <div className="top-actions">
        <button className="top-ghost" onClick={() => fileRef.current?.click()}><Upload size={16}/> فتح مشروع</button>
        <button className="top-ghost" onClick={() => { saveJSON(project()); setNotice('تم حفظ ملف المشروع'); }}><Save size={16}/> حفظ مشروع</button>
        <button className="top-primary" onClick={() => window.print()}><Printer size={16}/> طباعة / PDF</button>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport}/>
    </header>

    <nav className="ribbon-tabs" aria-label="قائمة أدوات التحرير">
      {(['home', 'insert', 'layout', 'themes'] as const).map(key => <button key={key} className={ribbon === key ? 'current' : ''} onClick={() => setRibbon(key)}>{label[key]}</button>)}
      <span className="tabs-spacer"/><span className="project-version">النسخة التجريبية 0.1</span>
    </nav>
    <div className="ribbon-content" role="toolbar" aria-label="أدوات المستند">
      {ribbon === 'home' && <>
        <div className="ribbon-group"><span className="group-caption">الحافظة</span>
          <Tool title="تراجع" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}><Undo2 size={18}/></Tool>
          <Tool title="إعادة" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}><Redo2 size={18}/></Tool>
        </div><Divider/>
        <div className="ribbon-group wide"><span className="group-caption">الخط</span>
          <select className="tool-select font-select" aria-label="نوع الخط" defaultValue="" onChange={e => editor?.chain().focus().setMark('textStyle', { fontFamily: e.target.value }).run()}>
            <option value="">الخط الافتراضي</option><option value="'Noto Naskh Arabic',serif">Noto Naskh Arabic</option><option value="'Cairo',sans-serif">Cairo</option><option value="Arial,sans-serif">Arial</option><option value="'Times New Roman',serif">Times New Roman</option>
          </select>
          <select className="tool-select size-select" aria-label="حجم الخط" defaultValue="16px" onChange={e => editor?.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run()}>
            {['12','14','16','18','20','24','28','32'].map(n => <option key={n} value={`${n}px`}>{n}</option>)}
          </select>
          <Tool title="عريض" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={18}/></Tool>
          <Tool title="مائل" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={18}/></Tool>
          <Tool title="تسطير" active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()}><UnderlineIcon size={18}/></Tool>
          <label className="color-control" title="لون النص"><Type size={16}/><input aria-label="لون الخط" type="color" defaultValue="#223c68" onChange={e => editor?.chain().focus().setColor(e.target.value).run()}/></label>
        </div><Divider/>
        <div className="ribbon-group"><span className="group-caption">الفقرة</span>
          <Tool title="محاذاة لليمين" onClick={() => editor?.chain().focus().setTextAlign('right').run()}><AlignRight size={18}/></Tool>
          <Tool title="توسيط" onClick={() => editor?.chain().focus().setTextAlign('center').run()}><AlignCenter size={18}/></Tool>
          <Tool title="محاذاة لليسار" onClick={() => editor?.chain().focus().setTextAlign('left').run()}><AlignLeft size={18}/></Tool>
          <Tool title="قائمة مرقمة" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={18}/></Tool>
          <Tool title="قائمة نقطية" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={18}/></Tool>
          <Tool title="اتجاه عربي RTL" onClick={() => setDir('rtl')}><span className="dir-symbol">ع ←</span></Tool>
          <Tool title="English LTR" onClick={() => setDir('ltr')}><span className="dir-symbol">A →</span></Tool>
        </div><Divider/>
        <div className="ribbon-group"><span className="group-caption">العناوين</span>
          <Tool title="عنوان سؤال" onClick={() => editor?.chain().focus().toggleHeading({level: 2}).run()} active={editor?.isActive('heading',{level:2})}><Heading2 size={19}/></Tool>
          <Tool title="فقرة عادية" onClick={() => editor?.chain().focus().setParagraph().run()}><Type size={18}/></Tool>
        </div>
      </>}
      {ribbon === 'insert' && <>
        <div className="ribbon-group"><span className="group-caption">عناصر الامتحان</span>
          <Tool title="إدراج معادلة رياضية" onClick={() => setMathDialog(true)}><Sigma size={22}/></Tool>
          <Tool title="إدراج جدول 3 × 2" onClick={() => editor?.chain().focus().insertTable({rows:2,cols:3,withHeaderRow:false}).run()}><Table2 size={20}/></Tool>
          <Tool title="إدراج فاصل" onClick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus size={20}/></Tool>
        </div><Divider/>
        <div className="ribbon-group"><span className="group-caption">قوالب جاهزة</span>
          {templates.map(item => <button key={item.id} className="ribbon-template" onClick={() => insertHTML(item.html)}><Plus size={15}/>{item.label}</button>)}
        </div>
      </>}
      {ribbon === 'layout' && <>
        <div className="ribbon-group"><span className="group-caption">الورقة</span><span className="layout-info">A4 · 210 × 297 ملم</span><span className="layout-info">هامش 12 ملم</span></div><Divider/>
        <div className="ribbon-group"><span className="group-caption">التحرير</span><button className="ribbon-template" onClick={() => setSidebar('settings')}><Settings2 size={17}/> معلومات الامتحان</button></div>
        <div className="ribbon-group"><span className="group-caption">الصادرات</span><button className="ribbon-template" onClick={() => window.print()}><FileDown size={17}/> طباعة PDF</button></div>
      </>}
      {ribbon === 'themes' && <>
        <div className="ribbon-group"><span className="group-caption">ثيم الورقة</span>
          {THEME_OPTIONS.map(item => <button key={item.id} className={`theme-ribbon ${theme === item.id ? 'theme-active' : ''}`} onClick={() => setTheme(item.id)}><span style={{background: item.colors[0]}}/>{item.label}</button>)}
        </div><Divider/>
        <div className="ribbon-group"><span className="group-caption">نوع الإخراج</span><button className={`ribbon-template ${format === 'image' ? 'selected' : ''}`} onClick={() => setFormat('image')}><ImageIcon size={17}/> ثيم صورة</button><button className={`ribbon-template ${format === 'video' ? 'selected' : ''}`} onClick={() => setFormat('video')}><Film size={17}/> ثيم فيديو</button></div>
      </>}
    </div>

    <div className="workspace">
      <aside className={`right-sidebar ${asideOpen ? '' : 'collapsed'}`}>
        <div className="side-head"><h3><LayoutTemplate size={18}/> لوحة الأدوات</h3><button title="طي اللوحة" onClick={() => setAsideOpen(!asideOpen)}>{asideOpen ? <X size={17}/> : <Menu size={17}/>}</button></div>
        {asideOpen && <><div className="side-segments"><button className={sidebar==='templates'?'selected':''} onClick={() => setSidebar('templates')}>قوالب الأسئلة</button><button className={sidebar==='settings'?'selected':''} onClick={() => setSidebar('settings')}>بيانات الامتحان</button></div>
        {sidebar === 'templates' ? <div className="side-body"><p className="side-lead">ضع المؤشر في الورقة، ثم اختر نوع السؤال لإدراجه.</p>
          {templates.map(item => <button className="template-card" key={item.id} onClick={() => insertHTML(item.html)}><span className="template-icon"><FileText size={20}/></span><span><strong>{item.label}</strong><small>{item.desc}</small></span><Plus size={16}/></button>)}
          <div className="tip"><Sigma size={17}/><span>المعادلات قابلة للتعديل بالنقر المزدوج. يمكن استعمال العربية والإنكليزية في الورقة نفسها.</span></div>
        </div> : <div className="side-body settings-form">
          {([
            ['country','الدولة'],['ministry','الوزارة'],['directorate','المديرية'],['examTitle','عنوان الامتحان'],['grade','المرحلة / الصف'],['subject','المادة'],['examDate','السنة الدراسية'],['school','المدرسة'],['duration','الوقت'],['teacher','اسم الأستاذ'],
          ] as [keyof ExamMeta,string][]).map(([key,name]) => <label key={key}>{name}<input value={meta[key]} onChange={e => updateMeta(key,e.target.value)} placeholder={name}/></label>)}
        </div>}</>}
      </aside>

      <main className="editing-area">
        <div className="canvas-toolbar"><div className="canvas-breadcrumb"><FileText size={16}/><strong>مستند الامتحان</strong><ChevronDown size={15}/><span>معاينة مباشرة</span></div><div className="canvas-modes">
          <button className={format === 'image' ? 'selected' : ''} onClick={() => setFormat('image')}><ImageIcon size={16}/> صورة / طباعة</button>
          <button className={format === 'video' ? 'selected' : ''} onClick={() => setFormat('video')}><Film size={16}/> فيديو</button>
        </div></div>
        {format === 'video' && <div className="video-stage"><div className={`video-demo ${aspect}`}>
          <div className="video-aura"/><span className="video-overline">EXAMINATION STUDIO</span><h2>{meta.examTitle}</h2><p>{meta.subject} — {meta.grade}</p>
          <div className="video-paper-mini"><div className="mini-line long"/><div className="mini-line"/><div className="mini-title"/><div className="mini-line"/><div className="mini-line long"/><div className="mini-title"/><div className="mini-line"/></div>
          <span className="video-footer">معاينة الحركة المستمرة · المقطع النهائي 8 ثوانٍ</span>
        </div><div className="video-stage-actions"><h3>استوديو الفيديو</h3><p>خلفية متدرجة وحركة هادئة مستمرة، مع إدراج ورقة الامتحان الفعلية عند التصدير.</p><div className="aspect-row"><button className={aspect==='portrait'?'active':''} onClick={()=>setAspect('portrait')}>عمودي 9:16</button><button className={aspect==='landscape'?'active':''} onClick={()=>setAspect('landscape')}>أفقي 16:9</button></div><button className="primary-action" disabled={!!busy} onClick={() => void runExport('video')}><Film size={17}/>{busy==='video'?'جارٍ إنتاج الفيديو…':'تصدير فيديو WebM'}</button><small>التصدير يحتاج متصفحًا يدعم MediaRecorder؛ لا يحتاج إلى خادم مدفوع.</small></div></div>}
        <div className="paper-topline"><span>{format === 'video' ? 'المستند المستخدم في الفيديو — قابل للتعديل' : 'ورقة A4 — اضغط على النص للتعديل'}</span><span>210 × 297 mm</span></div>
        <div className="paper-scroll"><div ref={paperRef} className={`exam-paper theme-${theme}`}>
          <div className="paper-header"><div className="header-government"><strong>{meta.country}</strong><span>{meta.ministry}</span><span>{meta.directorate}</span></div>
            <div className="header-center"><h1>{meta.examTitle}</h1><strong>{meta.grade}</strong>{meta.school && <span>{meta.school}</span>}</div>
            <div className="header-details"><span><b>المادة:</b> {meta.subject}</span><span><b>السنة:</b> {meta.examDate}</span><span><b>الوقت:</b> {meta.duration}</span></div></div>
          <div className="name-line"><b>اسم الطالب/ة:</b><span className="dotted-line"/></div>
          <EditorContent editor={editor}/>
          <footer className="paper-footer"><span>مع تمنياتنا لكم بالنجاح والتوفيق</span><span>معلم المادة: {meta.teacher || '........................'}</span></footer>
        </div></div>
      </main>

      <aside className="left-sidebar"><div className="side-head"><h3><Settings2 size={18}/> التصميم والتصدير</h3></div>
        <div className="side-body"><h4>نوع التصميم</h4><div className="output-types"><button className={format==='image'?'active':''} onClick={()=>setFormat('image')}><ImageIcon size={22}/><b>صورة</b><small>A4 / PNG / PDF</small></button><button className={format==='video'?'active':''} onClick={()=>setFormat('video')}><Film size={22}/><b>فيديو</b><small>WebM / متحرك</small></button></div>
          <h4>ثيمات الورقة</h4><div className="theme-grid">{THEME_OPTIONS.map(item => <button key={item.id} className={`theme-tile ${theme===item.id?'chosen':''}`} onClick={()=>setTheme(item.id)}><span className="swatch" style={{ background: `linear-gradient(150deg,${item.colors[0]} 0 27%,${item.colors[1]} 27% 100%)` }}/><small>{item.label}</small>{theme===item.id&&<Check size={14}/>}</button>)}</div>
          <h4>التصدير</h4><div className="export-list"><button disabled={!!busy} onClick={()=>void runExport('image')}><Download size={17}/><span><strong>تنزيل PNG</strong><small>بدقة تقريبية 300 DPI</small></span></button><button onClick={()=>window.print()}><Printer size={17}/><span><strong>طباعة / حفظ PDF</strong><small>بحجم ورق A4</small></span></button><button disabled={!!busy} onClick={()=>void runExport('video')}><Film size={17}/><span><strong>تنزيل الفيديو</strong><small>8 ثوانٍ — WebM</small></span></button><button onClick={()=>saveJSON(project())}><FileJson size={17}/><span><strong>ملف قابل للتحرير</strong><small>JSON وإعادة الاستيراد</small></span></button></div>
          <div className="save-note"><Check size={16}/><span>يحفظ البرنامج عملك تلقائيًا على هذا الجهاز.</span></div>
        </div>
      </aside>
    </div>
    <div className="statusbar"><span aria-live="polite">{notice}</span><span><Check size={13}/> حفظ محلي تلقائي</span><span>{editor?.storage.characterCount?.characters?.() || editor?.getText().length || 0} حرف</span></div>
    {mathDialog && <div className="dialog-shade" role="presentation" onMouseDown={e => {if(e.target===e.currentTarget) setMathDialog(false);}}><div className="dialog" role="dialog" aria-modal="true" aria-labelledby="math-title">
      <div className="dialog-header"><h2 id="math-title"><Sigma size={23}/> إدراج معادلة رياضية</h2><button title="إغلاق" onClick={()=>setMathDialog(false)}><X size={19}/></button></div>
      <p>اكتب المعادلة باستخدام لوحة المفاتيح الرياضية، أو ألصق كود LaTeX.</p><MathField value={latex} onChange={setLatex}/>
      <label className="latex-label">LaTeX<input dir="ltr" value={latex} onChange={e=>setLatex(e.target.value)} spellCheck={false}/></label>
      <div className="math-sample"><span>معاينة:</span><MathPreview latex={latex} displayMode/></div>
      <div className="quick-math">{['\\frac{a}{b}','\\sqrt{x^2+1}','\\int_0^1 x^2\\,dx','\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}'].map(example=><button key={example} onClick={()=>setLatex(example)}><MathPreview latex={example}/></button>)}</div>
      <div className="dialog-actions"><button onClick={()=>setMathDialog(false)}>إلغاء</button><button className="primary-action" onClick={()=>{editor?.chain().focus().insertContent({type:'math',attrs:{latex}}).run();setMathDialog(false);setNotice('أُدرجت المعادلة — انقر عليها مرتين لتعديلها');}}><Plus size={17}/> إدراج المعادلة</button></div>
    </div></div>}
  </div>;
}