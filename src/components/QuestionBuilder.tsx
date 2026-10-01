import { memo, useState, type Dispatch, type SetStateAction } from 'react';
import { ArrowDown, ArrowUp, CopyPlus, FilePlus2, Plus, Printer, Sigma, PenTool, Trash2 } from 'lucide-react';
import type { ExamMeta } from '../data';
import { arabicDigits } from '../arabicMath';
import { newPart, newQuestion, type ExamQuestion, type FormulaLanguage, type QuestionFormula, type StructuredExam } from '../formExam';
import { ArabicMathPreview, MathPreview } from '../MathSupport';

export type FormulaTarget = { questionId: string; partId?: string; language: FormulaLanguage; initial: string };
interface Props {
  exam: StructuredExam;
  setExam: Dispatch<SetStateAction<StructuredExam>>;
  meta: ExamMeta;
  onMeta: (key: keyof ExamMeta, value: string) => void;
  onFormula: (target: FormulaTarget) => void;
  onPrint: () => void;
}

function FormulaLabel({ value }: { value: QuestionFormula }) {
  return <span className="builder-formula">{value.language === 'arabic'
    ? <ArabicMathPreview value={value.value} /> : <MathPreview latex={value.value} />}</span>;
}

function Question({ question, index, total, setExam, onFormula }: {
  question: ExamQuestion;
  index: number;
  total: number;
  setExam: Props['setExam'];
  onFormula: Props['onFormula'];
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = (key: 'title' | 'prompt' | 'score', value: string | number) => setExam(previous => ({
    ...previous,
    questions: previous.questions.map(q => q.id === question.id ? { ...q, [key]: value } : q),
  }));
  const updatePart = (id: string, value: string) => setExam(previous => ({
    ...previous,
    questions: previous.questions.map(q => q.id === question.id
      ? { ...q, parts: q.parts.map(part => part.id === id ? { ...part, text: value } : part) } : q),
  }));
  const updatePartScore = (id: string, value: string) => setExam(previous => ({
    ...previous,
    questions: previous.questions.map(q => q.id === question.id
      ? { ...q, parts: q.parts.map(part => part.id === id
        ? { ...part, score: value === '' ? undefined : Math.max(0, Math.min(1000, Number(value) || 0)) } : part) } : q),
  }));
  const removePart = (id: string) => setExam(previous => ({
    ...previous,
    questions: previous.questions.map(q => q.id === question.id
      ? { ...q, parts: q.parts.filter(part => part.id !== id) } : q),
  }));
  const addPart = () => setExam(previous => ({
    ...previous,
    questions: previous.questions.map(q => q.id === question.id ? { ...q, parts: [...q.parts, newPart()] } : q),
  }));
  const deleteFormula = (partId?: string) => setExam(previous => ({
    ...previous,
    questions: previous.questions.map(q => {
      if (q.id !== question.id) return q;
      if (!partId) return { ...q, formula: undefined };
      return { ...q, parts: q.parts.map(p => p.id === partId ? { ...p, formula: undefined } : p) };
    }),
  }));
  const move = (offset: number) => setExam(previous => {
    const items = [...previous.questions];
    const current = items.findIndex(q => q.id === question.id);
    const next = current + offset;
    if (current < 0 || next < 0 || next >= items.length) return previous;
    [items[current], items[next]] = [items[next], items[current]];
    return { ...previous, questions: items };
  });
  const duplicate = () => setExam(previous => {
    const at = previous.questions.findIndex(q => q.id === question.id);
    const items = [...previous.questions];
    const idSuffix = `${Date.now()}_${Math.round(Math.random() * 100000)}`;
    items.splice(at + 1, 0, { ...question, id: `q_${idSuffix}`, parts: question.parts.map((p, n) => ({ ...p, id: `${idSuffix}_${n}` })) });
    return { ...previous, questions: items };
  });
  const remove = () => setExam(previous => ({ ...previous, questions: previous.questions.filter(q => q.id !== question.id) }));
  const formulaButtons = (partId?: string, current?: QuestionFormula) => (
    <div className="qb-formula-actions">
      <button type="button" onClick={() => onFormula({ questionId: question.id, partId, language: 'arabic', initial: current?.language === 'arabic' ? current.value : '' })}>
        <PenTool size={15} /> {current?.language === 'arabic' ? 'تعديل المعادلة العربية' : 'معادلة عربية'}
      </button>
      <button type="button" onClick={() => onFormula({ questionId: question.id, partId, language: 'latin', initial: current?.language === 'latin' ? current.value : '' })}>
        <Sigma size={15} /> {current?.language === 'latin' ? 'تعديل المعادلة الإنكليزية' : 'English math'}
      </button>
      {current && <button type="button" className="danger" onClick={() => deleteFormula(partId)}>حذف المعادلة</button>}
    </div>
  );

  return <section className="qb-question" aria-label={`السؤال ${index + 1}`}>
    <div className="qb-question-head">
      <strong>السؤال {arabicDigits(String(index + 1))}</strong>
      <div className="qb-question-tools">
        <button title="نقل للأعلى" aria-label="نقل السؤال للأعلى" disabled={index === 0} onClick={() => move(-1)}><ArrowUp size={17}/></button>
        <button title="نقل للأسفل" aria-label="نقل السؤال للأسفل" disabled={index === total - 1} onClick={() => move(1)}><ArrowDown size={17}/></button>
        <button title="نسخ السؤال" aria-label="نسخ السؤال" onClick={duplicate}><CopyPlus size={17}/></button>
        <button className="danger" title="حذف السؤال" aria-label="حذف السؤال" onClick={() => setConfirmDelete(true)}><Trash2 size={17}/></button>
      </div>
    </div>
    {confirmDelete && <div className="qb-delete-confirm" role="alertdialog" aria-label="تأكيد حذف السؤال">
      <strong>حذف هذا السؤال وكل أفرعه؟</strong>
      <button type="button" onClick={() => setConfirmDelete(false)}>إلغاء</button>
      <button type="button" className="danger" onClick={remove}>حذف السؤال</button>
    </div>}
    <div className="qb-question-fields">
      <label className="qb-grow"><span>عنوان السؤال (اختياري)</span><input dir="auto" value={question.title} placeholder="مثل: أقسام الكلام" onChange={event => update('title', event.target.value)}/></label>
      <label className="qb-score"><span>الدرجة</span><input type="number" min="0" max="1000" value={question.score} onChange={event => update('score', Math.max(0, Math.min(1000, Number(event.target.value) || 0)))}/></label>
      <label className="qb-full"><span>نص السؤال</span><textarea dir="auto" rows={3} value={question.prompt} placeholder="اكتب نص السؤال هنا..." onChange={event => update('prompt', event.target.value)}/></label>
    </div>
    {question.formula && <div className="qb-formula-preview"><FormulaLabel value={question.formula}/></div>}
    {formulaButtons(undefined, question.formula)}
    <div className="qb-parts-title">الأفرع <small>اختياري — تُرقّم تلقائيًا بالترتيب</small></div>
    <div className="qb-parts">
      {question.parts.map((part, partIndex) => <div className="qb-part" key={part.id}>
        <span className="qb-part-index">{['أ','ب','ج','د','هـ','و','ز','ح','ط','ي'][partIndex] || arabicDigits(String(partIndex + 1))}</span>
        <div className="qb-part-fields">
          <textarea rows={2} dir="auto" aria-label={`نص الفرع ${partIndex + 1}`} value={part.text} onChange={event => updatePart(part.id, event.target.value)} placeholder="اكتب نص الفرع..." />
          {part.formula && <div className="qb-formula-preview"><FormulaLabel value={part.formula}/></div>}
          {formulaButtons(part.id, part.formula)}
        </div>
        <label className="qb-part-score"><span>الدرجة</span><input type="number" min="0" max="1000" aria-label={`درجة الفرع ${partIndex + 1}`} value={part.score ?? ''} onChange={event => updatePartScore(part.id, event.target.value)} placeholder="—"/></label>
        <button type="button" className="qb-delete-part" title="حذف الفرع" aria-label="حذف الفرع" onClick={() => removePart(part.id)}><Trash2 size={16}/></button>
      </div>)}
    </div>
    <button type="button" className="btn qb-add-part" onClick={addPart}><Plus size={17}/> إضافة فرع جديد</button>
  </section>;
}

const MemoQuestion = memo(Question);

export function QuestionBuilder({ exam, setExam, meta, onMeta, onFormula, onPrint }: Props) {
  const total = exam.questions.reduce((sum, q) => sum + q.score, 0);
  return <section className="qb" aria-label="منشئ الامتحان بالاستمارة">
    <div className="qb-heading"><div><h2>إنشاء ورقة الامتحان</h2><p>أدخل البيانات، ثم أضف الأسئلة وأفرعها مثل البرنامج الظاهر بالفيديو.</p></div><button type="button" className="btn compact" onClick={onPrint}><Printer size={16}/> PDF</button></div>
    <details className="qb-meta" open>
      <summary>بيانات الامتحان <small>تظهر تلقائيًا في الترويسة</small></summary>
      <div className="qb-meta-grid">
        {([['school','اسم المدرسة'],['examTitle','عنوان الامتحان'],['grade','الصف / المرحلة'],['subject','المادة'],['examDate','العام الدراسي'],['day','التاريخ'],['round','الدور'],['duration','الوقت'],['teacher','مدرس المادة']] as [keyof ExamMeta,string][]).map(([key,label]) =>
          <label key={key}><span>{label}</span><input dir="auto" value={meta[key]} onChange={e => onMeta(key, e.target.value)}/></label>)}
        <label className="qb-full"><span>ملاحظة الامتحان</span><textarea rows={2} dir="auto" value={meta.note} onChange={e => onMeta('note', e.target.value)}/></label>
        <label className="qb-full qb-checkbox"><input type="checkbox" checked={meta.schoolFooter === 'yes'} onChange={e => onMeta('schoolFooter', e.target.checked ? 'yes' : 'no')}/><span>إظهار اسم المدرسة بأسفل الورقة بدل الترويسة</span></label>
      </div>
    </details>
    <div className="qb-summary"><strong>الأسئلة: {arabicDigits(String(exam.questions.length))}</strong><strong>مجموع الدرجات: {arabicDigits(String(total))}</strong></div>
    {exam.questions.map((question,index)=><MemoQuestion key={question.id} question={question} index={index} total={exam.questions.length} setExam={setExam} onFormula={onFormula}/>)}
    <button type="button" className="btn primary qb-add-question" onClick={() => setExam(previous => ({ ...previous, questions: [...previous.questions, newQuestion()] }))}><FilePlus2 size={18}/> إضافة سؤال جديد</button>
    <label className="qb-ending"><span>عبارة ختامية (اختياري)</span><input dir="auto" value={exam.closing} onChange={e => setExam(previous => ({ ...previous, closing: e.target.value }))}/></label>
  </section>;
}
