import { ArabicMathPreview, MathPreview } from '../MathSupport';
import { arabicDigits } from '../arabicMath';
import type { ExamPart, QuestionFormula, StructuredExam } from '../formExam';

function PrintableFormula({ value }: { value: QuestionFormula }) {
  return <span className="sq-formula">{value.language === 'arabic'
    ? <ArabicMathPreview value={value.value}/>
    : <MathPreview latex={value.value}/>}</span>;
}
function PrintedPart({ part, index }: { part: ExamPart; index: number }) {
  return <div className="sq-part">
    <span className="sq-letter">{['أ','ب','ج','د','هـ','و','ز','ح','ط','ي'][index] || arabicDigits(String(index + 1))})</span>
    <span className="sq-part-content"><span>{part.text || '.....................................'}</span>{part.formula && <PrintableFormula value={part.formula}/>}</span>
    {part.score !== undefined && <span className="sq-part-grade">({arabicDigits(String(part.score))} درجات)</span>}
  </div>;
}

export function StructuredSheet({ exam }: { exam: StructuredExam }) {
  return <div className="sq-exam">
    {exam.questions.map((question,index)=><section key={question.id} className="sq-question">
      <div className="sq-heading"><div><strong>س/{arabicDigits(String(index+1))}</strong>{question.title && <strong> ({question.title})</strong>}</div><span className="sq-grade">({arabicDigits(String(question.score))} درجة)</span></div>
      {question.prompt && <p className="sq-prompt">{question.prompt}</p>}
      {question.formula && <div className="sq-question-formula"><PrintableFormula value={question.formula}/></div>}
      {question.parts.map((part,idx)=><PrintedPart key={part.id} part={part} index={idx}/>)}
      <div className="sq-answer-space" aria-hidden="true" />
    </section>)}
    {exam.questions.length===0&&<div className="sq-empty">أضف سؤالًا من لوحة إنشاء الامتحان لتظهر الورقة هنا.</div>}
  </div>;
}
