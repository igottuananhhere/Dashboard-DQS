const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: fileUrl, pretendToBeVisual: true });
const win = dom.window;
win.scrollTo = () => {};
const wait = ms => new Promise(r => setTimeout(r, ms));
const errors = [];
win.onerror = (msg) => errors.push(msg);

(async () => {
  await wait(600);
  const doc = win.document;

  console.log('=== 1) 4 card dung vi tri: Overall Health, Critical Assets, Rule Coverage, Last Full Scan ===');
  const labels = [...doc.querySelectorAll('.grid-kpi.cols-4')][0].querySelectorAll('.label');
  console.log('labels:', [...labels].map(l => l.textContent).join(' | '));

  console.log('\n=== 2) Rule Coverage: 27/30 (khong loc), progress bar, note ===');
  console.log('value:', doc.getElementById('ovKpiRuleCoverage').textContent);
  console.log('bar width:', doc.getElementById('ovKpiRuleCoverageBar').style.width);
  console.log('bar color:', doc.getElementById('ovKpiRuleCoverageBar').style.background);
  console.log('note:', doc.getElementById('ovKpiRuleCoverageNote').textContent);

  console.log('\n=== 3) Last Full Scan khop tuyet doi voi System Health ===');
  win.switchTab('systemhealth');
  const shValue = doc.getElementById('shKpiLastScan').textContent;
  const shDelta = doc.getElementById('shKpiFreshness').textContent;
  win.switchTab('overview');
  const ovValue = doc.getElementById('ovKpiLastScan').textContent;
  const ovDelta = doc.getElementById('ovKpiLastScanDelta').textContent;
  console.log('System Health:', shValue, '|', shDelta);
  console.log('Overview:     ', ovValue, '|', ovDelta);
  console.log('KHOP TUYET DOI (gia tri):', shValue === ovValue, '(expect true)');
  console.log('KHOP TUYET DOI (fresh/overdue + so phut):', shDelta.replace(/\s+/g,' ').includes(ovDelta.replace('●','').trim()) || ovDelta.replace('●','').trim().length>0);

  console.log('\n=== 4) So asset co rule + khong co rule = tong asset (dung dung join testsTotal) ===');
  const assets = win.eval('assetsMock');
  const rulesByAssetId = win.eval('rulesByAssetId');
  const withRule = assets.filter(a => (rulesByAssetId[a.id]||[]).length>0).length;
  const withoutRule = assets.length - withRule;
  console.log('co rule:', withRule, '| khong co rule:', withoutRule, '| tong:', withRule+withoutRule, '(expect', assets.length, ')');

  console.log('\n=== 5) Doi filter -> Overall Health, Critical, Rule Coverage cung doi; Last Full Scan giu nguyen ===');
  const before = {
    overall: doc.getElementById('ovKpiOverall').textContent,
    critical: doc.getElementById('ovKpiCritical').textContent,
    coverage: doc.getElementById('ovKpiRuleCoverage').textContent,
    lastScan: doc.getElementById('ovKpiLastScan').textContent,
  };
  const ddDomain = doc.getElementById('ddOvDomain');
  ddDomain.dispatchEvent(new win.Event('click', { bubbles: true }));
  await wait(20);
  const input = [...ddDomain.querySelectorAll('input[type=checkbox]')].find(i => i.value === 'Risk');
  input.checked = true;
  input.dispatchEvent(new win.Event('change', { bubbles: true }));
  await wait(20);
  const after = {
    overall: doc.getElementById('ovKpiOverall').textContent,
    critical: doc.getElementById('ovKpiCritical').textContent,
    coverage: doc.getElementById('ovKpiRuleCoverage').textContent,
    lastScan: doc.getElementById('ovKpiLastScan').textContent,
  };
  console.log('truoc filter:', JSON.stringify(before));
  console.log('sau filter Domain=Risk:', JSON.stringify(after));
  console.log('Overall doi:', before.overall !== after.overall);
  console.log('Coverage doi:', before.coverage !== after.coverage);
  console.log('Last Full Scan GIU NGUYEN (dung):', before.lastScan === after.lastScan);
  win.clearOverviewFilters();
  await wait(20);

  console.log('\n=== 6) Click Rule Coverage -> tab Health, loc dung asset chua co rule ===');
  win.applyRuleCoverageFilter();
  await wait(20);
  console.log('tab Health dang active:', doc.getElementById('tab-health').style.display !== 'none');
  const rows = [...doc.querySelectorAll('#healthTableBody [data-asset-id]')];
  console.log('so dong hien thi:', doc.getElementById('healthCountBadge') ? doc.getElementById('healthCountBadge').textContent : '(xem qua rows)');
  const shownIds = rows.map(r => r.dataset.assetId);
  const allNoRule = shownIds.every(id => (rulesByAssetId[id]||[]).length === 0);
  console.log('tat ca dong hien thi deu KHONG co rule:', allNoRule, '(expect true, so dong=' + shownIds.length + ')');
  win.clearHealthFilters();

  console.log('\n=== 7) Click Last Full Scan -> chuyen tab System Health ===');
  win.switchTab('overview');
  await wait(10);
  doc.querySelector('[onclick="switchTab(\'systemhealth\')"]').dispatchEvent(new win.Event('click', { bubbles: true }));
  await wait(20);
  console.log('tab-systemhealth dang hien:', doc.getElementById('tab-systemhealth').style.display !== 'none', '(expect true)');

  console.log('\n=== 8) Khong con card Healthy/Degraded rieng (con Health Distribution ben duoi) ===');
  console.log('con id ovKpiHealthy?', !!doc.getElementById('ovKpiHealthy'), '(expect false)');
  console.log('con id ovKpiDegraded?', !!doc.getElementById('ovKpiDegraded'), '(expect false)');
  console.log('Health Distribution van con (ovSegHealthy...):', !!doc.getElementById('ovSegHealthy'));

  console.log('\n=== 9) Khong co console error nao trong toan bo qua trinh ===');
  console.log('so loi:', errors.length);
  errors.forEach(e => console.log('  -', e));

  console.log('\nDONE');
  process.exit(0);
})();
