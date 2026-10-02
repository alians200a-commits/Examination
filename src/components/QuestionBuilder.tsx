import { memo, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react';
import { ArrowDown, ArrowUp, CopyPlus, FilePlus2, ImagePlus, Plus, Printer, Sigma, PenTool, Trash2, FileText } from 'lucide-react';
import { GRADES, STAGE_LABELS, EXAM_KINDS, EXAM_ROUNDS, examTitle, numberingFor, subjectsFor, digitsFor, partLabel, type Stage, type Numbering } from '../curriculum';
import type { ExamMeta } from '../data';
import { imageForQuestion } from '../image';
import { newPart, newQuestion, type ExamQuestion, type ExamImage, type ExamPart, type BranchNumbering, type FormulaLanguage, type QuestionFormula, type StructuredExam } from '../formExam';
import { ArabicMathPreview, MathPreview } from '../MathSupport';

export type FormulaTarget = { questionId: string; partId?: string; language: FormulaLanguage; initial: string };
interface Props {
  exam: StructuredExam;
  setExam: Dispatch<SetStateAction<StructuredExam>>;
  meta: ExamMeta;
  onMeta: (key: keyof ExamMeta, value: string) => void;
  onFormula: (target: FormulaTarget) => void;
  onPrint: () => void;
  onError: (message: string) => void;
  activePage: number;
  onActivePage: (page: number) => void;
  overflowPages: number[];
  onFontUpload: () => void;
}

const styleChoices: { value: BranchNumbering; label: string }[] = [
  { value: 'auto', label: 'تلقائي حسب المادة' }, { value: 'arabic', label: 'عربي: أ، ب، ج' },
  { value: 'latin', label: 'English: A, B, C' }, { value: 'none', label: 'بلا ترقيم' },
];
function FormulaLabel({ value }: { value: QuestionFormula }) {
  return <span className="builder-formula">{value.language === 'arabic'
    ? <ArabicMathPreview value={value.value} /> : <MathPreview latex={value.value} />}</span>;
}
function ImageControls({ image, onSet, onError, label = 'صورة السؤال' }: {
  image?: ExamImage; onSet: (image?: ExamImage) => void; onError: (message: string) => void; label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const onUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; e.target.value = '';
    if (!file) return;
    setBusy(true);
    try { onSet({ src: await imageForQuestion(file), name: file.name, width: 55, align: 'center' }); }
    catch (error) { onError(error instanceof Error ? error.message : 'تعذر قراءة الصورة'); }
    finally { setBusy(false); }
  };
  return <div className="qb-image-panel">
    <label className="btn qb-image-picker"><ImagePlus size={15} /> {busy ? 'جارٍ ضغط الصورة…' : image ? 'تبديل الصورة' : `إضافة ${label}`}
      <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={onUpload} disabled={busy}/>
    </label>
    {image && <div className="qb-image-options">
      <img src={image.src} alt={image.name || label}/>
      <label>العرض %{image.width}<input type="range" min="20" max="100" step="5" value={image.width} onChange={e => onSet({ ...image, width: Number(e.target.value) })}/></label>
      <label>المحاذاة<select value={image.align} onChange={e => onSet({ ...image, align: e.target.value as ExamImage['align'] })}>
        <option value="right">يمين</option><option value="center">وسط</option><option value="left">يسار</option>
      </select></label>
      <button type="button" className="btn danger" onClick={() => onSet(undefined)}><Trash2 size={14}/> حذف الصورة</button>
    </div>}
  </div>;
}
function Question({ question, index, total, setExam, onFormula, onError, numbering, pageCount }: {
  question: ExamQuestion; index: number; total: number; setExam: Props['setExam']; onFormula: Props['onFormula'];
  onError: Props['onError']; numbering: Numbering; pageCount: number;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const patchQuestion = (patch: Partial<ExamQuestion>) => setExam(prev => ({ ...prev, questions: prev.questions.map(q => q.id === question.id ? { ...q, ...patch } : q) }));
  const patchPart = (partId: string, patch: Partial<ExamPart>) => setExam(prev => ({ ...prev,
    questions: prev.questions.map(q => q.id === question.id ? { ...q, parts: q.parts.map(p => p.id === partId ? { ...p, ...patch } : p) } : q),
  }));
  const deleteFormula = (partId?: string) => {
    if (partId) patchPart(partId, {formula:undefined}); else patchQuestion({formula:undefined});
  };
  const formulas = (partId?: string, current?: QuestionFormula) => <div className="qb-formula-actions">
    <button type="button" onClick={() => onFormula({questionId:question.id,partId,language:'arabic',initial:current?.language==='arabic'?current.value:''})}><PenTool size={14}/> معادلة عربية</button>
    <button type="button" onClick={() => onFormula({questionId:question.id,partId,language:'latin',initial:current?.language==='latin'?current.value:''})}><Sigma size={14}/> English math</button>
    {current && <button type="button" className="danger" onClick={() => deleteFormula(partId)}>حذف المعادلة</button>}
  </div>;
  const actualBranch: Numbering = question.branchNumbering === 'latin' || question.branchNumbering === 'arabic' ? question.branchNumbering : numbering;
  const move = (delta:number) => setExam(prev => {
    const qs=[...prev.questions]; const from=qs.findIndex(q=>q.id===question.id),to=from+delta;
    if (to<0||to>=qs.length) return prev; [qs[from],qs[to]]=[qs[to],qs[from]]; return {...prev,questions:qs};
  });
  const duplicate = () => setExam(prev => {
    const qs=[...prev.questions],at=qs.findIndex(q=>q.id===question.id);
    const suffix=crypto.randomUUID();qs.splice(at+1,0,{...question,id:suffix,parts:question.parts.map(p=>({...p,id:crypto.randomUUID()}))});
    return {...prev,questions:qs};
  });
  return <section className="qb-question" aria-label={`السؤال ${index + 1}`}>
    <div className="qb-question-head"><strong>السؤال {digitsFor(index+1,numbering)}</strong>
      <div className="qb-question-tools">
        <button title="فوق" disabled={index===0} onClick={()=>move(-1)}><ArrowUp size={16}/></button>
        <button title="تحت" disabled={index===total-1} onClick={()=>move(1)}><ArrowDown size={16}/></button>
        <button title="نسخ" onClick={duplicate}><CopyPlus size={16}/></button>
        <button title="حذف" className="danger" onClick={()=>setConfirmDelete(true)}><Trash2 size={16}/></button>
      </div>
    </div>
    {confirmDelete && <div className="qb-delete-confirm"><strong>حذف السؤال مع أفرعه؟</strong><button onClick={()=>setConfirmDelete(false)}>إلغاء</button><button className="danger" onClick={()=>setExam(p=>({...p,questions:p.questions.filter(q=>q.id!==question.id)}))}>حذف</button></div>}
    <div className="qb-question-fields">
      <label className="qb-grow">عنوان السؤال (اختياري)<input dir="auto" value={question.title} onChange={e=>patchQuestion({title:e.target.value})}/></label>
      <label className="qb-score">درجة السؤال<input type="number" min="0" max="10000" value={question.score} onChange={e=>patchQuestion({score:Math.max(0,Number(e.target.value)||0)})}/></label>
      <label>الصفحة<select value={question.page??0} onChange={e=>patchQuestion({page:Number(e.target.value)})}>{Array.from({length:pageCount},(_,i)=><option key={i} value={i}>صفحة {digitsFor(i+1,numbering)}</option>)}</select></label>
      <label>ترقيم الأفرع<select value={question.branchNumbering||'auto'} onChange={e=>patchQuestion({branchNumbering:e.target.value as BranchNumbering})}>{styleChoices.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></label>
      <label className="qb-full">نص السؤال<textarea dir="auto" rows={3} value={question.prompt} onChange={e=>patchQuestion({prompt:e.target.value})}/></label>
    </div>
    {question.formula && <div className="qb-formula-preview"><FormulaLabel value={question.formula}/></div>}
    {formulas(undefined,question.formula)}
    <ImageControls label="صورة للسؤال" image={question.image} onError={onError} onSet={image=>patchQuestion({image})}/>
    <div className="qb-parts-title">الأفرع <small>يمكن الترقيم بالعربية أو الإنكليزية وإضافة درجة بنهاية أي فرع.</small></div>
    <div className="qb-parts">{question.parts.map((part,idx)=><div className="qb-part" key={part.id}>
      <span className="qb-part-index">{question.branchNumbering === 'none' ? '—' : partLabel(idx, actualBranch)}</span>
      <div className="qb-part-fields">
        <textarea rows={2} dir="auto" aria-label={`نص الفرع ${idx+1}`} value={part.text} onChange={e=>patchPart(part.id,{text:e.target.value})}/>
        {part.formula && <div className="qb-formula-preview"><FormulaLabel value={part.formula}/></div>}
        {formulas(part.id,part.formula)}
        <ImageControls label="صورة للفرع" image={part.image} onError={onError} onSet={image=>patchPart(part.id,{image})}/>
        <div className="qb-subitems"><label>ترقيم داخل الفرع (اختياري)<select value={part.subNumbering||'none'} onChange={e=>patchPart(part.id,{subNumbering:e.target.value as BranchNumbering})}>
          {styleChoices.filter(x=>x.value!=='auto').map(x=><option key={x.value} value={x.value}>{x.label}</option>)}
        </select></label>
          {part.subNumbering && part.subNumbering!=='none' && <>
            {(part.subItems||[]).map((item,i)=><div key={i} className="qb-subrow"><span>{partLabel(i,part.subNumbering as Numbering)}</span><input dir="auto" value={item} onChange={e=>patchPart(part.id,{subItems:(part.subItems||[]).map((v,j)=>j===i?e.target.value:v)})}/><button title="حذف" onClick={()=>patchPart(part.id,{subItems:(part.subItems||[]).filter((_,j)=>j!==i)})}><Trash2 size={14}/></button></div>)}
            <button type="button" className="btn" onClick={()=>patchPart(part.id,{subItems:[...(part.subItems||[]),'']})}><Plus size={14}/> إضافة بند</button>
          </>}
        </div>
      </div>
      <label className="qb-part-score">الدرجة (اختياري)<input type="number" min="0" max="1000" value={part.score??''} onChange={e=>patchPart(part.id,{score:e.target.value===''?undefined:Math.max(0,Number(e.target.value)||0)})} placeholder="—"/></label>
      <button className="qb-delete-part" title="حذف فرع" onClick={()=>patchQuestion({parts:question.parts.filter(p=>p.id!==part.id)})}><Trash2 size={16}/></button>
    </div>)}</div>
    <button className="btn qb-add-part" onClick={()=>patchQuestion({parts:[...question.parts,newPart()]})}><Plus size={17}/> إضافة فرع</button>
  </section>;
}
const MemoQuestion=memo(Question);

export function QuestionBuilder({exam,setExam,meta,onMeta,onFormula,onPrint,onError,activePage,onActivePage,overflowPages,onFontUpload}:Props) {
  const pageCount=exam.pageCount||1;
  const inferred=numberingFor(meta.stage||'primary',meta.subject);
  const numbering=meta.numbering&&meta.numbering!=='auto'?meta.numbering:inferred;
  const years=digitsFor(meta.examDate,numbering);
  const changeStage=(stage:Stage)=>{
    const grade=GRADES[stage][0];onMeta('stage',stage);onMeta('grade',grade);onMeta('subject',subjectsFor(stage,grade)[0]);onMeta('numbering','auto');
  };
  const changeKind=(kind:ExamMeta['examKind'])=>{onMeta('examKind',kind);onMeta('examTitle',examTitle(kind));onMeta('round',kind.includes('الشهر')?'':'الدور الأول');};
  const addPage=()=>{if(pageCount>=30){onError('الحد الأقصى ٣٠ صفحة');return;}setExam(prev=>({...prev,pageCount:pageCount+1}));onActivePage(pageCount);};
  const removeLastPage=()=>{if(pageCount<=1)return;setExam(prev=>({...prev,pageCount:pageCount-1,questions:prev.questions.map(q=>(q.page||0)>=pageCount-1?{...q,page:pageCount-2}:q)}));onActivePage(pageCount-2);};
  const total=exam.questions.reduce((sum,q)=>sum+q.score,0);
  return <section className="qb" aria-label="منشئ ورقة الامتحان">
    <div className="qb-heading"><div><h2>إنشاء ورقة الامتحان</h2><p>البيانات ← الأسئلة ← الأفرع ← معاينة A4 ← PDF</p></div><button className="btn compact" onClick={onPrint}><Printer size={16}/> PDF</button></div>
    <details className="qb-meta" open><summary>بيانات الامتحان <small>المرحلة، الصف، المادة، والترويسة</small></summary>
      <div className="qb-meta-grid">
        <label><span>١. المرحلة</span><select value={meta.stage} onChange={e=>changeStage(e.target.value as Stage)}>{(Object.keys(STAGE_LABELS) as Stage[]).map(x=><option key={x} value={x}>{STAGE_LABELS[x]}</option>)}</select></label>
        <label><span>٢. الصف</span><select value={meta.grade} onChange={e=>{const grade=e.target.value;onMeta('grade',grade);const subjects=subjectsFor(meta.stage,grade);if(!subjects.includes(meta.subject))onMeta('subject',subjects[0]);}}>{GRADES[meta.stage].map(g=><option key={g} value={g}>{g}</option>)}</select></label>
        <label><span>٣. المادة</span><select value={meta.subject} onChange={e=>onMeta('subject',e.target.value)}>{subjectsFor(meta.stage,meta.grade).map(s=><option key={s} value={s}>{s}</option>)}</select></label>
        <label><span>٤. نوع الامتحان</span><select value={meta.examKind} onChange={e=>changeKind(e.target.value as ExamMeta['examKind'])}>{EXAM_KINDS.map(k=><option key={k} value={k}>{k}</option>)}</select></label>
        {!meta.examKind.includes('الشهر') && <label><span>الدور</span><select value={meta.round||'الدور الأول'} onChange={e=>onMeta('round',e.target.value)}>{EXAM_ROUNDS.map(x=><option key={x} value={x}>{x}</option>)}</select></label>}
        <label><span>السنة الدراسية</span><input dir="auto" value={years} onChange={e=>onMeta('examDate',e.target.value)} placeholder="٢٠٢٧-٢٠٢٦"/></label>
        <label><span>التاريخ الهجري (اختياري)</span><input dir="auto" value={meta.hijriDate} onChange={e=>onMeta('hijriDate',e.target.value)} placeholder="مثلاً: ١٤٤٨ هـ"/></label>
        <label><span>المدرسة</span><input value={meta.school} onChange={e=>onMeta('school',e.target.value)}/></label>
        <label><span>المديرية</span><input value={meta.directorate} onChange={e=>onMeta('directorate',e.target.value)}/></label>
        <label><span>عنوان الامتحان (قابل للتعديل)</span><input value={meta.examTitle} onChange={e=>onMeta('examTitle',e.target.value)}/></label>
        <label><span>الوقت</span><input value={meta.duration} onChange={e=>onMeta('duration',e.target.value)}/></label>
        <label><span>التاريخ الميلادي (اختياري)</span><input value={meta.day} onChange={e=>onMeta('day',e.target.value)}/></label>
        <label><span>مدرس المادة</span><input value={meta.teacher} onChange={e=>onMeta('teacher',e.target.value)}/></label>
        <label><span>الترقيم الافتراضي</span><select value={meta.numbering||'auto'} onChange={e=>onMeta('numbering',e.target.value)}><option value="auto">تلقائي حسب المرحلة والمادة</option><option value="arabic">عربي ١، ٢ — أ، ب</option><option value="latin">English 1, 2 — A, B</option></select></label>
        <label><span>خط الورقة</span><select value={meta.fontFamily} onChange={e=>onMeta('fontFamily',e.target.value)}><option value="'Noto Naskh Arabic', serif">Noto Naskh Arabic</option><option value="'Cairo', sans-serif">Cairo</option><option value="Arial, sans-serif">Arial</option><option value="'Times New Roman', serif">Times New Roman</option>{meta.customFontSrc && <option value="'ExamUserFont', serif">{meta.customFontName || 'الخط المرفوع'}</option>}</select></label>
        <div className="qb-font-upload"><button type="button" className="btn" onClick={onFontUpload}>رفع خط إضافي (TTF/OTF/WOFF2)</button>{meta.customFontSrc&&<button type="button" className="btn danger" onClick={()=>{onMeta('customFontSrc','');onMeta('customFontName','');onMeta('fontFamily',"'Noto Naskh Arabic', serif");}}>حذف الخط</button>}</div>
        <label><span>حجم خط الأسئلة</span><select value={meta.fontSize} onChange={e=>onMeta('fontSize',e.target.value)}>{[11,12,13,14,15,16,17,18,20,22].map(x=><option key={x} value={x}>{x} pt</option>)}</select></label>
        <label className="qb-full"><span>ملاحظة الامتحان</span><textarea rows={2} value={meta.note} onChange={e=>onMeta('note',e.target.value)}/></label>
      </div>
    </details>
    <div className="qb-summary"><strong>الأسئلة: {digitsFor(exam.questions.length,numbering)}</strong><strong>مجموع الدرجات: {digitsFor(total,numbering)}</strong><strong>الصفحات: {digitsFor(pageCount,numbering)}</strong></div>
    <div className="qb-page-toolbar"><strong>صفحات A4:</strong>{Array.from({length:pageCount},(_,i)=><button key={i} className={`btn ${activePage===i?'active-page':''}`} onClick={()=>onActivePage(i)}>صفحة {digitsFor(i+1,numbering)} {overflowPages.includes(i)?'— ممتلئة':''}</button>)}
      <button className="btn primary" onClick={addPage}><FilePlus2 size={15}/> إضافة صفحة</button>{pageCount>1&&<button className="btn danger" onClick={removeLastPage}><Trash2 size={14}/> حذف الأخيرة ونقل أسئلتها</button>}
    </div>
    {overflowPages.length>0&&<p className="qb-overflow" role="alert">تنبيه: الصفحة {overflowPages.map(p=>digitsFor(p+1,numbering)).join('، ')} تجاوزت حدود A4. انقل سؤالًا إلى الصفحة التالية أو قلّل الخط/حجم الصورة قبل التصدير؛ لن تُضاف صفحات تلقائيًا.</p>}
    {exam.questions.map((q,i)=><MemoQuestion key={q.id} question={q} index={i} total={exam.questions.length} setExam={setExam} onFormula={onFormula} onError={onError} numbering={numbering} pageCount={pageCount}/>) }
    <button className="btn primary qb-add-question" onClick={()=>setExam(p=>({...p,questions:[...p.questions,newQuestion(activePage)]}))}><Plus size={17}/> إضافة سؤال في صفحة {digitsFor(activePage+1,numbering)}</button>
    <label className="qb-ending"><span>عبارة ختامية في الصفحة الأخيرة فقط</span><input value={exam.closing} onChange={e=>setExam(p=>({...p,closing:e.target.value}))}/></label>
    <label className="qb-free-option"><input type="checkbox" checked={!!exam.showFreeText} onChange={e=>setExam(p=>({...p,showFreeText:e.target.checked}))}/><FileText size={17}/> إظهار مساحة تحرير حر داخل آخر صفحة (بنفس مستند الامتحان، وليست طريقة إدخال ثانية).</label>
  </section>;
}
