const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: fileUrl, pretendToBeVisual: true });
const win = dom.window;
win.scrollTo = () => {};
win.Element.prototype.scrollIntoView = function(){};
const wait = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
win.onerror = (msg) => errors.push(msg);
const click = (el) => { el.dispatchEvent(new win.Event('click', { bubbles: true })); };

(async () => {
  await wait(600);
  const doc = win.document;
  const assetsMock = win.eval('assetsMock');

  console.log('=== 1) Mac dinh chon Top 20 (nut sang mau, dqHeatmapRange=20) ===');
  console.log('dqHeatmapRange:', win.eval('dqHeatmapRange'), '(expect 20)');
  const btn20 = doc.querySelector('[data-hm-range="20"]');
  console.log('nut Top20 co nen active (var(--link)):', btn20.style.background.includes('link') || getComputedStyle(btn20));
  console.log('so dong hien tai:', doc.querySelectorAll('#dqHeatmapWrap .hm-name').length, '(expect 20)');

  console.log('\n=== 2) Bam Top 10 -> dung 10 dong, sap xep healthScore tang dan ===');
  click(doc.querySelector('[data-hm-range="10"]'));
  await wait(20);
  let rows = [...doc.querySelectorAll('#dqHeatmapWrap .hm-name')];
  console.log('so dong:', rows.length, '(expect 10)');
  const scoresShown = rows.map(r => assetsMock.find(a=>a.id===r.dataset.assetId).healthScore);
  const sorted = [...scoresShown].sort((a,b)=>a-b);
  console.log('da sap xep tang dan (te nhat len dau):', JSON.stringify(scoresShown)===JSON.stringify(sorted));
  console.log('footer:', doc.getElementById('dqHeatmapFooter').textContent.trim());
  console.log('nut Top10 dang active:', doc.querySelector('[data-hm-range="10"]').style.background.includes('link'));
  console.log('nut Top20 KHONG con active:', !doc.querySelector('[data-hm-range="20"]').style.background.includes('link'));

  console.log('\n=== 3) Bam Tat ca -> hien full 30, footer dung cau "toan bo" ===');
  click(doc.querySelector('[data-hm-range="all"]'));
  await wait(20);
  rows = doc.querySelectorAll('#dqHeatmapWrap .hm-name');
  console.log('so dong:', rows.length, '(expect 30)');
  console.log('footer:', doc.getElementById('dqHeatmapFooter').textContent.trim());
  console.log('footer dung mau "Hien thi toan bo N asset":', /Hiển thị toàn bộ 30 asset/.test(doc.getElementById('dqHeatmapFooter').textContent));

  console.log('\n=== 4) Filter con it hon so dong chon -> hien het, khong loi ===');
  const ddDomain = doc.getElementById('ddOvDomain');
  click(ddDomain); await wait(20);
  const riskInput = [...ddDomain.querySelectorAll('input[type=checkbox]')].find(i=>i.value==='Risk');
  riskInput.checked = true; riskInput.dispatchEvent(new win.Event('change', {bubbles:true}));
  await wait(20);
  click(doc.querySelector('[data-hm-range="20"]'));
  await wait(20);
  console.log('ovCountBadge:', doc.getElementById('ovCountBadge').textContent, '(Risk domain, it hon 20)');
  rows = doc.querySelectorAll('#dqHeatmapWrap .hm-name');
  console.log('so dong hien thi (phai = so asset Risk, khong bao loi):', rows.length);
  console.log('footer:', doc.getElementById('dqHeatmapFooter').textContent.trim());
  win.clearOverviewFilters();
  await wait(20);

  console.log('\n=== 5) Cau truc sticky + vung cuon rieng (Yeu cau 2) ===');
  const wrap = doc.getElementById('dqHeatmapWrap');
  console.log('dqHeatmapWrap co class heatmap-scroll (flex:1/overflow):', wrap.className.includes('heatmap-scroll'));
  const card = wrap.closest('.dq-heatmap-card');
  console.log('card cha co class dq-heatmap-card (display:flex cot, height co dinh qua CSS):', !!card);
  const corner = doc.querySelector('#dqHeatmapWrap .hm-head.hm-corner');
  console.log('o goc header vua sticky top vua sticky left (qua class hm-corner):', !!corner);
  const nameCell = doc.querySelector('#dqHeatmapWrap .hm-name');
  console.log('cot ten asset la phan tu rieng biet co the sticky (class hm-name):', !!nameCell);
  console.log('legend + footer nam NGOAI wrap cuon (khong phai con cua no):', !wrap.contains(doc.getElementById('dqHeatmapLegend')) && !wrap.contains(doc.getElementById('dqHeatmapFooter')));

  console.log('\n=== 6) Chieu cao dong ap dung qua CSS variable --hm-row-h, co chan tren/duoi ===');
  const grid = doc.getElementById('dqHeatmapGrid');
  console.log('grid co set --hm-row-h:', grid.style.getPropertyValue('--hm-row-h'));
  // jsdom khong tinh layout that (clientHeight luon 0) nen ideal luon <=0 -> phai bi chan o ROW_MIN,
  // kiem tra dung gia tri chan duoi thay vi mong doi 1 con so do-layout-that (moi truong khong ho tro).
  const ROW_MIN = win.eval('DQ_HEATMAP_ROW_MIN');
  const ROW_MAX = win.eval('DQ_HEATMAP_ROW_MAX');
  const rowHNum = parseFloat(grid.style.getPropertyValue('--hm-row-h'));
  console.log('rowH nam trong [ROW_MIN,ROW_MAX]:', rowHNum >= ROW_MIN && rowHNum <= ROW_MAX, `(${ROW_MIN}-${ROW_MAX}, got ${rowHNum})`);
  console.log('computeDQHeatmapRowHeight(0 dong) tra ve ROW_MAX (khong chia cho 0):', win.eval('computeDQHeatmapRowHeight({clientHeight:100}, 0)') === ROW_MAX);
  console.log('computeDQHeatmapRowHeight ideal qua lon -> ket qua = ROW_MAX (khong giai bat thuong):', win.eval('computeDQHeatmapRowHeight({clientHeight:10000}, 2)') === ROW_MAX);
  console.log('computeDQHeatmapRowHeight ideal qua nho -> ket qua = ROW_MIN (van cuon, khong ep bep):', win.eval('computeDQHeatmapRowHeight({clientHeight:50}, 100)') === ROW_MIN);

  console.log('\n=== 7) Resize window -> tinh lai --hm-row-h (khong loi, van co gia tri) ===');
  win.dispatchEvent(new win.Event('resize'));
  await wait(20);
  console.log('grid van co --hm-row-h sau resize:', !!doc.getElementById('dqHeatmapGrid').style.getPropertyValue('--hm-row-h'));

  console.log('\n=== 8) runCoverageChecks van 0 fail sau khi doi ve Top 20 (trang thai mac dinh) ===');
  click(doc.querySelector('[data-hm-range="20"]'));
  await wait(20);
  const ok = win.runCoverageChecks(win.eval('assetsMock'), win.eval('rulesMock'));
  console.log('runCoverageChecks ok:', ok);

  console.log('\n=== 9) Khong co console error trong toan bo qua trinh ===');
  console.log('so loi:', errors.length);
  errors.forEach(e => console.log('  -', e));

  console.log('\nDONE');
  process.exit(0);
})();
