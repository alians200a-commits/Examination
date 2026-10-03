const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const passed=[];
function check(label,condition){assert.ok(condition,label);passed.push(label);}
async function start(page){
 await page.evaluate(()=>{const store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store[k]??null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]}})});
 await page.setContent(html,{waitUntil:'load',timeout:90000});
 await page.locator('[data-act=homeNew]').click();
 for(let i=0;i<3;i++)await page.locator('#wizard [data-act=wzNext]').click();
 await page.locator('[data-kind=math]').first().click();
 await page.locator('.qc.open [data-act=eq]').first().click();
}
(async()=>{
 const binary=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH|| (fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath());
 const browser=await chromium.launch({headless:true,executablePath:binary,args:['--no-sandbox','--disable-dev-shm-usage']});
 const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:1});
 const errors=[];mobile.on('pageerror',e=>errors.push(e.message));
 try{
  await start(mobile);
  check('seven category tabs',await mobile.locator('#eqdlg .eq-cat-tabs [role=tab]').count()===7);
  await mobile.locator('#eqdlg [data-act=eqCategory][data-cat="المصفوفات والأنظمة"]').click();
  await mobile.locator('#eqdlg .eq-template-tile[data-t=matrix]').click();
  await mobile.locator('#eqdlg [data-eq-dim=r]').selectOption('3');
  await mobile.locator('#eqdlg [data-eq-dim=c]').selectOption('3');
  check('3x3 grid input',await mobile.locator('#eqdlg [data-eq-cell]').count()===9);
  for(let i=0;i<9;i++)await mobile.locator('#eqdlg [data-eq-cell="'+i+'"]').fill(String(i+1));
  check('Arabic digits while editing',await mobile.locator('#eqdlg [data-eq-cell="0"]').inputValue()==='١');
  check('nine preview cells',await mobile.locator('#eqdlg .eqprev .mmat-cell').count()===9);
  await mobile.locator('#eqdlg [data-path=eqlang][data-v=en]').click();
  check('English switch keeps all cells',await mobile.locator('#eqdlg [data-eq-cell]').count()===9);
  await mobile.locator('#eqdlg [data-path=eqlang][data-v=ar]').click();
  check('Arabic switch keeps all cells',await mobile.locator('#eqdlg [data-eq-cell]').count()===9);
  await mobile.locator('#eqdlg [data-act=eqOk]').click();
  check('matrix printed on A4',await mobile.locator('#pages .mmat-cell').count()===9);
  await mobile.locator('.qc.open [data-act=addEqItem]').first().click();
  await mobile.locator('#eqdlg [data-act=eqCategory][data-cat="المصفوفات والأنظمة"]').click();
  await mobile.locator('#eqdlg .eq-template-tile[data-t=cases]').click();
  check('two editable case rows',await mobile.locator('#eqdlg [data-eq-line]').count()===4);
  await mobile.locator('#eqdlg [data-act=eqOk]').click();
  check('cases rendered',await mobile.locator('#pages .mcases-row').count()===2);
  await mobile.locator('.qc.open [data-act=addEqItem]').first().click();
  await mobile.locator('#eqdlg [data-act=eqCategory][data-cat="التكامل"]').click();
  await mobile.locator('#eqdlg .eq-template-tile[data-t=iint]').click();
  await mobile.locator('#eqdlg [data-act=eqOk]').click();
  check('double integral rendered',await mobile.locator('#pages .mint').allTextContents().then(a=>a.join('').includes('∬')));
  await mobile.locator('.nav [data-v=preview]').click();
  await mobile.waitForTimeout(380);
  const pageCount=await mobile.locator('#pages .page').count();
  const pdf=path.join(root,'tests/v18-ci-print.pdf');
  await mobile.pdf({path:pdf,printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
  const pdfCount=Number((execFileSync('pdfinfo',[pdf]).toString().match(/^Pages:\s+(\d+)/m)||[])[1]);
  check('PDF A4 page parity',pdfCount===pageCount);
  check('bold math',await mobile.locator('#pages .mx').first().evaluate(e=>Number(getComputedStyle(e).fontWeight))>=700);
  check('no mobile overflow',await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check('no JavaScript errors',errors.length===0);
  const desktop=await browser.newPage({viewport:{width:1440,height:900}});
  await start(desktop);
  await desktop.locator('#eqdlg [data-act=eqCategory][data-cat="المصفوفات والأنظمة"]').click();
  check('desktop matrix gallery',await desktop.locator('#eqdlg .eq-template-tile').count()>=4);
  console.log('v18 browser/PDF PASS: '+passed.length+' checks; preview='+pageCount+' PDF='+pdfCount);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
