// V16: complete teacher flow, independent definition fields, numbering and PDF parity.
const {chromium}=require('playwright');
const {readFileSync,writeFileSync,existsSync}=require('node:fs');
const {join}=require('node:path');
const {execFileSync}=require('node:child_process');
const assert=require('node:assert/strict');
const root=join(__dirname,'..'),source=readFileSync(join(root,'index.html'),'utf8');
const needle='loadFont();renderAll();pushHist();';
assert(source.includes(needle),'Test instrumentation anchor missing');
const html=source.replace(needle,'window.__v16test={P,UI,commit,examStats};'+needle);
const checks=[];
function ok(label,condition){assert(condition,label);checks.push(label)}
function pdfPages(file){return Number(execFileSync('pdfinfo',[file],{encoding:'utf8'}).match(/^Pages:\s+(\d+)/m)?.[1]||0)}
(async()=>{
 const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH|| (existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
 const browser=await chromium.launch({...(executablePath?{executablePath}:{}),args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});page.setDefaultTimeout(16000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.evaluate(()=>{const values={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>values[k]??null,setItem:(k,v)=>values[k]=String(v),removeItem:k=>delete values[k]}})});
  await page.setContent(html,{waitUntil:'load',timeout:90000});
  await page.locator('[data-act=homeNew]').click();
  for(let i=0;i<3;i++)await page.locator('#wizard [data-act=wzNext]').click();
  ok('3-stage mobile navigation',await page.locator('.nav [data-act=view]').count()===3);
  await page.locator('[data-kind=definitions]').click();
  ok('one field per new definition',await page.locator('.qc.open .def-entry').count()===1);
  for(const [index,label] of ['التكاثر الخضري','العمود الفقري','الفسيلة','التطعيم','غلاف البذرة','الجهاز العصبي'].entries()){
   if(index)await page.locator('.qc.open [data-act=addItem]').click();
   await page.locator('.qc.open .def-entry .definition-input').nth(index).fill(label);
   await page.locator('.qc.open .def-entry .definition-input').nth(index).blur();
  }
  await page.waitForTimeout(250);
  ok('six independently editable definition fields',await page.locator('.qc.open .def-entry').count()===6);
  ok('6 printed definition cells',await page.locator('#pages .qbody.boxed .ir').count()===6);
  ok('definitions auto arrange into three columns',(await page.locator('#pages .qbody.boxed').first().getAttribute('style')||'').includes('--cols:3'));
  ok('canonical Arabic question label',(await page.locator('#pages .qn').first().textContent()).trim()==='س:١)');
  await page.locator('.qc.open [data-act=addItem]').click();await page.waitForTimeout(200);
  ok('empty term triggers a clear warning',await page.locator('.content-audit').count()===1);
  await page.locator('.qc.open .def-entry .definition-input').last().fill('السرعة');
  await page.locator('.qc.open .def-entry .definition-input').last().blur();await page.waitForTimeout(260);
  ok('warning clears when completed',await page.locator('.content-audit').count()===0);
  await page.locator('[data-act=adding]').first().click();await page.locator('[data-kind=branches]').first().click();
  await page.locator('.qc.open [data-r^="q."][data-r$=".prompt"]').fill('س:٢) أجب عن الفرع الآتي');
  await page.locator('.qc.open [data-r^="it."][data-r$=".text"]').first().fill('س:٢- أ) فسّر الظاهرة');
  await page.locator('.qc.open [data-r^="it."][data-r$=".text"]').first().blur();await page.waitForTimeout(270);
  ok('manual question number does not double',(await page.locator('#pages .qh').last().textContent()).match(/س:٢\)/g)?.length===1);
  ok('Arabic branch full label',(await page.locator('#pages .qb').last().locator('.ir .il').first().textContent()).trim()==='س:٢- أ)');
  await page.locator('.nav [data-v=preview]').click();await page.waitForTimeout(250);
  const pdf=join(root,'tests','v16-printed.pdf');await page.pdf({path:pdf,printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
  ok('real PDF pages equal preview pages',pdfPages(pdf)===await page.locator('#pages .page').count());
  await page.screenshot({path:join(root,'tests','v16-mobile-preview.png'),fullPage:true});
  await page.locator('.nav [data-v=questions]').click();await page.waitForTimeout(320);
  await page.screenshot({path:join(root,'tests','v16-mobile-editor.png'),fullPage:true});
  await page.evaluate(()=>{const p=__v16test.P();p.meta.subject='اللغة الإنكليزية';p.dir='ltr';p.digits='latin';__v16test.commit()});
  ok('Latin digit question label',(await page.locator('#pages .qn').first().textContent()).trim()==='س:1)');
  ok('Latin branch full label',(await page.locator('#pages .qb').last().locator('.ir .il').first().textContent()).trim()==='س:2- A)');
  await page.locator('[data-act=adding]').first().click();await page.locator('[data-kind=text]').first().click();
  await page.locator('.qc.open [data-r^="it."][data-r$=".text"]').first().fill('س:3) Solve\nA) Compute');
  await page.locator('.qc.open [data-act=convertFree]').click();await page.waitForTimeout(270);
  ok('manual free text becomes numbered question',(await page.locator('#pages .qn').last().textContent()).trim()==='س:3)');
  ok('manually pasted A) is normalized',(await page.locator('#pages .qb').last().locator('.ir .il').first().textContent()).trim()==='س:3- A)');
  ok('mobile page has no horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  ok('no JavaScript exceptions',errors.length===0);
  const report={passed:checks.length,checks,pdf_pages:pdfPages(pdf),errors};
  writeFileSync(join(root,'tests','v16-regression-results.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
 }catch(e){console.error('V16 REGRESSION FAILED',e.stack,errors);throw e}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
