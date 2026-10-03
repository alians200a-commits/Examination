const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const {execFileSync}=require('child_process');
(async()=>{
const browser=await chromium.launch({
 headless:true,
 executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||(
   fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':chromium.executablePath()
 ),
 args:['--no-sandbox','--disable-dev-shm-usage']
});
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
await page.setContent(html,{waitUntil:'load',timeout:70000});
await page.locator('[data-act=homeNew]').click();
for(let i=0;i<3;i++)await page.locator('#wizard [data-act=wzNext]').click();
await page.locator('[data-kind=math]').first().click();
assert(await page.locator('.qc.open [data-act=eq]').count()>0,'Math question lacks equation button');
await page.locator('.qc.open [data-act=eq]').first().click();
assert(await page.locator('#eqdlg').evaluate(x=>x.open),'Dialog did not open');
assert.equal(await page.locator('#eqdlg .math-fast [data-t]').count(),7);
await page.locator('#eqdlg .math-fast [data-t=trig]').click();
await page.locator('#eqdlg [data-eq=fn]').selectOption('sin');
await page.locator('#eqdlg [data-eq=x]').fill('س');
await page.locator('#eqdlg [data-eq=e]').fill('٢');
assert((await page.locator('#eqdlg .eqprev').textContent()).includes('جا'),'Live trigonometry preview missing Arabic sine');
await page.locator('#eqdlg [data-act=eqOk]').click();
await page.waitForTimeout(240);
assert(await page.locator('#pages .mx-ar .mfn').count()>0,'Printed question does not contain equation');
await page.locator('.qc.open [data-act=addEqItem]').first().click();
await page.locator('#eqdlg .math-fast [data-t=deriv]').click();
await page.locator('#eqdlg [data-eq=f]').fill('س^{٢}+٣س');
await page.locator('#eqdlg [data-eq=v]').fill('س');
await page.locator('#eqdlg [data-act=eqOk]').click();
await page.waitForTimeout(200);
assert(await page.locator('#pages .mx-ar .mf').count()>0,'Derivative not typeset as a stacked fraction');
await page.locator('.qc.open [data-act=addEqItem]').first().click();
await page.locator('#eqdlg .math-fast [data-t=intdef]').click();
await page.locator('#eqdlg [data-eq=a]').fill('٠');
await page.locator('#eqdlg [data-eq=b]').fill('١');
await page.locator('#eqdlg [data-eq=f]').fill('س^{٢}');
await page.locator('#eqdlg [data-act=eqOk]').click();
await page.waitForTimeout(220);
assert(await page.locator('#pages .mx-ar .mint').count()>0,'Integral not rendered');
const style=await page.locator('#pages .mx-ar').first().evaluate(el=>({weight:getComputedStyle(el).fontWeight,color:getComputedStyle(el).color,size:getComputedStyle(el).fontSize}));
assert(Number(style.weight)>=700,'Print-preview math weight too light: '+JSON.stringify(style));
await page.locator('.nav [data-v=preview]').click();
await page.waitForTimeout(320);
await page.screenshot({path:path.join(root,'tests','v17-mobile-calculus.png'),fullPage:true});
const pdf=path.join(root,'tests','v17-calculus.pdf');
await page.pdf({path:pdf,printBackground:true,preferCSSPageSize:true,displayHeaderFooter:false});
const pages=+(execFileSync('pdfinfo',[pdf]).toString().match(/^Pages:\s+(\d+)/m)||[])[1];
const preview=await page.locator('#pages .page').count();
assert.equal(pages,preview,'PDF page count differs from preview');
assert.equal(errors.length,0,'Browser errors: '+errors.join(' | '));
const result={browser:'mobile 390px',equations:['trigonometry','derivative','definite integral'],fontWeight:style.weight,pdfPages:pages,previewPages:preview,errors};
fs.writeFileSync(path.join(root,'tests','v17-browser-results.json'),JSON.stringify(result,null,2));
console.log('V17 browser/PDF checks PASS',result);
}catch(e){console.error('V17 browser FAILED:',e,errors);await page.screenshot({path:path.join(root,'tests','v17-failure.png'),fullPage:true}).catch(()=>{});throw e;}
finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
