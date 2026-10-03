/* Browser-level v19 regression: individual science palette buttons, mobile selector, Arabic theta, and PDF parity. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const checks = [];
function check(name, value) { assert.ok(value, name); checks.push(name); }
async function start(page) {
  await page.evaluate(() => {
    const store = {};
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
    });
  });
  await page.setContent(html, { waitUntil: 'load', timeout: 90000 });
  await page.locator('[data-act=homeNew]').click();
  for (let i = 0; i < 3; i++) await page.locator('#wizard [data-act=wzNext]').click();
  await page.locator('[data-kind=math]').first().click();
  await page.locator('.qc.open [data-act=eq]').first().click();
}
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || (fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : chromium.executablePath()), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await start(page);
    check('18 category options including separate fractions/powers', await page.locator('#eqdlg [data-eq-cat-select] option').count() === 18);
    await page.locator('#eqdlg [data-eq-cat-select]').selectOption('الدوال المثلثية');
    check('cos has an individual button', await page.locator('#eqdlg .eq-template-tile[data-t=trig][data-fn=cos]').count() === 1);
    await page.locator('#eqdlg .eq-template-tile[data-t=trig][data-fn=cos]').click();
    check('cos is selected', await page.locator('#eqdlg [data-eq=fn]').inputValue() === 'cos');
    await page.locator('#eqdlg [data-eq-cat-select]').selectOption('الحروف اليونانية');
    check('Greek palette has 20+ separate symbols', await page.locator('#eqdlg [data-act=eqPaletteSymbol]').count() >= 20);
    await page.locator('#eqdlg [data-act=eqPaletteSymbol]').filter({ hasText: 'ثيتا' }).first().click();
    check('theta replaces untouched angle placeholder', await page.locator('#eqdlg [data-eq=x]').inputValue() === '\\theta');
    check('theta in live typeset preview', (await page.locator('#eqdlg .eqprev').innerText()).includes('θ'));
    await page.locator('#eqdlg').screenshot({ path: path.join(root, 'tests/v19-greek-mobile.png') });
    await page.locator('#eqdlg [data-act=eqOk]').click();
    check('trigonometric function prints in question', await page.locator('#pages .mfn').count() >= 1);
    await page.locator('.qc.open [data-act=addEqItem]').first().click();
    await page.locator('#eqdlg [data-eq-cat-select]').selectOption('الكيمياء');
    check('chemistry preset is distinct', await page.locator('#eqdlg [data-preset=chem-reaction]').count() === 1);
    await page.locator('#eqdlg [data-preset=chem-reaction]').click();
    check('chemistry reaction is editable', await page.locator('#eqdlg [data-eq=x]').inputValue() === '2H2 + O2 -> 2H2O');
    await page.locator('#eqdlg [data-eq=x]').focus();
    await page.locator('#eqdlg [data-act=eqPaletteSymbol]').filter({ hasText: 'ينتج' }).click();
    check('chemical reaction arrow can be inserted at caret', (await page.locator('#eqdlg [data-eq=x]').inputValue()).split('->').length >= 3);
    await page.locator('#eqdlg [data-act=eqOk]').click();
    await page.locator('.qc.open [data-act=addEqItem]').first().click();
    await page.locator('#eqdlg [data-eq-cat-select]').selectOption('الفيزياء');
    check('physics speed preset is distinct', await page.locator('#eqdlg [data-preset=physics-speed]').count() === 1);
    await page.locator('#eqdlg [data-preset=physics-speed]').click();
    check('physics fraction has numerator and denominator', await page.locator('#eqdlg .eqprev .mf').count() >= 1);
    await page.locator('#eqdlg [data-act=eqOk]').click();
    await page.locator('.nav [data-v=preview]').click();
    await page.waitForTimeout(350);
    const previewPages = await page.locator('#pages .page').count();
    const pdf = path.join(root, 'tests/v19-math.pdf');
    await page.pdf({ path: pdf, preferCSSPageSize: true, printBackground: true, displayHeaderFooter: false });
    const pdfPages = +(execFileSync('pdfinfo', [pdf]).toString().match(/^Pages:\s+(\d+)/m) || [])[1];
    check('PDF has same A4 page count as preview', pdfPages === previewPages);
    check('no JavaScript exceptions', errors.length === 0);
    const result = { checks, previewPages, pdfPages, errors };
    fs.writeFileSync(path.join(root, 'tests/v19-browser-results.json'), JSON.stringify(result, null, 2));
    console.log('V19 mobile/browser/PDF PASS', JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
