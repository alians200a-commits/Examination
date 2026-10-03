/* Standalone Chromium PDF and MathType-style editor regression; runs in GitHub Actions. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const checks=[];
function check(label,condition){assert.ok(condition,label);checks.push(label);}
async function start(page){
 await page.evaluate(()=>{const store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]}})});
 await page.setContent(html,{waitUntil:'load',timeout:90000});
 await page.locator('[data-act=homeNew]').click();for(let i=0;i<3;i++)await page.locator('#wizard [data-act=wzNext]').click();
 await page.locator('[data-kind=math]').first().click();await page.locator('.qc.open [data-act=eq]').first().click();
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()),args:['--no-sandbox','--disable-dev-shm-usage']});
 const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:1});
 const errors=[];mobile.on('pageerror',err=>errors.push(err.message));
 try{
  await start(mobile);
  check('separate template categories',await mobile.locator('#eqdlg .eq-cat-tabs [role=tab]').count()>=18);
  await mobile.locator('#eqdlg [data-eq-cat-select]').selectOption('المصفوفات والمحددات');
  await mobile.locator('#eqdlg .eq-template-tile[data-t=matrix]').click();
  await mobile.locator('#eqdlg [data-eq-dim=r]').selectOption('3');
  await mobile.locator('#eqdlg [data-eq-dim=c]').selectOption('3');
  check('editable 3x3 matrix',await mobile.locator('#eqdlg [data-eq-cell]').count()===9);
  for(let i=0;i<9;i++)await mobile.locator(`#eqdlg [data-eq-cell="${i}"]`).fill(String(i+1));
  check('Arabic matrix input digits',await mobile.locator('#eqdlg [data-eq-cell="0"]').inputValue()==='١');
  check('nine preview cells',await mobile.locator('#eqdlg .eqprev .mmat-cell').count()===9);
  await mobile.locator('#eqdlg [data-path=eqlang][data-v=en]').click();
  check('English switch preserves 3x3 dimensions',await mobile.locator('#eqdlg [data-eq-cell]').count()===9);
  await mobile.locator('#eqdlg [data-path=eqlang][data-v=ar]').click();
  check('Arabic switch preserves 3x3 dimensions',await mobile.locator('#eqdlg [data-eq-cell]').count()===9);
  await mobile.locator('#eqdlg').screenshot({path:path.join(root,'tests/v18-mathtype-mobile.png')});
  await mobile.locator('#eqdlg [data-act=eqOk]').click();
  check('matrix in A4 page',await mobile.locator('#pages .mmat-cell').count()===9);
  await mobile.locator('.qc.open [data-act=addEqItem]').first().click();
  await mobile.locator('#eqdlg [data-eq-cat-select]').selectOption('أنظمة المعادلات');
  await mobile.locator('#eqdlg .eq-template-tile[data-t=cases]').click();
  check('two editable cases',await mobile.locator('#eqdlg [data-eq-line]').count()===4);
  await mobile.locator('#eqdlg [data-act=eqOk]').click();
  check('cases are vertically typeset',await mobile.locator('#pages .mcases-row').count()===2);
  await mobile.locator('.qc.open [data-act=addEqItem]').first().click();
  await mobile.locator('#eqdlg [data-eq-cat-select]').selectOption('التكامل');
  await mobile.locator('#eqdlg .eq-template-tile[data-t=iint]').click();
  await mobile.locator('#eqdlg [data-act=eqOk]').click();
  check('double integral rendered',await mobile.locator('#pages .mint').allTextContents().then(x=>x.join('').includes('∬')));
  await mobile.locator('.nav [data-v=preview]').click();await mobile.waitForTimeout(380);
  await mobile.screenshot({path:path.join(root,'tests/v18-mathtype-preview.png'),fullPage:true});
  const previewPages=await mobile.locator('#pages .page').count();
  const pdf=path.join(root,'tests/v18-mathtype-print.pdf');
  await mobile.pdf({path:pdf,printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
  const pdfPages=Number((execFileSync('pdfinfo',[pdf]).toString().match(/^Pages:\s+(\d+)/m)||[])[1]);
  check('PDF count equals preview',pdfPages===previewPages);
  const weight=await mobile.locator('#pages .mx').first().evaluate(el=>Number(getComputedStyle(el).fontWeight));
  check('mathematics are bold',weight>=700);
  check('no JavaScript errors',errors.length===0);
  check('no mobile document overflow',await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const desktop=await browser.newPage({viewport:{width:1440,height:900}});await start(desktop);
  await desktop.locator('#eqdlg [data-act=eqCategory][data-cat="المصفوفات والمحددات"]').click();
  check('desktop template gallery',await desktop.locator('#eqdlg .eq-template-tile').count()>=2);
  await desktop.locator('#eqdlg').screenshot({path:path.join(root,'tests/v18-mathtype-desktop.png')});
  const result={checks:checks.length,previewPages,pdfPages,weight,errors};
  fs.writeFileSync(path.join(root,'tests/v18-mathtype-browser-results.json'),JSON.stringify(result,null,2));
  console.log('V18 browser/PDF PASS',result);
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1});
