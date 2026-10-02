import type { ExamImage, ExamPart, ExamQuestion, QuestionFormula, StructuredExam } from '../formExam';
import { partLabel, digitsFor, type Numbering } from '../curriculum';
import { ArabicMathPreview, MathPreview } from '../MathSupport';

function PrintableFormula({ formula }: { formula: QuestionFormula }) {
  return <span className="sq-formula">{formula.language === 'arabic'
    ? <ArabicMathPreview value={formula.value}/> : <MathPreview latex={formula.value}/>}</span>;
}
function PrintableImage({ image }: { image: ExamImage }) {
  return <div className={`sq-image sq-image-${image.align}`}>
    <img src={image.src} alt={image.name || 'رسم توضيحي في السؤال'} style={{width:`${image.width}%`}}/>
  </div>;
}
function PrintedPart({ part, index, branchStyle, defaultNumbering }: {part:ExamPart;index:number;branchStyle:ExamQuestion['branchNumbering'];defaultNumbering:Numbering}) {
  const numbering=branchStyle === 'arabic' || branchStyle === 'latin' ? branchStyle : defaultNumbering;
  const nested=part.subNumbering === 'arabic' || part.subNumbering === 'latin' ? part.subNumbering : defaultNumbering;
  return <div className="sq-part">
    {branchStyle !== 'none' && <span className="sq-letter">{partLabel(index,numbering)})</span>}
    <div className="sq-part-content">
      {part.text && <span className="sq-part-text" dir="auto">{part.text}</span>}
      {part.formula && <PrintableFormula formula={part.formula}/>}
      {part.image && <PrintableImage image={part.image}/>}
      {part.subNumbering && part.subNumbering !== 'none' && (part.subItems?.length||0)>0 &&
        <div className="sq-subitems">{part.subItems?.map((item,i)=><div className="sq-subitem" key={i}>
          <strong>{partLabel(i,nested)})</strong><span dir="auto">{item}</span>
        </div>)}</div>}
    </div>
    {part.score !== undefined && <span className="sq-part-grade">({digitsFor(part.score,numbering)} درجات)</span>}
  </div>;
}
export function StructuredQuestion({ question, index, numbering }: {question:ExamQuestion; index:number; numbering:Numbering}) {
  return <section className="sq-question">
    <div className="sq-heading"><div className="sq-question-title"><strong>س:{digitsFor(index+1,numbering)})</strong>
      {question.title && <strong>{question.title}</strong>}
      {question.prompt && <span className="sq-heading-prompt" dir="auto">{question.prompt}</span>}
      </div><span className="sq-grade">({digitsFor(question.score,numbering)} درجات)</span></div>
    {question.formula && <div className="sq-question-formula"><PrintableFormula formula={question.formula}/></div>}
    {question.image && <PrintableImage image={question.image}/>}
    {question.parts.map((part,i)=><PrintedPart key={part.id} part={part} index={i} branchStyle={question.branchNumbering} defaultNumbering={numbering}/>)}
  </section>;
}
export function StructuredSheet({exam,page,numbering}:{exam:StructuredExam;page:number;numbering:Numbering}) {
  const questions=exam.questions.map((q,index)=>({q,index})).filter(({q})=>(q.page||0)===page);
  return <div className="sq-exam" data-page={page}>
    {questions.map(({q,index})=><StructuredQuestion key={q.id} question={q} index={index} numbering={numbering}/>)}
    {questions.length===0&&<div className="sq-empty">هذه الصفحة فارغة. أضف سؤالًا أو انقله إليها من لوحة الأسئلة.</div>}
  </div>;
}
