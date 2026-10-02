const fs=require('fs'),path=require('path'),assert=require('assert'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),report={checks:[],errors:[]};
const ok=(n,v)=>{assert(v,n);report.checks.push(n);};
(async()=>{
 const local='/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell';
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(fs.existsSync(local)?local:undefined),args:['--no-sandbox']});
 try{
  const context=await b.newContext({viewport:{width:390,height:844},hasTouch:true});
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('loadFont();renderAll();pushHist();',"window.__test={S,P,UI,commit};loadFont();renderAll();pushHist();");
  await context.route('**/*',r=>r.request().url().startsWith('file:')?r.fulfill({contentType:'text/html',body:html}):r.abort());
  const p=await context.newPage();p.setDefaultTimeout(10000);p.on('pageerror',e=>report.errors.push(e.message));
  await p.goto('file://'+path.join(root,'index.html'),{waitUntil:'commit'});
  await p.locator('[data-act=homeNew]').tap();for(let i=0;i<3;i++)await p.locator('[data-act=wzNext]').tap();
  await p.locator('[data-act=addQ][data-kind=text]').tap();
  const pathId=await p.evaluate(()=>{const q=__test.P().questions[0];return`it.${q.id}.${q.items[0].id}.text`;});
  await p.locator(`#sideBody [data-r="${pathId}"]`).fill('مشروعي الأصلي لا يتغير');await p.waitForTimeout(600);
  await p.locator('details.menu summary').tap();await p.locator('[data-act=home]').tap();
  const pages=context.pages().length;
  await p.locator('.welcome-hero [data-act=demo]').tap();
  ok('learn button opens immediately within same tab',context.pages().length===pages&&!await p.locator('#welcome').isVisible()&&await p.locator('#lessonBar').isVisible());
  ok('tutorial has sample exam',await p.evaluate(()=>__test.P().questions.length===5));
  await p.locator('[data-act=lessonNext]').tap();
  const q=await p.evaluate(()=>__test.P().questions[0].id);await p.locator(`#sideBody [data-r="q.${q}.prompt"]`).fill('تعديل في التعليم');
  await p.waitForTimeout(700);
  ok('tutorial edits never overwrite actual local save',await p.evaluate(()=>JSON.parse(localStorage.getItem('almufeed-exam-v13')).stages.primary.questions[0].items[0].text==='مشروعي الأصلي لا يتغير'));
  await p.locator('#lessonBar [data-act=home]').tap();
  ok('returning restores actual project and history',await p.evaluate(()=>__test.P().questions.length===1&&__test.P().questions[0].items[0].text==='مشروعي الأصلي لا يتغير'));
  await p.locator('.welcome-hero [data-act=demo]').tap();await p.locator('[data-act=lessonNext]').tap();
  ok('same-session tutorial retains learner changes',await p.evaluate(()=>__test.P().questions[0].prompt==='تعديل في التعليم'));
  await p.locator('#lessonBar [data-act=home]').tap();
  await p.locator('[data-act=homeOpen]').tap();
  ok('open project reveals native file selection and file-type instructions',await p.locator('#homeFileIn').isVisible()&&await p.locator('#filePanel').textContent().then(t=>t.includes('JSON')));
  const chooserPromise=p.waitForEvent('filechooser');await p.locator('#homeFileIn').tap();const chooser=await chooserPromise;
  const obj=await p.evaluate(()=>({app:'almufeed-exam',version:13,stage:'primary',project:__test.P()}));obj.project.questions[0].items[0].text='المحتوى المستورد';
  await chooser.setFiles({name:'exam-project.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(obj))});
  await p.waitForFunction(()=>__test.P().questions[0]?.items[0]?.text==='المحتوى المستورد');
  ok('native file chooser opens actual project end to end',!await p.locator('#welcome').isVisible());
  await p.locator('details.menu summary').tap();await p.locator('[data-act=home]').tap();await p.locator('[data-act=homeOpen]').tap();
  await p.locator('#homeFileIn').setInputFiles({name:'wrong.json',mimeType:'application/json',buffer:Buffer.from('not json')});
  await p.waitForFunction(()=>document.querySelector('#fileFeedback').textContent.includes('JSON محفوظ'));
  ok('invalid file has persistent visible message and preserves existing project',await p.evaluate(()=>__test.P().questions[0].items[0].text==='المحتوى المستورد'));
  for(const width of [360,390,768,1280]){await p.setViewportSize({width,height:950});await p.locator('#welcome').evaluate(e=>e.scrollTop=0);await p.waitForTimeout(150);ok(`welcome no overflow at ${width}`,await p.evaluate(()=>document.querySelector('#welcome').scrollWidth<=innerWidth));}
  await p.locator('#filePanel').evaluate(e=>e.hidden=true);await p.locator('#toast').evaluate(e=>e.hidden=true);
  await p.locator('#welcome').evaluate(e=>e.scrollTop=0);await p.evaluate(()=>document.fonts.ready);
  await p.screenshot({path:path.join(root,'tests','home-desktop.png')});
  await p.setViewportSize({width:390,height:844});await p.waitForTimeout(300);await p.screenshot({path:path.join(root,'tests','home-mobile.png')});
  ok('no runtime errors in entry workflow',report.errors.length===0);
 }catch(e){report.failure=e.stack;throw e;}finally{fs.writeFileSync(path.join(root,'tests/entry-results.json'),JSON.stringify(report,null,2));await b.close();console.log(JSON.stringify(report,null,2));}
})();
