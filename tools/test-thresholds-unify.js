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

  console.log('=== 1) Chi con DUY NHAT 1 khai bao THRESHOLDS trong toan file ===');
  const count = (html.match(/^const THRESHOLDS/gm) || []).length;
  console.log('so lan khai bao "const THRESHOLDS":', count, '(expect 1)');

  console.log('\n=== 2) scoreColor() dung THRESHOLDS, khop mau o moi noi goi ===');
  const scoreColor = win.eval('scoreColor');
  console.log('scoreColor(95):', scoreColor(95), '(expect var(--green))');
  console.log('scoreColor(82):', scoreColor(82), '(expect var(--orange) - Canh bao)');
  console.log('scoreColor(60):', scoreColor(60), '(expect var(--red) - truoc day tung la cam, sai)');
  console.log('scoreColor(null):', scoreColor(null), '(expect var(--gray))');

  console.log('\n=== 3) Diem 82: 3 noi phai THONG NHAT (khong con 3 thong diep trai nhau) ===');
  const dqStatusFor = win.eval('dqStatusFor');
  const status82 = dqStatusFor(82);
  console.log('DQ status(82):', status82.label, '(THRESHOLDS.amber<=82<THRESHOLDS.green -> Canh bao, dung)');
  console.log('Health table color(82):', scoreColor(82), '(var(--orange) -> dong nhat voi "Canh bao")');
  const THRESHOLDS = win.eval('THRESHOLDS');
  console.log('Radar target = THRESHOLDS.green:', THRESHOLDS.green, '-> 82 < 90 nen KHONG dat muc tieu (dung, khop voi Canh bao)');

  console.log('\n=== 4) Diem 90: phai TOT o ca 3 noi ===');
  console.log('DQ status(90):', dqStatusFor(90).label, '(expect Tot)');
  console.log('Health color(90):', scoreColor(90), '(expect var(--green))');
  console.log('90 >= THRESHOLDS.green (dat muc tieu radar):', 90 >= THRESHOLDS.green);

  console.log('\n=== 5) Needs Attention KHONG con nguong <50 rieng (dung scoreColor) ===');
  const assets = win.eval('assetsMock');
  const scoreBelow50 = assets.find(a => a.healthScore != null && a.healthScore < 50 && a.healthScore >= 27);
  console.log('kiem tra 1 asset diem thap:', scoreBelow50 && scoreBelow50.name, scoreBelow50 && scoreBelow50.healthScore);
  doc.querySelectorAll('#needsAttentionBody [data-asset-id]').forEach(row => {
    const numEl = row.querySelector('.health-num');
    if (numEl) {
      const score = Number(numEl.textContent);
      const expectedColor = scoreColor(score);
      const actualColor = numEl.getAttribute('style');
      console.log(`  ${row.querySelector('.asset-link').textContent}: score=${score}, style="${actualColor}" (expect chua "${expectedColor}")`);
    }
  });

  console.log('\n=== 6) HEALTH_STATUS_BUCKET doc lap voi THRESHOLDS (khong bi gop nham) ===');
  const HEALTH_STATUS_BUCKET = win.eval('HEALTH_STATUS_BUCKET');
  console.log('HEALTH_STATUS_BUCKET:', JSON.stringify(HEALTH_STATUS_BUCKET), '(expect {criticalMax:50,warningMax:80}, KHAC THRESHOLDS 90/70)');

  console.log('\n=== 7) 2 con so "diem tong" da duoc gan nhan ro + giai thich chenh lech ===');
  console.log('Label KPI 1:', doc.querySelector('.grid-kpi.cols-4 .card:first-child .label').textContent);
  console.log('Value KPI 1 font-size:', doc.getElementById('ovKpiOverall').getAttribute('style'));
  console.log('DQ big number font-size:', doc.querySelector('#dqKpiRow div').getAttribute('style'));
  console.log('ovKpiOverall value:', doc.getElementById('ovKpiOverall').textContent);
  console.log('dqKpiRow value:', doc.querySelector('#dqKpiRow > div').textContent.trim());
  console.log('Dong giai thich chenh lech:', doc.getElementById('ovKpiOverallVsSystem').textContent);

  console.log('\n=== 8) Doi filter -> dong giai thich tinh lai dung ===');
  const ddDomain = doc.getElementById('ddOvDomain');
  ddDomain.dispatchEvent(new win.Event('click', { bubbles: true }));
  await wait(20);
  const input = [...ddDomain.querySelectorAll('input[type=checkbox]')].find(i => i.value === 'Compliance');
  input.checked = true;
  input.dispatchEvent(new win.Event('change', { bubbles: true }));
  await wait(20);
  console.log('ovKpiOverall (Compliance only):', doc.getElementById('ovKpiOverall').textContent);
  console.log('Dong giai thich:', doc.getElementById('ovKpiOverallVsSystem').textContent);
  win.clearOverviewFilters();

  console.log('\n=== 9) Khong co console error ===');
  console.log('so loi:', errors.length);
  errors.forEach(e => console.log('  -', e));

  console.log('\nDONE');
  process.exit(0);
})();
