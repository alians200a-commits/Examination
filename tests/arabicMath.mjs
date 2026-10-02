import assert from 'node:assert/strict';
import fs from 'node:fs';
import typescript from 'typescript';
import katex from 'katex';

const ts=fs.readFileSync(new URL('../src/arabicMath.ts',import.meta.url),'utf8');
const compiled=typescript.transpileModule(ts,{compilerOptions:{module:typescript.ModuleKind.ESNext,target:typescript.ScriptTarget.ES2020}});
const {arabicEquationToLatex,arabicDigits,parseArabicLongDivision}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputText).toString('base64'));

assert.equal(arabicDigits('12345 ۰۱۲۳۴'),'١٢٣٤٥ ٠١٢٣٤');
const cases=[
  ['س² + 3س + 1 = 0', ['\\text{٣}','\\text{١}','\\text{٠}','^{\\text{٢}}']],
  ['(س+١)/(ص-٢)', ['\\frac{','\\text{س}','\\text{ص}']],
  ['√(س²+٩)', ['\\sqrt{','\\text{٩}']],
  ['∛(س+٨)', ['\\sqrt[','\\text{٣}']],
  ['|س-٣|', ['\\left|','\\right|']],
  ['١٢٫٥ ÷ ٥', ['\\text{١٢٫٥}','\\div']],
  ['٣س + ٢ص = ٩', ['\\text{٣}','\\text{٢}','\\text{٩}']],
  ['∑_(س=١)^(ن)', ['\\sum','\\text{ن}']],
  ['(١/٢)/(٣/٤)', ['\\frac{\\frac{']],
];
for(const [expr,fragments] of cases){
 const result=arabicEquationToLatex(expr);
 assert.equal(result.error,null,expr+': '+result.error);
 for(const part of fragments)assert.ok(result.latex.includes(part),expr+' missing '+part+' in '+result.latex);
 const markup=katex.renderToString(result.latex,{throwOnError:true,output:'htmlAndMathml',strict:'ignore'});
 assert.ok(markup.includes('katex'),expr);
 if(expr.includes('/')||expr.includes('÷'))assert.ok(markup.includes('mfrac')||markup.includes('mtext'),expr);
 console.log('PASS:',expr,'=>',result.latex);
}
assert.equal(arabicEquationToLatex('(س+٢').error!==null,true);
assert.equal(arabicEquationToLatex('١#٢').error!==null,true);
assert.equal(arabicEquationToLatex('1/0').latex.includes('\\text{٠}'),true);
assert.deepEqual(parseArabicLongDivision('قسمة(١٢،٣،٤)'),{dividend:'١٢',divisor:'٣',quotient:'٤'});
assert.equal(arabicEquationToLatex('قسمة(١٢،٣،٤)').error,null);
assert.ok(arabicEquationToLatex('قسمة(١٢،،٤)').error);
for(const input of ['٢ >= ١','٢ <= ٣','٢ != ٣','٢ > ١','١ < ٢','٣ = ٣']) {
  const converted=arabicEquationToLatex(input);
  assert.equal(converted.error,null,input+': '+converted.error);
  assert.doesNotThrow(()=>katex.renderToString(converted.latex,{throwOnError:true}),input);
}
console.log('Arabic equation parser, comparisons, long division and KaTeX checks passed.');
