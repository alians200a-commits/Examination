const fs=require('fs'),path=require('path'),assert=require('assert'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
(async()=>{
 const local='/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
 const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(fs.existsSync(local)?local:undefined);
 const b=await chromium.launch({executablePath,args:['--no-sandbox']});
 const report={templates:[],errors:[],math:{}};try{
  const p=await b.newPage({viewport:{width:1280,height:950}});p.setDefaultTimeout(10000);
  p.on('pageerror',e=>report.errors.push(e.message));
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('loadFont();renderAll();pushHist();',"window.__test={S,P,UI,commit,makeProject,normProject,starter,STAGES,subjectsFor,kindTemplate,texToHTML,renderPaper};loadFont();renderAll();pushHist();");
  await p.route('**/*',r=>r.request().url().startsWith('file:')?r.fulfill({contentType:'text/html',body:html}):r.abort());
  await p.goto('file://'+path.join(root,'index.html'),{waitUntil:'commit'});
  await p.locator('[data-act=homeNew]').click();
  await p.locator('#wizard [data-act=wzNext]').click();await p.locator('#wizard [data-act=wzNext]').click();await p.locator('#wizard [data-act=wzNext]').click();
  await p.evaluate(()=>document.fonts.ready);
  const positions=await p.evaluate(()=>{const ph=document.querySelector('.ph').getBoundingClientRect(),yr=document.querySelector('.hm .yr').getBoundingClientRect(),grade=document.querySelector('.hlft .grade').getBoundingClientRect();return{center:Math.abs((yr.left+yr.right)/2-(ph.left+ph.right)/2),gradeLeft:grade.right<(ph.left+ph.right)/2,yearCopies:document.querySelectorAll('.ph [data-k="meta.year"]').length,gradeCopies:document.querySelectorAll('.ph [data-k="meta.subtitle"]').length};});
  assert(positions.center<3&&positions.gradeLeft&&positions.yearCopies===1&&positions.gradeCopies===1,'year must be centered and grade on physical left');
  report.header=positions;
  const cases=await p.evaluate(()=>{const out=[];for(const [st,v] of Object.entries(__test.STAGES))for(const grade of v.grades)for(const subject of __test.subjectsFor(st,grade))out.push({st,grade,subject});return out;});
  for(const c of cases){
   const r=await p.evaluate(c=>{const t=__test,pr=t.makeProject(c.st,true);pr.meta.grade=c.grade;pr.meta.subject=c.subject;pr.questions=t.starter(c.st,c.grade,c.subject);t.S.active=c.st;t.S.stages[c.st]=t.normProject(pr,c.st);t.UI.open=null;t.commit();return{...c,pages:document.querySelectorAll('.page').length,tall:document.querySelectorAll('.too-tall').length,wide:document.querySelectorAll('.too-wide').length};},c);
   report.templates.push(r);
  }
  assert(report.templates.every(r=>!r.tall&&!r.wide),'starter template overflows');
  await p.evaluate(()=>{const t=__test;t.S.active='primary';const p=t.makeProject('primary',true);p.meta.subject='الرياضيات';const q=t.kindTemplate('math',false);q.cols=1;q.items[0].text='جد ناتج القسمة $$\\longdiv{٨٤}{٤}{}{0}$$ ثم حلّل الناتج إلى عوامله الأولية.';q.items[1].text='بسّط $$\\sqrt[3]{٢٧}+\\sqrt[4]{١٦}$$ ثم أوجد $$س^{٢}+٢س-٣=٠$$ .';p.questions=[q];const h=t.kindTemplate('math',false);h.prompt='المعادلات الفيزيائية والكيميائية';h.cols=1;h.items[0].text='إذا كانت $\\vec{F}=m\\vec{a}$ و $m=5\\,\\text{kg}$ فأوجد مقدار القوة.';h.items[1].text='وازن التفاعل $\\ce{H2 + O2 ->[Δ] H2O}$ ثم اكتب شحنة $\\ce{SO4^{2-}}$ ورمز النظير $\\isotope{14}{6}{C}$ .';p.questions.push(h);t.S.stages.primary=t.normProject(p,'primary');t.commit();});
  report.math=await p.evaluate(()=>({tall:document.querySelectorAll('.too-tall').length,wide:document.querySelectorAll('.too-wide').length,chips:document.querySelectorAll('#pages .eqc').length,roots:document.querySelectorAll('#pages .mr-i').length}));
  assert(report.math.tall===0&&report.math.wide===0,'inline math overflows');
  await p.locator('.page').screenshot({path:path.join(root,'tests','math-paper.png')});
  await p.setViewportSize({width:390,height:844});
  await p.locator('.nav [data-v=questions]').click();
  await p.locator('.qc-h').first().click();
  await p.waitForTimeout(400);
  await p.screenshot({path:path.join(root,'tests','mobile-editor.png')});
  await p.locator('.nav [data-v=write]').click();
  await p.screenshot({path:path.join(root,'tests','mobile-preview.png')});
  assert(report.errors.length===0,'uncaught browser error');
 }catch(e){report.failure=e.message;throw e;}finally{
  fs.writeFileSync(path.join(root,'tests','layout-results.json'),JSON.stringify(report,null,2));await b.close();
  console.log('templates checked:',report.templates.length,'failures:',report.templates.filter(x=>x.tall||x.wide));console.log('inline math:',report.math);
 }
})();
