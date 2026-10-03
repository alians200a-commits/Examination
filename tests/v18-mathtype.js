const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const src = f => fs.readFileSync(path.join(__dirname,'..','src',f),'utf8');
const m = new Function(src('core.js').replace("(()=>{'use strict';",'').replace('/*MATH*/',()=>src('math.js'))+'\nreturn {texToHTML,parsePieces,piecesToTex,texProblem};')();
const cases=[
 [{t:'matrix',r:'2',c:'2',style:'p',cells:['س','١','٠','ص']},'ar','mmat-p'],
 [{t:'matrix',r:'3',c:'3',style:'b',cells:['1','2','3','4','5','6','7','8','9']},'en','mmat-b'],
 [{t:'det',r:'3',c:'3',style:'v',cells:['a','b','c','d','e','f','g','h','i']},'en','mmat-v'],
 [{t:'cases',n:'2',lines:[['س^{٢}','س>٠'],['-س','س≤٠']]},'ar','mcases'],
 [{t:'aligned',n:'3',lines:[['a+b','=c'],['x+y','=z'],['u+v','=w']]},'en','maligned'],
 [{t:'binom',a:'ن',b:'ك'},'ar','mbinom'],
 [{t:'derivn',d:'د',n:'٣',v:'س',f:'س^{٣}+س'},'ar','mf'],
 [{t:'partialn',n:'٢',v:'س',f:'س^{٢}+ص'},'ar','mf'],
 [{t:'iint',a:'د',b:'',f:'س+ص',d:'د',v:'أ'},'ar','mint'],
 [{t:'iiint',a:'V',b:'',f:'x+y+z',d:'d',v:'V'},'en','mint'],
 [{t:'oint',a:'C',b:'',f:'x^{2}',d:'d',v:'x'},'en','mint'],
 [{t:'limsup',v:'n',a:'\\infty',x:'x_{n}'},'en','mlim'],
 [{t:'liminf',v:'ن',a:'\\infty',x:'س_{ن}'},'ar','mlim'],
 [{t:'prod',a:'k=1',b:'n',x:'k'},'en','mbig'],
 [{t:'overbrace',x:'a+b',l:'n'},'en','mbrace-over'],
 [{t:'underbrace',x:'س+ص',l:'ن'},'ar','mbrace-under']
];
for(const [value,lang,selector] of cases){
 const tex=m.piecesToTex([value]);
 assert.equal(m.texProblem(tex),'','Invalid expression '+tex);
 const result=m.texToHTML(tex,lang);
 assert(result.includes(selector),'Missing '+selector+' for '+tex);
 assert(!result.includes('math-error'),'Rendering failed '+tex);
 const parsed=m.parsePieces(tex);
 assert.equal(parsed.length,1,'Parse failed '+tex);
 assert.equal(parsed[0].t,value.t,'Wrong template '+tex);
 assert.equal(m.piecesToTex(parsed),tex,'Round-trip mismatch '+tex);
}
assert(m.texProblem('\\frac{س}{٠}'),'Zero denominator must be rejected');
const invalid=m.texToHTML('\\mat{2}{2}{p}{a}','ar');
assert(invalid.includes('math-error')||invalid.includes('m-gap'),'Incomplete matrix silently accepted');
const head=src('shell_head.html'),sheet=src('paper.css'),ui=src('ui.js');
for(const selector of ['eq-cat-tabs','eq-template-grid','eq-matrix-fields','eq-multiline','eqApplyTex'])assert((ui+head).includes(selector),'Missing palette '+selector);
for(const selector of ['mmat-grid','mcases','maligned','mbinom','mbrace'])assert(sheet.includes(selector),'Missing print style '+selector);
console.log('v18 PASS: '+cases.length+' reversible templates, invalid-input protection, dark print styles');
