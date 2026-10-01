import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, PointerEvent as ReactPointerEvent } from 'react';
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
  AlignCenter, AlignLeft, AlignRight, Bold, BookOpen, Check, ChevronDown, FileJson, FileText,
  Grip, Heading2, ImagePlus, Italic, List, ListOrdered, Menu, Minus, Palette, PanelRightOpen,
  PenTool, Printer, Redo2, RotateCcw, Save, Settings2, Sigma, Table2, Type,
  Underline as UnderlineIcon, Undo2, Upload, X,
} from 'lucide-react';
import {
  defaultLogo, defaults, paperPresets, questionTemplates, sampleDocument, STORAGE_KEY, THEME_OPTIONS,
} from './data';
import type { ExamMeta, LogoSettings, Project, Theme } from './data';
import { ArabicMathNode, ArabicMathPreview, Direction, FontAttributes, MathField, MathNode, MathPreview } from './MathSupport';
import { printToPDF, saveJSON } from './export';

type Ribbon = 'home' | 'insert' | 'page' | 'style';
const ribbonLabels: Record<Ribbon, string> = { home:'الرئيسية', insert:'إدراج', page:'الصفحة', style:'الثيمات' };
const clamp=(v:number,min:number,max:number)=>Math.min(max,Math.max(min,v));

function migrateProject(value: unknown): Partial<Project> {
  if (typeof value !== 'object' || !value) return {};
  const v=value as Partial<Project> & {version?:number};
  if(v.version===2) return v;
  return {};
}
function readSaved(): Partial<Project> {
  try { const raw=localStorage.getItem(STORAGE_KEY); return raw?migrateProject(JSON.parse(raw)):{}; } catch { return {}; }
}
function Tool({title,onClick,active=false,children}:{title:string;onClick:()=>void;active?:boolean;children:React.ReactNode}) {
  return <button type="button" className={`tool-btn ${active?'active':''}`} title={title} aria-label={title} onClick={onClick}>{children}</button>;
}

export default function App(){
  const saved=typeof window!=='undefined'?readSaved():{};
  const [meta,setMeta]=useState<ExamMeta>({...defaults,...(saved.meta||{})});
  const [theme,setTheme]=useState<Theme>(saved.theme||'official');
  const [logo,setLogo]=useState<LogoSettings>({...defaultLogo,...(saved.logo||{})});
  const [ribbon,setRibbon]=useState<Ribbon>('home');
  const [notice,setNotice]=useState('جاهز للتحرير');
  const [panelsOpen,setPanelsOpen]=useState(false);
  const [latinDialog,setLatinDialog]=useState(false);
  const [arabicDialog,setArabicDialog]=useState(false);
  const [latex,setLatex]=useState('\\frac{a}{b}');
  const [arabicMath,setArabicMath]=useState('س² + ٣س + ١ = ٠');
  const [revision,setRevision]=useState(0);
  const importRef=useRef<HTMLInputElement>(null);
  const logoRef=useRef<HTMLInputElement>(null);
  const headerRef=useRef<HTMLDivElement>(null);
  const dragging=useRef(false);

  const editor=useEditor({
    extensions:[
      StarterKit.configure({heading:{levels:[1,2,3]}}), Underline, TextStyle, Color,
      TextAlign.configure({types:['heading','paragraph','tableCell','tableHeader']}),
      Table.configure({resizable:true}), TableRow, TableCell, TableHeader,
      MathNode, ArabicMathNode, Direction, FontAttributes,
    ],
    content:saved.document?.type==='doc'?saved.document:sampleDocument,
    editorProps:{attributes:{class:'exam-editor',dir:'rtl',spellcheck:'true','aria-label':'محرّر ورقة الامتحان'}},
    onUpdate:()=>setRevision(v=>v+1),
  });

  const project=useMemo<Project>(()=>({
    version:2,meta,theme,logo,document:editor?.getJSON()||{type:'doc',content:[]},
  }),[editor,meta,theme,logo,revision]);

  useEffect(()=>{
    if(!editor)return;
    const id=window.setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(project));}catch{setNotice('تعذر الحفظ التلقائي');}},600);
    return()=>window.clearTimeout(id);
  },[editor,project]);

  useEffect(()=>{
    const move=(e:PointerEvent)=>{
      if(!dragging.current||!headerRef.current||!logo.src)return;
      const rect=headerRef.current.getBoundingClientRect();
      setLogo(v=>({...v,x:clamp(((e.clientX-rect.left)/rect.width)*100,6,94),y:clamp(((e.clientY-rect.top)/rect.height)*100,6,70)}));
    };
    const up=()=>{dragging.current=false;};
    window.addEventListener('pointermove',move); window.addEventListener('pointerup',up);
    return()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);};
  },[logo.src]);

  const updateMeta=(key:keyof ExamMeta,value:string)=>setMeta(v=>({...v,[key]:value}));
  const insertHTML=(html:string)=>{editor?.chain().focus().insertContent(html).run();setNotice('تم إدراج القالب');};
  const applyDirection=(dir:'rtl'|'ltr')=>{
    if(!editor)return;
    const target=editor.isActive('heading')?'heading':editor.isActive('listItem')?'listItem':'paragraph';
    editor.chain().focus().updateAttributes(target,{dir}).run();
  };
  const loadPreset=(id:string)=>{
    const p=paperPresets.find(x=>x.id===id); if(!p)return;
    setMeta(v=>({...v,...p.meta})); editor?.commands.setContent(p.content); setNotice(`تم تحميل ${p.label}`);
  };
  const onLogoUpload=(e:ChangeEvent<HTMLInputElement>)=>{
    const file=e.currentTarget.files?.[0]; if(!file||!file.type.startsWith('image/'))return;
    const reader=new FileReader();
    reader.onload=()=>setLogo({src:String(reader.result),name:file.name,x:88,y:12,width:13});
    reader.readAsDataURL(file); e.currentTarget.value='';
  };
  const onImport=async(e:ChangeEvent<HTMLInputElement>)=>{
    const file=e.currentTarget.files?.[0]; if(!file)return;
    try{
      const p=migrateProject(JSON.parse(await file.text()));
      if(!p.document||p.document.type!=='doc')throw new Error('ملف غير صالح');
      setMeta({...defaults,...(p.meta||{})}); setTheme(p.theme||'official'); setLogo({...defaultLogo,...(p.logo||{})});
      editor?.commands.setContent(p.document); setNotice('تم استيراد المشروع');
    }catch{setNotice('تعذر استيراد المشروع');}
    e.currentTarget.value='';
  };
  const startDrag=(e:ReactPointerEvent<HTMLButtonElement>)=>{e.preventDefault();dragging.current=true;};

  return <div className="app-shell" dir="rtl">
    <header className="topbar">
      <div className="brand"><span className="brand-mark"><BookOpen size={22}/></span><span><strong>استوديو الامتحانات</strong><small>WORD-LIKE EXAM EDITOR</small></span></div>
      <div className="doc-title"><FileText size={16}/><span>{meta.examTitle}</span><span className="saved-tag"><Check size={13}/> حفظ تلقائي</span></div>
      <div className="top-actions">
        <button className="top-ghost mobile-only" onClick={()=>setPanelsOpen(v=>!v)}><PanelRightOpen size={16}/> الإعدادات</button>
        <button className="top-ghost" onClick={()=>importRef.current?.click()}><Upload size={16}/> فتح مشروع</button>
        <button className="top-ghost" onClick={()=>saveJSON(project)}><Save size={16}/> حفظ مشروع</button>
        <button className="top-primary" onClick={printToPDF}><Printer size={16}/> تصدير PDF</button>
      </div>
      <input ref={importRef} type="file" accept=".json,application/json" hidden onChange={onImport}/>
      <input ref={logoRef} type="file" accept="image/*" hidden onChange={onLogoUpload}/>
    </header>

    <nav className="ribbon-tabs">
      {(Object.keys(ribbonLabels) as Ribbon[]).map(k=><button key={k} className={ribbon===k?'current':''} onClick={()=>setRibbon(k)}>{ribbonLabels[k]}</button>)}
      <span className="tabs-spacer"/><span className="project-version">Mobile-first · PDF only</span>
    </nav>

    <div className="ribbon-strip">
      {ribbon==='home'&&<>
        <div className="ribbon-group"><span className="group-caption">تحرير</span>
          <Tool title="تراجع" onClick={()=>editor?.chain().focus().undo().run()}><Undo2 size={18}/></Tool>
          <Tool title="إعادة" onClick={()=>editor?.chain().focus().redo().run()}><Redo2 size={18}/></Tool>
          <Tool title="عريض" active={editor?.isActive('bold')} onClick={()=>editor?.chain().focus().toggleBold().run()}><Bold size={18}/></Tool>
          <Tool title="مائل" active={editor?.isActive('italic')} onClick={()=>editor?.chain().focus().toggleItalic().run()}><Italic size={18}/></Tool>
          <Tool title="تسطير" active={editor?.isActive('underline')} onClick={()=>editor?.chain().focus().toggleUnderline().run()}><UnderlineIcon size={18}/></Tool>
        </div>
        <div className="ribbon-group wide"><span className="group-caption">الخط والمحاذاة</span>
          <select className="tool-select" defaultValue="" onChange={e=>editor?.chain().focus().setMark('textStyle',{fontFamily:e.target.value}).run()}>
            <option value="">الخط الافتراضي</option><option value="'Noto Naskh Arabic', serif">Noto Naskh Arabic</option><option value="'Cairo', sans-serif">Cairo</option><option value="Arial, sans-serif">Arial</option>
          </select>
          <label className="color-control"><Type size={16}/><input type="color" defaultValue="#163A70" onChange={e=>editor?.chain().focus().setColor(e.target.value).run()}/></label>
          <Tool title="يمين" onClick={()=>editor?.chain().focus().setTextAlign('right').run()}><AlignRight size={18}/></Tool>
          <Tool title="وسط" onClick={()=>editor?.chain().focus().setTextAlign('center').run()}><AlignCenter size={18}/></Tool>
          <Tool title="يسار" onClick={()=>editor?.chain().focus().setTextAlign('left').run()}><AlignLeft size={18}/></Tool>
          <Tool title="مرقمة" onClick={()=>editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={18}/></Tool>
          <Tool title="نقطية" onClick={()=>editor?.chain().focus().toggleBulletList().run()}><List size={18}/></Tool>
          <button className="ribbon-chip" onClick={()=>applyDirection('rtl')}>عربي RTL</button><button className="ribbon-chip" onClick={()=>applyDirection('ltr')}>English LTR</button>
        </div>
      </>}
      {ribbon==='insert'&&<div className="ribbon-group wider"><span className="group-caption">إدراج</span>
        <Tool title="عنوان سؤال" onClick={()=>editor?.chain().focus().toggleHeading({level:2}).run()}><Heading2 size={18}/></Tool>
        <Tool title="جدول" onClick={()=>editor?.chain().focus().insertTable({rows:2,cols:3,withHeaderRow:false}).run()}><Table2 size={18}/></Tool>
        <Tool title="فاصل" onClick={()=>editor?.chain().focus().setHorizontalRule().run()}><Minus size={18}/></Tool>
        <button className="ribbon-template" onClick={()=>setLatinDialog(true)}><Sigma size={16}/> معادلة English</button>
        <button className="ribbon-template" onClick={()=>setArabicDialog(true)}><PenTool size={16}/> معادلة عربية</button>
        {questionTemplates.map(q=><button key={q.id} className="ribbon-template" onClick={()=>insertHTML(q.html)}>{q.label}</button>)}
      </div>}
      {ribbon==='page'&&<div className="ribbon-group wide"><span className="group-caption">الصفحة</span><span className="layout-note">A4 · PDF · موبايل/تابلت/حاسوب</span><button className="ribbon-template" onClick={()=>logoRef.current?.click()}><ImagePlus size={16}/> رفع شعار</button><button className="ribbon-template" onClick={printToPDF}><Printer size={16}/> PDF</button></div>}
      {ribbon==='style'&&<div className="ribbon-group wider"><span className="group-caption">الثيمات</span>{THEME_OPTIONS.map(t=><button key={t.id} className={`theme-ribbon ${theme===t.id?'theme-active':''}`} onClick={()=>setTheme(t.id)}><span style={{background:t.colors[0]}}/>{t.label}</button>)}</div>}
    </div>

    <div className="workspace">
      <main className="editing-area">
        <div className="canvas-toolbar"><div className="canvas-breadcrumb"><FileText size={16}/><strong>معاينة الورقة</strong><ChevronDown size={15}/><span>تحديث مباشر</span></div><div className="canvas-actions"><button onClick={printToPDF}><Printer size={16}/> PDF</button><button onClick={()=>saveJSON(project)}><FileJson size={16}/> JSON</button></div></div>
        <div className="paper-topline"><span>معاينة A4 — الهاتف أولًا ثم التابلت والحاسوب</span><span>{THEME_OPTIONS.find(t=>t.id===theme)?.label}</span></div>
        <div className="paper-scroll"><div className={`exam-paper theme-${theme}`}>
          <div className="paper-header" ref={headerRef}>
            {logo.src&&<button className="paper-logo" style={{left:`${logo.x}%`,top:`${logo.y}%`,width:`${logo.width}%`}} onPointerDown={startDrag}><img src={logo.src} alt={logo.name||'شعار'}/><span><Grip size={14}/> شعار</span></button>}
            <div className="header-government"><strong>{meta.country}</strong><span>{meta.ministry}</span><span>{meta.directorate}</span><span>{meta.administration}</span>{meta.school&&<span>{meta.school}</span>}</div>
            <div className="header-center"><h1>{meta.examTitle}</h1><strong>{meta.year}</strong><strong>({meta.examDate})</strong><span>{meta.round}</span></div>
            <div className="header-details"><span><b>المادة:</b> {meta.subject}</span><span><b>الصف:</b> {meta.grade}</span><span><b>الوقت:</b> {meta.duration}</span></div>
          </div>
          <div className="exam-note">{meta.note}</div>
          <div className="name-line"><b>اسم الطالب/ة:</b><span className="dotted-line"/></div>
          <EditorContent editor={editor}/>
          <footer className="paper-footer"><span>{meta.teacher?`مدرس المادة: ${meta.teacher}`:'مدرس المادة: ........................'}</span><span>مع تمنياتنا لكم بالتوفيق والنجاح</span></footer>
        </div></div>
      </main>

      <aside className={`inspector ${panelsOpen?'open':''}`}>
        <section className="panel-card"><div className="panel-card-head"><h3><Menu size={18}/> نماذج الامتحانات</h3><button className="icon-ghost" onClick={()=>setPanelsOpen(false)}><X size={16}/></button></div><div className="panel-card-body"><div className="preset-list">{paperPresets.map(p=><button className="preset-card" key={p.id} onClick={()=>loadPreset(p.id)}><strong>{p.label}</strong><small>{p.summary}</small></button>)}</div></div></section>
        <section className="panel-card"><div className="panel-card-head"><h3><Settings2 size={18}/> بيانات الامتحان</h3></div><div className="panel-card-body"><div className="fields-grid">
          {([['country','الدولة'],['ministry','الوزارة'],['directorate','المديرية'],['administration','الإدارة'],['school','اسم المدرسة'],['examTitle','عنوان الامتحان'],['grade','الصف'],['subject','المادة'],['year','السنة'],['examDate','العام الدراسي'],['round','الدور'],['duration','الوقت'],['teacher','المدرس']] as [keyof ExamMeta,string][]).map(([k,l])=><label key={k}><span>{l}</span><input value={meta[k]} onChange={e=>updateMeta(k,e.target.value)}/></label>)}
          <label className="full-span"><span>ملاحظة الامتحان</span><textarea rows={3} value={meta.note} onChange={e=>updateMeta('note',e.target.value)}/></label>
        </div></div></section>
        <section className="panel-card"><div className="panel-card-head"><h3><ImagePlus size={18}/> الشعار والهيدر</h3></div><div className="panel-card-body">
          <p className="panel-help">ارفع الشعار ثم اسحبه داخل الهيدر أو اضبط موضعه وحجمه.</p>
          <div className="logo-actions"><button className="ribbon-template" onClick={()=>logoRef.current?.click()}><Upload size={15}/> رفع شعار</button><button className="ribbon-template" onClick={()=>setLogo(v=>({...v,x:88,y:12,width:13}))}><RotateCcw size={15}/> ضبط</button><button className="ribbon-template" onClick={()=>setLogo(defaultLogo)}><X size={15}/> حذف</button></div>
          {logo.src&&<div className="slider-group"><label><span>أفقي</span><input type="range" min="6" max="94" value={logo.x} onChange={e=>setLogo(v=>({...v,x:+e.target.value}))}/></label><label><span>عمودي</span><input type="range" min="6" max="70" value={logo.y} onChange={e=>setLogo(v=>({...v,y:+e.target.value}))}/></label><label><span>الحجم</span><input type="range" min="6" max="28" value={logo.width} onChange={e=>setLogo(v=>({...v,width:+e.target.value}))}/></label></div>}
        </div></section>
        <section className="panel-card"><div className="panel-card-head"><h3><Palette size={18}/> الثيمات</h3></div><div className="panel-card-body"><div className="theme-grid">{THEME_OPTIONS.map(t=><button key={t.id} className={`theme-tile ${theme===t.id?'chosen':''}`} onClick={()=>setTheme(t.id)}><span className="swatch" style={{background:`linear-gradient(135deg,${t.colors[0]} 0 22%,${t.colors[1]} 22% 100%)`}}/><strong>{t.label}</strong><small>{t.description}</small></button>)}</div></div></section>
      </aside>
    </div>

    <div className="statusbar"><span>{notice}</span><span><Check size={13}/> حفظ محلي تلقائي</span><span>{editor?.getText().length||0} حرف</span></div>

    {latinDialog&&<div className="dialog-shade" onMouseDown={e=>{if(e.target===e.currentTarget)setLatinDialog(false)}}><div className="dialog">
      <div className="dialog-header"><h2><Sigma size={22}/> معادلة إنكليزية</h2><button onClick={()=>setLatinDialog(false)}><X size={18}/></button></div>
      <p>MathLive / LaTeX للمعادلات القياسية.</p><MathField value={latex} onChange={setLatex}/>
      <label className="latex-label">LaTeX<input dir="ltr" value={latex} onChange={e=>setLatex(e.target.value)}/></label>
      <div className="math-sample"><span>معاينة:</span><MathPreview latex={latex} displayMode/></div>
      <div className="dialog-actions"><button onClick={()=>setLatinDialog(false)}>إلغاء</button><button className="primary-action" onClick={()=>{editor?.chain().focus().insertContent({type:'math',attrs:{latex}}).run();setLatinDialog(false)}}><Sigma size={16}/> إدراج</button></div>
    </div></div>}

    {arabicDialog&&<div className="dialog-shade" onMouseDown={e=>{if(e.target===e.currentTarget)setArabicDialog(false)}}><div className="dialog">
      <div className="dialog-header"><h2><PenTool size={22}/> معادلة عربية</h2><button onClick={()=>setArabicDialog(false)}><X size={18}/></button></div>
      <p>محرر مستقل للعبارات الرياضية العربية.</p><textarea className="arabic-math-editor big" dir="rtl" rows={4} value={arabicMath} onChange={e=>setArabicMath(e.target.value)}/>
      <div className="arabic-chips">{['س','ص','ع','²','³','√','≤','≥','±','π','جا','جتا','ظا','→','='].map(x=><button key={x} onClick={()=>setArabicMath(v=>v+x)}>{x}</button>)}</div>
      <div className="math-sample"><span>معاينة:</span><ArabicMathPreview value={arabicMath}/></div>
      <div className="dialog-actions"><button onClick={()=>setArabicDialog(false)}>إلغاء</button><button className="primary-action" onClick={()=>{editor?.chain().focus().insertContent({type:'arabicMath',attrs:{value:arabicMath}}).run();setArabicDialog(false)}}><PenTool size={16}/> إدراج</button></div>
    </div></div>}
  </div>;
}
