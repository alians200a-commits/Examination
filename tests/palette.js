// Reject saturated green and olive colors in all interface and printed-paper CSS.
const fs=require('node:fs'),assert=require('node:assert/strict');
const files=['src/shell_head.html','src/workspace.css','src/paper.css'],issues=[];
function audit(name,content){
  const css=content.replace(/\/\*[\s\S]*?\*\//g,'');
  const disallowed=h=>h>=85&&h<=200;
  for(const hit of css.matchAll(/#[a-f\d]{6}\b/gi)){
    const hex=hit[0].slice(1),[r,g,b]=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255);
    const mx=Math.max(r,g,b),mn=Math.min(r,g,b),delta=mx-mn;
    if(mx<.15||delta<.00001)continue;
    let hue=mx===r?((g-b)/delta)%6:mx===g?(b-r)/delta+2:(r-g)/delta+4;
    hue=(hue*60+360)%360;
    if(disallowed(hue)&&delta/mx>=.18)issues.push(name+': '+hit[0]+' ('+Math.round(hue)+'°)');
  }
  for(const hit of css.matchAll(/oklch\(\s*[.\d]+\s+([.\d]+)\s+([.\d]+)/g)){
    if(Number(hit[1])>=.018&&disallowed(Number(hit[2])))issues.push(name+': '+hit[0]);
  }
}
for(const name of files)audit(name,fs.readFileSync(name,'utf8'));
assert.deepEqual(issues,[],'Forbidden green / olive CSS values:\n'+issues.join('\n'));
const p=fs.readFileSync('src/paper.css','utf8');
for(const token of ['--p:#293D68','--soft:#F1F4FA','--score:#823B4C','--score-bg:#FBECEF','--choice:#2C648A'])
  assert(p.includes(token),'Reference-paper color missing: '+token);
assert(fs.readFileSync('src/workspace.css','utf8').includes('--ok:#456B9D'),'Saved status must be blue');
assert(fs.readFileSync('src/core.js','utf8').includes("teal:{label:'أزرق فولاذي'}"),'Steel-blue label missing');
console.log('PASS: no green or near-green UI colors; reference paper palette intact.');
