import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
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
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  FileJson,
  FileText,
  Grip,
  Heading2,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Menu,
  Minus,
  Palette,
  PanelRightOpen,
  PenTool,
  Printer,
  Redo2,
  RotateCcw,
  Save,
  Settings2,
  Sigma,
  Table2,
  Type,
  Underline as UnderlineIcon,
  Undo2,
  Upload,
  X,
} from 'lucide-react';
import {
  defaultLogo,
  defaults,
  paperPresets,
  questionTemplates,
  sampleDocument,
  STORAGE_KEY,
  THEME_OPTIONS,
} from './data';
import type { ExamMeta, LogoSettings, Project, Theme } from './data';
import {
  ArabicMathNode,
  ArabicMathPreview,
  Direction,
  FontAttributes,
  MathField,
  MathNode,
  MathPreview,
} from './MathSupport';
import { printToPDF, saveJSON } from './export';

type Ribbon = 'home' | 'insert' | 'page' | 'style';

const ribbonLabels: Record<Ribbon, string> = {
  home: 'الرئيسية',
  insert: 'إدراج',
  page: 'الصفحة',
  style: 'الثيمات',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function migrateProject(value: unknown): Partial<Project> {
  if (typeof value !== 'object' || !value) return {};
  if ('version' in value && value.version === 2) return value as Partial<Project>;
  if ('version' in value && value.version === 1) {
    const v1 = value as {
      meta?: Partial<ExamMeta>;
      theme?: Theme;
      document?: Project['document'];
    };
    return {
      version: 2,
      meta: { ...defaults, ...v1.meta },
      theme: v1.theme && THEME_OPTIONS.some(item => item.id === v1.theme) ? v1.theme : 'official',
      document: v1.document,
      logo: defaultLogo,
    };
  }
  return {};
}

function readSaved(): Partial<Project> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return migrateProject(JSON.parse(raw));
  } catch {
    return {};
  }
}

function ToolButton({ children, title, active = false, disabled = false, onClick }: {
  children: ReactNode;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      className={`tool-btn ${active ? 'active' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function SectionCard({ title, icon, children, action }: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="panel-card">
      <div className="panel-card-head">
        <h3>{icon}{title}</h3>
        {action}
      </div>
      <div className="panel-card-body">{children}</div>
    </section>
  );
}

export default function App() {
  const saved = typeof window !== 'undefined' ? readSaved() : {};
  const [meta, setMeta] = useState<ExamMeta>({ ...defaults, ...(saved.meta || {}) });
  const [theme, setTheme] = useState<Theme>(saved.theme || 'official');
  const [logo, setLogo] = useState<LogoSettings>({ ...defaultLogo, ...(saved.logo || {}) });
  const [ribbon, setRibbon] = useState<Ribbon>('home');
  const [notice, setNotice] = useState('جاهز للتحرير');
  const [panelsOpen, setPanelsOpen] = useState(false);
  const [latinDialog, setLatinDialog] = useState(false);
  const [arabicDialog, setArabicDialog] = useState(false);
  const [latex, setLatex] = useState('\\frac{a}{b}');
  const [arabicMath, setArabicMath] = useState('س² + ٣س + ١ = ٠');
  const [revision, setRevision] = useState(0);

  const importRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const dragLogoRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph', 'tableCell', 'tableHeader'] }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      MathNode,
      ArabicMathNode,
      Direction,
      FontAttributes,
    ],
    content: saved.document?.type === 'doc' ? saved.document : sampleDocument,
    editorProps: {
      attributes: {
        class: 'exam-editor',
        dir: 'rtl',
        spellcheck: 'true',
        'aria-label': 'محرّر ورقة الامتحان',
      },
    },
    onUpdate: () => setRevision(value => value + 1),
  });

  const project = useMemo<Project>(() => ({
    version: 2,
    meta,
    theme,
    logo,
    document: editor?.getJSON() || { type: 'doc', content: [] },
  }), [editor, logo, meta, theme, revision]);

  useEffect(() => {
    if (!editor) return;
    const timeout = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      } catch {
        setNotice('تعذر الحفظ التلقائي. صدّر المشروع بصيغة JSON للاحتفاظ به.');
      }
    }, 700);
    return () => window.clearTimeout(timeout);
  }, [editor, project]);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      if (!dragLogoRef.current || !headerRef.current || !logo.src) return;
      const rect = headerRef.current.getBoundingClientRect();
      const nextX = ((event.clientX - rect.left) / rect.width) * 100;
      const nextY = ((event.clientY - rect.top) / rect.height) * 100;
      setLogo(current => ({
        ...current,
        x: clamp(nextX, 6, 94),
        y: clamp(nextY, 6, 70),
      }));
    };
    const up = () => {
      if (dragLogoRef.current) setNotice('تم تحديث موضع الشعار');
      dragLogoRef.current = false;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
  }, [logo.src]);

  const updateMeta = (field: keyof ExamMeta, value: string) => {
    setMeta(previous => ({ ...previous, [field]: value }));
  };

  const insertHTML = (html: string) => {
    editor?.chain().focus().insertContent(html).run();
    setNotice('أُضيف القالب في موضع المؤشر');
  };

  const applyDirection = (dir: 'rtl' | 'ltr') => {
    if (!editor) return;
    const target = editor.isActive('heading')
      ? 'heading'
      : editor.isActive('tableCell')
        ? 'tableCell'
        : editor.isActive('tableHeader')
          ? 'tableHeader'
          : editor.isActive('listItem')
            ? 'listItem'
            : 'paragraph';
    editor.chain().focus().updateAttributes(target, { dir }).run();
    setNotice(dir === 'rtl' ? 'تم ضبط اتجاه الفقرة إلى العربية RTL' : 'Paragraph direction changed to English LTR');
  };

  const loadPreset = (presetId: string) => {
    const preset = paperPresets.find(item => item.id === presetId);
    if (!preset) return;
    setMeta(current => ({ ...current, ...preset.meta }));
    editor?.commands.setContent(preset.content);
    setNotice(`تم تحميل ${preset.label}`);
  };

  const insertLatinMath = () => {
    editor?.chain().focus().insertContent({ type: 'math', attrs: { latex } }).run();
    setLatinDialog(false);
    setNotice('تم إدراج معادلة رياضية إنكليزية');
  };

  const insertArabicEquation = () => {
    editor?.chain().focus().insertContent({ type: 'arabicMath', attrs: { value: arabicMath } }).run();
    setArabicDialog(false);
    setNotice('تم إدراج معادلة عربية');
  };

  const onImportProject = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      const imported = migrateProject(parsed);
      if (!imported.document || imported.document.type !== 'doc') throw new Error('ملف المشروع غير صالح.');
      setMeta({ ...defaults, ...(imported.meta || {}) });
      setTheme(imported.theme && THEME_OPTIONS.some(item => item.id === imported.theme) ? imported.theme : 'official');
      setLogo({ ...defaultLogo, ...(imported.logo || {}) });
      editor?.commands.setContent(imported.document);
      setNotice('تم استيراد المشروع بنجاح');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'تعذر استيراد المشروع');
    }
    event.currentTarget.value = '';
  };

  const onLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('الرجاء اختيار ملف صورة صالح للشعار');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogo({
        src: String(reader.result),
        name: file.name,
        x: 88,
        y: 12,
        width: 13,
      });
      setNotice('تم رفع الشعار ويمكنك تحريكه أو تغيير حجمه');
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = '';
  };

  const resetLogo = () => {
    setLogo(defaultLogo);
    setNotice('تم حذف الشعار');
  };

  const startLogoDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!logo.src) return;
    event.preventDefault();
    dragLogoRef.current = true;
    setNotice('حرّك الشعار داخل الهيدر');
  };

  const insertArabicPiece = (piece: string) => {
    setArabicMath(current => `${current}${piece}`);
  };

  return (
    <div className="app-shell" dir="rtl">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><BookOpen size={22} strokeWidth={1.9} /></span>
          <span>
            <strong>استوديو الامتحانات</strong>
            <small>WORD-LIKE EXAM EDITOR</small>
          </span>
        </div>
        <div className="doc-title">
          <FileText size={16} />
          <span>{meta.examTitle || 'مستند جديد'}</span>
          <span className="saved-tag"><Check size={13} /> حفظ تلقائي</span>
        </div>
        <div className="top-actions">
          <button type="button" className="top-ghost mobile-only" onClick={() => setPanelsOpen(value => !value)}>
            <PanelRightOpen size={16} /> الإعدادات
          </button>
          <button type="button" className="top-ghost" onClick={() => importRef.current?.click()}>
            <Upload size={16} /> فتح مشروع
          </button>
          <button type="button" className="top-ghost" onClick={() => { saveJSON(project); setNotice('تم حفظ المشروع بصيغة JSON'); }}>
            <Save size={16} /> حفظ مشروع
          </button>
          <button type="button" className="top-primary" onClick={() => { printToPDF(); setNotice('استخدم نافذة الطباعة لحفظ PDF'); }}>
            <Printer size={16} /> تصدير PDF
          </button>
        </div>
        <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={onImportProject} />
        <input ref={logoRef} type="file" accept="image/*" hidden onChange={onLogoUpload} />
      </header>

      <nav className="ribbon-tabs" aria-label="تبويبات الأدوات">
        {(['home', 'insert', 'page', 'style'] as const).map(key => (
          <button key={key} className={ribbon === key ? 'current' : ''} onClick={() => setRibbon(key)}>
            {ribbonLabels[key]}
          </button>
        ))}
        <span className="tabs-spacer" />
        <span className="project-version">Mobile-first · PDF only</span>
      </nav>

      <div className="ribbon-strip" role="toolbar" aria-label="أدوات التحرير">
        {ribbon === 'home' && (
          <>
            <div className="ribbon-group">
              <span className="group-caption">الحافظة</span>
              <ToolButton title="تراجع" onClick={() => editor?.chain().focus().undo().run()} disabled={!editor?.can().undo()}>
                <Undo2 size={18} />
              </ToolButton>
              <ToolButton title="إعادة" onClick={() => editor?.chain().focus().redo().run()} disabled={!editor?.can().redo()}>
                <Redo2 size={18} />
              </ToolButton>
            </div>
            <div className="ribbon-group wide">
              <span className="group-caption">الخط</span>
              <select className="tool-select" defaultValue="" aria-label="نوع الخط" onChange={event => editor?.chain().focus().setMark('textStyle', { fontFamily: event.target.value }).run()}>
                <option value="">الخط الافتراضي</option>
                <option value="'Noto Naskh Arabic', serif">Noto Naskh Arabic</option>
                <option value="'Cairo', sans-serif">Cairo</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
              </select>
              <select className="tool-select small" defaultValue="16px" aria-label="حجم الخط" onChange={event => editor?.chain().focus().setMark('textStyle', { fontSize: event.target.value }).run()}>
                {['12', '14', '16', '18', '20', '24', '28', '32'].map(size => (
                  <option key={size} value={`${size}px`}>{size}</option>
                ))}
              </select>
              <ToolButton title="عريض" active={editor?.isActive('bold')} onClick={() => editor?.chain().focus().toggleBold().run()}>
                <Bold size={18} />
              </ToolButton>
              <ToolButton title="مائل" active={editor?.isActive('italic')} onClick={() => editor?.chain().focus().toggleItalic().run()}>
                <Italic size={18} />
              </ToolButton>
              <ToolButton title="تسطير" active={editor?.isActive('underline')} onClick={() => editor?.chain().focus().toggleUnderline().run()}>
                <UnderlineIcon size={18} />
              </ToolButton>
              <label className="color-control" title="لون النص">
                <Type size={16} />
                <input type="color" aria-label="لون الخط" defaultValue="#163A70" onChange={event => editor?.chain().focus().setColor(event.target.value).run()} />
              </label>
            </div>
            <div className="ribbon-group">
              <span className="group-caption">المحاذاة</span>
              <ToolButton title="يمين" onClick={() => editor?.chain().focus().setTextAlign('right').run()}><AlignRight size={18} /></ToolButton>
              <ToolButton title="وسط" onClick={() => editor?.chain().focus().setTextAlign('center').run()}><AlignCenter size={18} /></ToolButton>
              <ToolButton title="يسار" onClick={() => editor?.chain().focus().setTextAlign('left').run()}><AlignLeft size={18} /></ToolButton>
              <ToolButton title="قائمة مرقمة" onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={18} /></ToolButton>
              <ToolButton title="قائمة نقطية" onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={18} /></ToolButton>
            </div>
            <div className="ribbon-group">
              <span className="group-caption">الاتجاه</span>
              <button type="button" className="ribbon-chip" onClick={() => applyDirection('rtl')}>عربي RTL</button>
              <button type="button" className="ribbon-chip" onClick={() => applyDirection('ltr')}>English LTR</button>
            </div>
          </>
        )}

        {ribbon === 'insert' && (
          <>
            <div className="ribbon-group">
              <span className="group-caption">العناصر</span>
              <ToolButton title="عنوان سؤال" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })}><Heading2 size={18} /></ToolButton>
              <ToolButton title="جدول" onClick={() => editor?.chain().focus().insertTable({ rows: 2, cols: 3, withHeaderRow: false }).run()}><Table2 size={18} /></ToolButton>
              <ToolButton title="فاصل" onClick={() => editor?.chain().focus().setHorizontalRule().run()}><Minus size={18} /></ToolButton>
              <button type="button" className="ribbon-template" onClick={() => setLatinDialog(true)}><Sigma size={16} /> معادلة English</button>
              <button type="button" className="ribbon-template" onClick={() => setArabicDialog(true)}><PenTool size={16} /> معادلة عربية</button>
            </div>
            <div className="ribbon-group wider">
              <span className="group-caption">قوالب الأسئلة</span>
              {questionTemplates.map(item => (
                <button key={item.id} type="button" className="ribbon-template" onClick={() => insertHTML(item.html)}>
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}

        {ribbon === 'page' && (
          <>
            <div className="ribbon-group wide">
              <span className="group-caption">الصفحة</span>
              <span className="layout-note">A4 · هوامش طباعة مريحة · مناسبة للموبايل والتابلت والحاسوب</span>
              <button type="button" className="ribbon-template" onClick={() => logoRef.current?.click()}><ImagePlus size={16} /> رفع شعار</button>
              <button type="button" className="ribbon-template" onClick={() => { printToPDF(); setNotice('استخدم نافذة المتصفح لحفظ PDF'); }}><Download size={16} /> حفظ PDF</button>
            </div>
          </>
        )}

        {ribbon === 'style' && (
          <>
            <div className="ribbon-group wider">
              <span className="group-caption">الثيمات</span>
              {THEME_OPTIONS.map(item => (
                <button key={item.id} type="button" className={`theme-ribbon ${theme === item.id ? 'theme-active' : ''}`} onClick={() => setTheme(item.id)}>
                  <span style={{ background: item.colors[0] }} />
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="workspace">
        <main className="editing-area">
          <div className="canvas-toolbar">
            <div className="canvas-breadcrumb">
              <FileText size={16} />
              <strong>معاينة الورقة</strong>
              <ChevronDown size={15} />
              <span>تحديث مباشر</span>
            </div>
            <div className="canvas-actions">
              <button type="button" onClick={() => { printToPDF(); setNotice('استخدم نافذة الطباعة لحفظ الملف PDF'); }}><Printer size={16} /> PDF</button>
              <button type="button" onClick={() => { saveJSON(project); setNotice('تم تنزيل نسخة JSON من المشروع'); }}><FileJson size={16} /> JSON</button>
            </div>
          </div>

          <div className="paper-topline">
            <span>معاينة A4 — الهاتف أولًا ثم التابلت والحاسوب</span>
            <span>{THEME_OPTIONS.find(item => item.id === theme)?.label}</span>
          </div>

          <div className="paper-scroll">
            <div className={`exam-paper theme-${theme}`}>
              <div className="paper-header" ref={headerRef}>
                {logo.src && (
                  <button
                    type="button"
                    className="paper-logo"
                    style={{ left: `${logo.x}%`, top: `${logo.y}%`, width: `${logo.width}%` }}
                    onPointerDown={startLogoDrag}
                    title="اسحب لتحريك الشعار"
                  >
                    <img src={logo.src} alt={logo.name || 'شعار'} />
                    <span><Grip size={14} /> شعار</span>
                  </button>
                )}
                <div className="header-government">
                  <strong>{meta.country}</strong>
                  <span>{meta.ministry}</span>
                  <span>{meta.directorate}</span>
                  <span>{meta.administration}</span>
                  {meta.school && <span>{meta.school}</span>}
                </div>
                <div className="header-center">
                  <h1>{meta.examTitle}</h1>
                  <strong>{meta.year}</strong>
                  <strong>({meta.examDate})</strong>
                  <span>{meta.round}</span>
                </div>
                <div className="header-details">
                  <span><b>المادة:</b> {meta.subject}</span>
                  <span><b>الصف:</b> {meta.grade}</span>
                  <span><b>الوقت:</b> {meta.duration}</span>
                </div>
              </div>

              <div className="exam-note">{meta.note}</div>
              <div className="name-line"><b>اسم الطالب/ة:</b><span className="dotted-line" /></div>
              <EditorContent editor={editor} />
              <footer className="paper-footer">
                <span>{meta.teacher ? `مدرس المادة: ${meta.teacher}` : 'مدرس المادة: ........................'}</span>
                <span>مع تمنياتنا لكم بالتوفيق والنجاح</span>
              </footer>
            </div>
          </div>
        </main>

        <aside className={`inspector ${panelsOpen ? 'open' : ''}`}>
          <SectionCard
            title="نماذج الامتحانات"
            icon={<Menu size={18} />}
            action={<button type="button" className="icon-ghost" onClick={() => setPanelsOpen(false)}><X size={16} /></button>}
          >
            <p className="panel-help">اعتمدت هذه القوالب على نمط الأوراق العراقية الشائع في الابتدائي والمتوسط والإعدادي، مع مرونة للتعديل بعد التحميل.</p>
            <div className="preset-list">
              {paperPresets.map(item => (
                <button key={item.id} type="button" className="preset-card" onClick={() => loadPreset(item.id)}>
                  <strong>{item.label}</strong>
                  <small>{item.summary}</small>
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="قوالب سريعة" icon={<FileText size={18} />}>
            <div className="template-list">
              {questionTemplates.map(item => (
                <button key={item.id} type="button" className="template-card" onClick={() => insertHTML(item.html)}>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.desc}</small>
                  </span>
                  <ChevronDown size={14} />
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="بيانات الامتحان" icon={<Settings2 size={18} />}>
            <div className="fields-grid">
              {([
                ['country', 'الدولة'],
                ['ministry', 'الوزارة'],
                ['directorate', 'المديرية'],
                ['administration', 'الإدارة / المدرسة'],
                ['school', 'اسم المدرسة (اختياري)'],
                ['examTitle', 'عنوان الامتحان'],
                ['grade', 'الصف / المرحلة'],
                ['subject', 'المادة'],
                ['year', 'السنة / الترويسة الوسطية'],
                ['examDate', 'العام الدراسي'],
                ['round', 'الدور'],
                ['duration', 'الوقت'],
                ['teacher', 'اسم المدرس'],
              ] as [keyof ExamMeta, string][]).map(([key, label]) => (
                <label key={key}>
                  <span>{label}</span>
                  <input value={meta[key]} onChange={event => updateMeta(key, event.target.value)} placeholder={label} />
                </label>
              ))}
              <label className="full-span">
                <span>ملاحظة الامتحان</span>
                <textarea value={meta.note} onChange={event => updateMeta('note', event.target.value)} rows={3} />
              </label>
            </div>
          </SectionCard>

          <SectionCard title="الشعار والهيدر" icon={<ImagePlus size={18} />}>
            <p className="panel-help">ارفع الشعار وسيتم إدراجه تلقائيًا داخل الهيدر. يمكنك بعد ذلك سحبه داخل المعاينة أو تعديل موقعه من الشرائط التالية.</p>
            <div className="logo-actions">
              <button type="button" className="ribbon-template" onClick={() => logoRef.current?.click()}><Upload size={15} /> رفع شعار</button>
              <button type="button" className="ribbon-template" onClick={() => setLogo(current => ({ ...current, x: 88, y: 12, width: 13 }))}><RotateCcw size={15} /> إعادة الضبط</button>
              <button type="button" className="ribbon-template danger" onClick={resetLogo}><X size={15} /> حذف</button>
            </div>
            {logo.src ? (
              <div className="slider-group">
                <label>
                  <span>الموضع الأفقي</span>
                  <input type="range" min="6" max="94" value={logo.x} onChange={event => setLogo(current => ({ ...current, x: Number(event.target.value) }))} />
                </label>
                <label>
                  <span>الموضع العمودي</span>
                  <input type="range" min="6" max="70" value={logo.y} onChange={event => setLogo(current => ({ ...current, y: Number(event.target.value) }))} />
                </label>
                <label>
                  <span>الحجم</span>
                  <input type="range" min="6" max="28" value={logo.width} onChange={event => setLogo(current => ({ ...current, width: Number(event.target.value) }))} />
                </label>
                <small className="panel-help">يمكنك أيضًا سحب الشعار مباشرة من المعاينة بالأعلى.</small>
              </div>
            ) : <small className="panel-help">لا يوجد شعار مرفوع حاليًا.</small>}
          </SectionCard>

          <SectionCard title="الثيمات المدروسة" icon={<Palette size={18} />}>
            <div className="theme-grid">
              {THEME_OPTIONS.map(item => (
                <button key={item.id} type="button" className={`theme-tile ${theme === item.id ? 'chosen' : ''}`} onClick={() => setTheme(item.id)}>
                  <span className="swatch" style={{ background: `linear-gradient(135deg, ${item.colors[0]} 0 22%, ${item.colors[1]} 22% 100%)` }} />
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </button>
              ))}
            </div>
          </SectionCard>
        </aside>
      </div>

      <div className="statusbar">
        <span aria-live="polite">{notice}</span>
        <span><Check size={13} /> حفظ محلي تلقائي</span>
        <span>{editor?.getText().length || 0} حرف</span>
      </div>

      {latinDialog && (
        <div className="dialog-shade" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setLatinDialog(false); }}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="latin-math-title">
            <div className="dialog-header">
              <h2 id="latin-math-title"><Sigma size={22} /> إدراج معادلة إنكليزية</h2>
              <button type="button" title="إغلاق" onClick={() => setLatinDialog(false)}><X size={18} /></button>
            </div>
            <p>استخدم لوحة MathLive للمعادلات القياسية كما في الرياضيات والفيزياء والكيمياء.</p>
            <MathField value={latex} onChange={setLatex} />
            <label className="latex-label">
              LaTeX
              <input dir="ltr" value={latex} onChange={event => setLatex(event.target.value)} spellCheck={false} />
            </label>
            <div className="math-sample"><span>معاينة:</span><MathPreview latex={latex} displayMode /></div>
            <div className="quick-math">
              {['\\frac{a}{b}', '\\sqrt{x^2+1}', '\\int_0^1 x^2\\,dx', '\\sin 30^\\circ = \\frac{1}{2}'].map(example => (
                <button key={example} type="button" onClick={() => setLatex(example)}><MathPreview latex={example} /></button>
              ))}
            </div>
            <div className="dialog-actions">
              <button type="button" onClick={() => setLatinDialog(false)}>إلغاء</button>
              <button type="button" className="primary-action" onClick={insertLatinMath}><Sigma size={16} /> إدراج المعادلة</button>
            </div>
          </div>
        </div>
      )}

      {arabicDialog && (
        <div className="dialog-shade" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setArabicDialog(false); }}>
          <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="arabic-math-title">
            <div className="dialog-header">
              <h2 id="arabic-math-title"><PenTool size={22} /> إدراج معادلة عربية</h2>
              <button type="button" title="إغلاق" onClick={() => setArabicDialog(false)}><X size={18} /></button>
            </div>
            <p>هذا النمط مخصص للمعادلات والعبارات الرياضية المكتوبة بالعربية بصورة منفصلة عن معادلات LaTeX الإنكليزية.</p>
            <textarea
              dir="rtl"
              className="arabic-math-editor big"
              value={arabicMath}
              onChange={event => setArabicMath(event.target.value)}
              rows={4}
              spellCheck={false}
            />
            <div className="arabic-chips">
              {['س', 'ص', 'ع', '²', '³', '√', '≤', '≥', '±', 'π', 'جا', 'جتا', 'ظا', '∆', '→', '='].map(piece => (
                <button key={piece} type="button" onClick={() => insertArabicPiece(piece)}>{piece}</button>
              ))}
            </div>
            <div className="math-sample"><span>معاينة:</span><ArabicMathPreview value={arabicMath} /></div>
            <div className="dialog-actions">
              <button type="button" onClick={() => setArabicDialog(false)}>إلغاء</button>
              <button type="button" className="primary-action" onClick={insertArabicEquation}><PenTool size={16} /> إدراج المعادلة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
