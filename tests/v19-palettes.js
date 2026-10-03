const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');const src=f=>fs.readFileSync(path.join(root,'src',f),'utf8');
const code=src('core.js').replace("(()=>{'use strict';",'').replace('/*MATH*/',()=>src('math.js'));
const math=new Function(code+'\nreturn {texToHTML,parsePieces,piecesToTex,texProblem};')();
const ui=src('ui.js');const registry=ui.slice(ui.indexOf('const EQG='),ui.indexOf('const EQT={'));
const {EQG,TRIG_PALETTE,EQ_PRESETS,EQ_QUICK_SYMBOLS}=new Function(registry+'\nreturn {EQG,TRIG_PALETTE,EQ_PRESETS,EQ_QUICK_SYMBOLS};')();
assert(EQG.length>=17,'Expected separate MathType-style categories');
assert(EQG.some(([k])=>k==='الكسور')&&EQG.some(([k])=>k==='الأسس والأدلة'),'Fractions and powers must be separate');
assert(EQG.some(([k])=>k==='الكيمياء')&&EQG.some(([k])=>k==='الفيزياء'),'Science categories missing');
assert(EQG.some(([k])=>k==='الحروف اليونانية'),'Greek palette missing');
for(const [fn] of TRIG_PALETTE){
 const tex=math.piecesToTex([{t:'trig',fn,x:'\\theta',e:''}]);
 assert(!math.texProblem(tex)&&!math.texToHTML(tex,'en').includes('math-error'),`Function ${fn} invalid: ${tex}`);
 const back=math.parsePieces(tex);assert(back[0].t==='trig'&&back[0].fn===fn,`Function ${fn} not editable after reload`);
}
assert(TRIG_PALETTE.some(([fn])=>fn==='cos'));
for(const [cat,symbols] of Object.entries(EQ_QUICK_SYMBOLS)){
 for(const [display,tex] of symbols){
  if(cat==='الكيمياء' && [' -> ',' <=> ','(s)','(l)','(g)','(aq)'].includes(tex))continue; // chemical source input, not generic LaTeX
  const h=math.texToHTML(tex,'en');assert(!h.includes('math-error'),`${cat} symbol ${display} unsupported: ${tex}`);
 }
}
let n=0;
for(const [id,[label,t,sample]] of Object.entries(EQ_PRESETS)){
 const tex=math.piecesToTex([{t,...sample}]);assert(tex,`Preset ${id} empty`);
 const h=math.texToHTML(tex,id.startsWith('chem')?'en':'ar');
 assert(!h.includes('math-error'),`Preset ${id} invalid: ${tex}`);
 assert(!math.texProblem(tex),`Preset ${id} bracket issue: ${tex}`);
 const back=math.parsePieces(tex);assert(back.length>0&&math.piecesToTex(back).replace(/\s+/g,'')===tex.replace(/\s+/g,''),`Preset ${id} not stable after save`);
 n++;
}
assert(ui.includes('data-act="eqPaletteSymbol"')&&ui.includes('data-fn="${fn}"'),'One-click insertion missing');
const head=src('shell_head.html');assert(head.includes('eq-symbol-tile')&&head.includes('eq-more-symbols'));
console.log(`V19 PASS: ${EQG.length} separate sections, ${TRIG_PALETTE.length} trigonometric buttons, ${Object.values(EQ_QUICK_SYMBOLS).reduce((a,v)=>a+v.length,0)} symbol buttons, ${n} physics/chemistry presets`);
