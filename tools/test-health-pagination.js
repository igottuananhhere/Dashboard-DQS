const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: fileUrl, pretendToBeVisual: true });
const win = dom.window;
win.scrollTo = () => {};
const wait = ms => new Promise(r => setTimeout(r, ms));
async function click(el) { el.dispatchEvent(new win.Event('click', { bubbles: true })); await wait(20); }

(async () => {
  await wait(500);
  const doc = win.document;
  win.switchTab('health');
  console.log('So dong hien thi trang 1:', doc.querySelectorAll('#healthTableBody tr[data-asset-id]').length, '(expect 10)');
  console.log('Pagination buttons:', [...doc.querySelectorAll('#healthTablePagination .pg')].map(b => b.textContent).join(','), '(expect 1,2,3)');
  console.log('Page 1 active:', doc.querySelector('#healthTablePagination .pg.active').textContent);

  const page2Btn = [...doc.querySelectorAll('#healthTablePagination .pg')].find(b => b.textContent === '2');
  await click(page2Btn);
  console.log('\nSau khi bam trang 2:');
  console.log('So dong hien thi:', doc.querySelectorAll('#healthTableBody tr[data-asset-id]').length, '(expect 10)');
  console.log('Page active:', doc.querySelector('#healthTablePagination .pg.active').textContent, '(expect 2)');
  const firstAssetPage2 = doc.querySelector('#healthTableBody tr[data-asset-id]').dataset.assetId;
  console.log('Asset dau tien trang 2:', firstAssetPage2);

  const page3Btn = [...doc.querySelectorAll('#healthTablePagination .pg')].find(b => b.textContent === '3');
  await click(page3Btn);
  console.log('\nSau khi bam trang 3:');
  console.log('So dong hien thi:', doc.querySelectorAll('#healthTableBody tr[data-asset-id]').length, '(expect 10, tong 30 asset = 3 trang x10)');

  const ddStatus = doc.getElementById('ddHealthStatus');
  await click(ddStatus);
  const input = [...ddStatus.querySelectorAll('input[type=checkbox]')].find(i => i.value === 'Critical');
  input.checked = true;
  input.dispatchEvent(new win.Event('change', { bubbles: true }));
  console.log('\nSau filter Critical (6 dong):');
  console.log('So dong hien thi:', doc.querySelectorAll('#healthTableBody tr[data-asset-id]').length, '(expect 6)');
  console.log('Pagination buttons:', [...doc.querySelectorAll('#healthTablePagination .pg')].map(b => b.textContent).join(','), '(expect chi 1 nut: 1)');

  console.log('\nDONE');
  process.exit(0);
})();
