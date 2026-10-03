const fs=require('node:fs'),assert=require('node:assert/strict');
const files=['src/shell_head.html','src/workspace.css','src/paper.css','src/ui.js','src/render.js','src/core.js'];
const failures=[];
for(const file of files){
 const css=fs.readFileSync(file,'utf8').replace(/\/\*[\s\S]*?\*\//g,'');
 for(const hit of css.matchAll(/#[0-9a-f]{6}\b/gi)){
  const s=hit[0].slice(1);const [r,g,b]=[0,2,4].map(i=>parseInt(s.slice(i,i+2),16)/255);
  const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  if(!d||max<.19||d/max<.12)continue;
  let h=(max===r?(g-b)/d%6:max===g?(b-r)/d+2:(r-g)/d+4)*60;
  h=(h+360)%360;
  if(h>=38&&h<210)failures.push(file+': '+hit[0]);
 }
 for(const x of css.matchAll(/oklch\(\s*[.\d]+\s+([.\d]+)\s+([.\d]+)/g))
  if(Number(x[1])>=.018&&Number(x[2])>=80&&Number(x[2])<210)failures.push(file+': '+x[0]);
}
assert.deepEqual(failures,[],'Forbidden green/olive/petrol colors');
const core=fs.readFileSync('src/core.js','utf8'),paper=fs.readFileSync('src/paper.css','utf8'),workspace=fs.readFileSync('src/workspace.css','utf8');
assert(core.includes("steel:{label:'أزرق فولاذي'}"));
assert(core.includes("p.theme==='teal'?'steel':p.theme"));
assert(!paper.includes('.th-teal'));
for(const theme of ['source','sky','steel','gray','ink'])assert(paper.includes('.th-'+theme));
assert(paper.includes('--score-bg:#FBECEF'));
assert(workspace.includes('--ok:#456B9D'));
console.log('PASS strict no green/olive/petrol in UI or exam sheet');
