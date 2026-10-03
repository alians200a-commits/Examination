const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const src=f=>fs.readFileSync(path.join(root,'src',f),'utf8');
const m=new Function(src('core.js').replace("(()=>{'use strict';",'').replace('/*MATH*/',()=>src('math.js'))+'\n'+src('render.js')+'\nreturn {texToHTML,parsePieces,piecesToTex,texProblem,richHTML};')();
const examples=[
  [{t:'trig',fn:'sin',e:'٢',x:'س'},'trig','جا','٢'],
  [{t:'trig',fn:'cos',e:'',x:'x'},'trig','cos','x'],
  [{t:'trig',fn:'tan',e:'',x:'س'},'trig','ظا','س'],
  [{t:'trig',fn:'arcsin',e:'',x:'س'},'trig','جا⁻¹','س'],
  [{t:'identity',x:'س'},'identity','جتا','جا'],
  [{t:'deriv',f:'س^{٢}+٣س',v:'س',d:'د'},'deriv','س','د'],
  [{t:'deriv2',f:'س^{٣}',v:'س',d:'د'},'deriv2','س','د'],
  [{t:'partialderiv',f:'س^{٢}+ص',v:'س'},'partialderiv','∂','س'],
  [{t:'intindef',f:'س^{٢}',v:'س',d:'د'},'intindef','∫','د'],
  [{t:'intdef',a:'٠',b:'١',f:'\\sin س',v:'س',d:'د'},'intdef','∫','جا'],
  [{t:'intdef',a:'0',b:'1',f:'\\sin x',v:'x',d:'d'},'intdef','∫','sin'],
];
let passed=0;
for(const [p,type,...tokens] of examples){
 const tex=m.piecesToTex([p]);
 const html=m.texToHTML(tex,/[\p{Script=Arabic}]/u.test(tex)?'ar':'en');
 assert(!html.includes('math-error'),`Unrenderable ${type} ${tex}`);
 const back=m.parsePieces(tex);
 assert.equal(back.length,1,`Split template ${type}`);assert.equal(back[0].t,type,`Not roundtrip: ${type} ${JSON.stringify(back)}`);
 assert.equal(m.piecesToTex(back),tex,`Roundtrip formula changed: ${type}`);
 for(const t of tokens)assert(html.includes(t),`Missing ${t} in ${tex}`);
 passed++;
}
assert(m.texToHTML('\\frac{d}{dx}\\left(x^{2}\\right)','en').includes('class="mf"'));
assert(m.texToHTML('\\int_{٠}^{١}{س^{٢}}\\,دس','ar').includes('class="mint"'));
assert(m.texToHTML('\\int_{0}^{1}{\\sin x}\\,dx','en').includes('class="mfn"'));
const css=src('paper.css');
assert(/\.mx\{[^}]*font-weight:700/.test(css),'Math body not explicitly bold');
assert(/\.mint\{[^}]*font-weight:800/.test(css),'Integral symbol not bold');
assert(/@media print\{\.mx/.test(css),'Print math not pinned to dark');
assert(src('ui.js').includes("['التفاضل'") && src('ui.js').includes("['التكامل'") && src('ui.js').includes('eq-category-picker'),'Calculus editor shortcuts missing');
console.log(`V17 calculus checks: ${passed} examples round-tripped, parser, equation weight and print CSS PASS`);
