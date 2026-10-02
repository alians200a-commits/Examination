const fs=require('fs'),path=require('path'),assert=require('assert'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),report={checks:[],errors:[],cases:[]};
const ok=(n,v)=>{assert(v,n);report.checks.push(n);};
(async()=>{
 const local='/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell',executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(fs.existsSync(local)?local:undefined);
 const b=await chromium.launch({executablePath,args:['--no-sandbox']});try{
  const p=await b.newPage({viewport:{width:1280,height:950}});p.setDefaultTimeout(15000);p.on('pageerror',e=>report.errors.push(e.message));
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace('loadFont();renderAll();pushHist();',"window.__test={S,P,UI,commit,makeProject,normProject,kindTemplate,renderPaper};loadFont();renderAll();pushHist();");
  await p.route('**/*',r=>r.request().url().startsWith('file:')?r.fulfill({contentType:'text/html',body:html}):r.abort());
  await p.goto('file://'+path.join(root,'index.html'),{waitUntil:'commit'});await p.locator('[data-act=homeNew]').click();for(let i=0;i<3;i++)await p.locator('#wizard [data-act=wzNext]').click();
  await p.evaluate(()=>document.fonts.ready);
  for(const head of [true,false])for(const width of [390,1280]){
   await p.setViewportSize({width,height:950});
   const data=await p.evaluate(({head})=>{
    const t=__test,pr=t.makeProject('primary',true),q=t.kindTemplate('branches',false);pr.fit=false;
    q.prompt='قارن بين المفاهيم التالية';q.cols=1;q.label='l-dash';q.items=q.items.slice(0,1);
    q.items[0].text='اقرأ الجدول الطويل ثم أجب عن المطلوب.';q.items[0].answerLines=2;
    q.items[0].table={head,full:true,align:'right',rows:Array.from({length:30},(_,i)=>['رمز الصف '+i,'السطر الأول\nالسطر الثاني\nالسطر الثالث\nالسطر الرابع '+i])};
    const end=t.kindTemplate('text',false);end.prompt='نهاية الامتحان';end.items[0].text='نص بعد الجدول يجب ألا يسبق الصفوف';
    pr.questions=[q,end];t.S.active='primary';t.S.stages.primary=t.normProject(pr,'primary');t.UI.open=null;t.UI.view=innerWidth<1024?'preview':'questions';t.commit();
    return{q:q.id,x:q.items[0].id,head};
   },{head});
   const result=await p.evaluate(d=>{
    const tables=[...document.querySelectorAll(`[data-table="it.${d.q}.${d.x}"]`)];
    const rowIds=tables.flatMap(tb=>[...tb.querySelectorAll('tr')].map(r=>+r.dataset.tableRow));
    const bodyRows=d.head?rowIds.filter(i=>i!==0):rowIds;
    return{width:innerWidth,head:d.head,pages:document.querySelectorAll('.page').length,tables:tables.length,rowIds,bodyRows,tall:document.querySelectorAll('.too-tall').length,wide:document.querySelectorAll('.too-wide').length,prefixes:[...document.querySelectorAll(`[data-k="it.${d.q}.${d.x}.text"]`)].length,answers:document.querySelectorAll('.answer-lines').length,headers:document.querySelectorAll('.ph').length,footers:document.querySelectorAll('.pf').length,continuations:document.querySelectorAll('.qcontinue').length};
   },data);
   report.cases.push(result);
   ok(`long ${head?'headed':'unheaded'} table splits at ${width}`,result.tables>1&&result.pages>1);
   ok(`rows are preserved in order at ${width} (${head})`,JSON.stringify(result.bodyRows)===JSON.stringify(Array.from({length:head?29:30},(_,i)=>i+(head?1:0))));
   ok(`repeat header count at ${width} (${head})`,!head||result.rowIds.filter(i=>i===0).length===result.tables);
   ok(`branch prefix and answer space appear only once at ${width} (${head})`,result.prefixes===1&&result.answers===1);
   ok(`no clipping after table split at ${width} (${head})`,result.tall===0&&result.wide===0);
   ok(`exam header/footer remain single at ${width} (${head})`,result.headers===1&&result.footers===1);
   const path=`it.${data.q}.${data.x}.cell.20.1`;
   await p.locator(`[data-k="${path}"]`).fill('خلية معدلة بعد التقسيم');
   await p.locator(`[data-k="${path}"]`).evaluate(el=>el.blur());
   await p.waitForTimeout(100);
   const edited=await p.evaluate(()=>__test.P().questions[0].items[0].table.rows[20][1]);
   ok(`continued cell keeps original data path at ${width} (${head})`,edited==='خلية معدلة بعد التقسيم');
  }
  await p.setViewportSize({width:1280,height:950});
  await p.pdf({path:path.join(root,'tests','long-table.pdf'),preferCSSPageSize:true,printBackground:true});
  // A single unbreakable row cannot safely split: it must still warn.
  await p.evaluate(()=>{const q=__test.P().questions[0];q.items[0].table.rows=[['عنوان','عنوان'],['صف مفرد ضخم','سطر\n'.repeat(90)]];q.items[0].table.head=true;__test.commit();});
  ok('single row larger than a page is flagged, not silently cut',await p.locator('#pages .too-tall').count()>0);
  await p.evaluate(()=>{const t=__test,pr=t.makeProject('primary',true),q=t.kindTemplate('math',false);q.cols=3;q.items[0].text='$x+x+x+x+x+x+x+x+x+x+x+x+x+x+x+x=0$';q.items[1].text='نص الجار';pr.questions=[q];pr.fit=false;t.S.stages.primary=t.normProject(pr,'primary');t.commit();});
  ok('math overflowing its own column is detected before PDF',await p.locator('#pages .too-wide').count()>0);
  ok('pagination has no uncaught errors',report.errors.length===0);
 }catch(e){report.failure=e.stack;throw e;}finally{fs.writeFileSync(path.join(root,'tests/pagination-results.json'),JSON.stringify(report,null,2));await b.close();console.log(JSON.stringify(report,null,2));}
})();
