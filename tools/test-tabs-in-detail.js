const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: fileUrl, pretendToBeVisual: true });
const win = dom.window;
win.scrollTo = () => {};
const wait = ms => new Promise(r => setTimeout(r, ms));
async function click(el) { el.dispatchEvent(new win.Event('click', { bubbles: true })); await wait(30); }

(async () => {
  await wait(500);
  const doc = win.document;

  console.log('=== Tabs co hien thi khi dang o trang chinh? ===');
  console.log('tabs visible:', !!doc.querySelector('.tabs'), '| tab buttons:', doc.querySelectorAll('.tab').length, '(expect 5)');

  console.log('\n=== Mo Asset Detail tu Needs Attention (dang o tab Overview) ===');
  const row = doc.querySelector('#needsAttentionBody [data-asset-id]');
  await click(row);
  console.log('view-detail active:', doc.getElementById('view-detail').classList.contains('active'), '(expect true)');
  console.log('location.hash:', win.location.hash);
  console.log('Tab bar van con hien dien trong DOM (khong bi thao view an di):', !!doc.querySelector('.tabs'));
  console.log('Tab "Health" co the bam duoc tu day (khong bi che boi overlay):', !doc.getElementById('assetDrawerOverlay'));

  console.log('\n=== Bam tab "Rule Lifecycle" ngay trong luc dang xem Asset Detail ===');
  const ruleTabBtn = [...doc.querySelectorAll('.tab')].find(t => t.dataset.tab === 'rulelifecycle');
  await click(ruleTabBtn);
  console.log('view-detail active sau khi bam tab:', doc.getElementById('view-detail').classList.contains('active'), '(expect false)');
  console.log('view-main active:', doc.getElementById('view-main').classList.contains('active'), '(expect true)');
  console.log('tab-rulelifecycle display:', doc.getElementById('tab-rulelifecycle').style.display, '(expect block)');
  console.log('tab active class dung Rule Lifecycle:', ruleTabBtn.classList.contains('active'), '(expect true)');
  console.log('location.hash sau khi doi tab (phai duoc xoa, khong con tro asset cu):', JSON.stringify(win.location.hash), '(expect rong)');

  console.log('\n=== Mo lai 1 asset khac, roi bam tab Overview ===');
  win.switchTab('health');
  const row2 = doc.querySelector('#healthTableBody [data-asset-id]');
  await click(row2);
  console.log('view-detail active:', doc.getElementById('view-detail').classList.contains('active'), '(expect true)');
  const ovTabBtn = [...doc.querySelectorAll('.tab')].find(t => t.dataset.tab === 'overview');
  await click(ovTabBtn);
  console.log('sau khi bam Overview: view-main active:', doc.getElementById('view-main').classList.contains('active'), '(expect true)');
  console.log('tab-overview display:', doc.getElementById('tab-overview').style.display, '(expect block)');
  console.log('hash da xoa:', JSON.stringify(win.location.hash), '(expect rong)');

  console.log('\nDONE');
  process.exit(0);
})();
