// يجمع ملفات المصدر في ملف HTML واحد يعمل بلا خادم: node build.js
const fs=require('fs'),path=require('path');const d=__dirname,src=f=>fs.readFileSync(path.join(d,'src',f),'utf8');
const js=src('core.js').replace('/*MATH*/',()=>src('math.js'))+'\n'+src('render.js')+'\n'+src('ui.js');
const fontSpecs=[
 ['Cairo','cairo', '200 900','normal'],['Noto Sans Arabic','arabic','100 900','normal'],
 ['Noto Naskh Arabic','naskh','400 700','normal'],['Amiri','amiri','400','normal'],['Amiri','amiri-bold','700','normal'],
 ['Tinos','times','400','normal'],['Tinos','times-italic','400','italic'],['Tinos','times-bold','700','normal'],
 ['STIX Two Math','math','400','normal']
];
const fonts=fontSpecs.map(([family,file,weight,style])=>`@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};font-display:swap;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(d,'fonts',file+'.woff2')).toString('base64')}) format('woff2')}`).join('\n');
const html=src('shell_head.html').replace('/* EMBEDDED_FONTS */',()=>fonts)+src('paper.css')+src('shell_body.html')+js+'\n</script>\n</body>\n</html>\n';
fs.writeFileSync(path.join(d,'index.html'),html);fs.writeFileSync(path.join(d,'app.js'),js);
console.log('index.html',Math.round(html.length/1024)+' KB');
