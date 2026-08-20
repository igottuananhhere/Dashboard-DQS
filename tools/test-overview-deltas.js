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

  console.log('=== Doi chieu doc lap bang Node truoc, khong qua UI ===');
  const assets = win.eval('assetsMock');
  const historied = assets.filter(a => a.history30d && a.history30d.length >= 2);
  const minLen = Math.min(...historied.map(a => a.history30d.length));
  const avg = arr => arr.reduce((s, v) => s + v, 0) / arr.length;
  const todayAvg = avg(historied.map(a => a.history30d[minLen - 1].healthScore).filter(v => v != null));
  const yestAvg = avg(historied.map(a => a.history30d[minLen - 2].healthScore).filter(v => v != null));
  console.log('avg today:', todayAvg.toFixed(2), '| avg yesterday:', yestAvg.toFixed(2), '| expected delta:', Math.round(todayAvg - yestAvg));

  function bucket(s) { return s == null ? null : s < 50 ? 'Critical' : s < 80 ? 'Warning' : 'Healthy'; }
  const todayCounts = { Healthy: 0, Warning: 0, Critical: 0 };
  const yestCounts = { Healthy: 0, Warning: 0, Critical: 0 };
  historied.forEach(a => {
    const bt = bucket(a.history30d[minLen - 1].healthScore);
    const by = bucket(a.history30d[minLen - 2].healthScore);
    if (bt) todayCounts[bt]++;
    if (by) yestCounts[by]++;
  });
  console.log('expected Healthy delta:', todayCounts.Healthy - yestCounts.Healthy);
  console.log('expected Degraded(Warning) delta:', todayCounts.Warning - yestCounts.Warning);
  console.log('expected Critical delta:', todayCounts.Critical - yestCounts.Critical);

  console.log('\n=== Doc tu UI (khong filter gi, 30/30) ===');
  console.log('ovKpiOverallDelta:', doc.getElementById('ovKpiOverallDelta').textContent, '| class:', doc.getElementById('ovKpiOverallDelta').className);
  console.log('ovKpiCriticalDelta:', doc.getElementById('ovKpiCriticalDelta').textContent, '| class:', doc.getElementById('ovKpiCriticalDelta').className);

  console.log('\n=== Kiem tra mau sac thuc te qua CSS (up=green, down=red) ===');
  const getColor = (el) => {
    // JSDOM khong tinh computed style tu CSS file <style> luon chinh xac stylesheet cascaded,
    // nhung neu co inline color thi uu tien do; kiem tra class de suy ra mau ky vong.
    return el.className.includes('up') ? 'green(expected)' : el.className.includes('down') ? 'red(expected)' : 'muted(expected)';
  };
  ['ovKpiOverallDelta','ovKpiCriticalDelta'].forEach(id=>{
    console.log(id, '->', getColor(doc.getElementById(id)));
  });

  console.log('\n=== Filter Domain=Risk (3 asset) - delta phai tinh lai tren tap da loc ===');
  const ddDomain = doc.getElementById('ddOvDomain');
  await click(ddDomain);
  const input = [...ddDomain.querySelectorAll('input[type=checkbox]')].find(i => i.value === 'Risk');
  input.checked = true;
  input.dispatchEvent(new win.Event('change', { bubbles: true }));
  console.log('ovCountBadge:', doc.getElementById('ovCountBadge').textContent, '(expect 3 / 30)');
  console.log('ovKpiOverallDelta (Risk only):', doc.getElementById('ovKpiOverallDelta').textContent);

  console.log('\nDONE');
  process.exit(0);
})();
