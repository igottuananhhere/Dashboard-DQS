const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: fileUrl, pretendToBeVisual: true });
const win = dom.window;
win.scrollTo = () => {};
const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  await wait(600);
  const doc = win.document;
  const assets = win.eval('assetsMock');
  const RADAR_DIMS = ['Accuracy','Completeness','Uniqueness','Validity','Consistency','Freshness'];

  console.log('=== 1) Doi chieu doc lap cong thuc weighted average (khong goi lai ham cua app) ===');
  const totalWeight = assets.reduce((s,a)=>s+(a.recordCount||0),0);
  console.log('tong recordCount:', totalWeight.toLocaleString());
  const expected = {};
  RADAR_DIMS.forEach(dim=>{
    let sw=0, sv=0;
    assets.forEach(a=>{
      const w = a.recordCount||0, v = a.healthDimensions[dim];
      if(v==null || !w) return;
      sw+=w; sv+=v*w;
    });
    expected[dim] = sw ? sv/sw : null;
  });
  console.log('ket qua tinh doc lap:', Object.entries(expected).map(([k,v])=>`${k}=${v.toFixed(2)}`).join(', '));

  const actual = win.eval('weightedDimensionScores(assetsMock, null).scores');
  let allMatch = true;
  RADAR_DIMS.forEach(dim=>{
    const diff = Math.abs(expected[dim]-actual[dim]);
    if(diff>0.01){ allMatch=false; console.log(`  MISMATCH ${dim}: expected ${expected[dim]} got ${actual[dim]}`); }
  });
  console.log('APP TINH DUNG CONG THUC WEIGHTED AVERAGE:', allMatch, '(expect true)');

  console.log('\n=== 2) So sanh voi trung binh cong don gian (phai KHAC nhau ro ret vi co outlier) ===');
  const simpleAvg = {};
  RADAR_DIMS.forEach(dim=>{
    const vals = assets.map(a=>a.healthDimensions[dim]).filter(v=>v!=null);
    simpleAvg[dim] = vals.reduce((s,v)=>s+v,0)/vals.length;
  });
  RADAR_DIMS.forEach(dim=>{
    console.log(`  ${dim}: weighted=${actual[dim].toFixed(1)} vs simple-avg=${simpleAvg[dim].toFixed(1)} (chenh lech=${(actual[dim]-simpleAvg[dim]).toFixed(1)})`);
  });

  console.log('\n=== 3) Canh bao khi 1 asset chiem >60% trong so ===');
  const top = assets.reduce((m,a)=>(a.recordCount||0)>(m.recordCount||0)?a:m, assets[0]);
  const pct = top.recordCount/totalWeight*100;
  console.log('asset lon nhat:', top.name, pct.toFixed(1)+'%');
  const warningHtml = doc.getElementById('dqWeightWarning').innerHTML;
  console.log('canh bao co hien khong:', warningHtml.length>0, '(expect true vi pct >60%)');
  console.log('noi dung canh bao:', warningHtml.replace(/<[^>]+>/g,'').trim());

  console.log('\n=== 4) KPI tong: so, delta, badge trang thai ===');
  console.log('KPI HTML:', doc.getElementById('dqKpiRow').textContent.replace(/\s+/g,' ').trim());
  const badge = doc.querySelector('#dqKpiRow .badge');
  console.log('badge class:', badge.className, '| text:', badge.textContent);

  console.log('\n=== 5) Radar chi co 1 series (target dashed + current) - khong con 3 mau asset ===');
  const svg = doc.querySelector('#dqRadarWrap svg');
  const polygons = svg.querySelectorAll('polygon');
  console.log('so polygon (3 grid + 1 target + 1 current = 5):', polygons.length);
  const targetPoly = polygons[3], currentPoly = polygons[4];
  console.log('target stroke-dasharray:', targetPoly.getAttribute('stroke-dasharray'), '(expect co net dut)');
  console.log('current fill:', currentPoly.getAttribute('fill'));
  console.log('aria-label:', svg.getAttribute('aria-label'));

  console.log('\n=== 6) Legend rut gon 2 dong (Hien tai/Muc tieu), khong con danh sach asset ===');
  const dqLegend = doc.querySelector('#dqRadarWrap').nextElementSibling;
  console.log('legend DQ:', dqLegend ? dqLegend.textContent.replace(/\s+/g,' ').trim() : 'KHONG TIM THAY');

  console.log('\n=== 7) Hover vao 1 truc hien tooltip: hien tai, muc tieu, chenh lech ===');
  const hit = svg.querySelector('[data-dq-dim="Uniqueness"]');
  hit.dispatchEvent(new win.Event('mouseenter', { bubbles: true }));
  const tooltip = doc.getElementById('radarTooltip');
  console.log('tooltip:', tooltip.textContent.replace(/\s+/g,' ').trim());
  hit.dispatchEvent(new win.Event('mouseleave', { bubbles: true }));

  console.log('\n=== 8) Info icon (ⓘ) hien cong thuc khi hover ===');
  const icon = doc.getElementById('dqInfoIcon');
  icon.dispatchEvent(new win.Event('mouseenter', { bubbles: true }));
  console.log('tooltip cong thuc:', tooltip.textContent.replace(/\s+/g,' ').trim());
  icon.dispatchEvent(new win.Event('mouseleave', { bubbles: true }));

  console.log('\n=== 9) Drilldown: bam nut mo/dong dung panel Lowest-Scoring Assets, click asset van mo duoc detail ===');
  console.log('panel truoc khi bam:', doc.getElementById('dqDrilldownPanel').style.display);
  win.toggleDQDrilldown();
  await wait(20);
  console.log('panel sau khi bam mo:', doc.getElementById('dqDrilldownPanel').style.display, '(expect block)');
  console.log('nut toggle an di:', doc.getElementById('dqDrilldownToggleBtn').style.display, '(expect none)');
  const legendItem = doc.querySelector('#ovRadarLegend [data-asset-id]');
  console.log('legend item (lowest-scoring asset) co data-asset-id:', !!legendItem, legendItem && legendItem.textContent);
  legendItem.dispatchEvent(new win.Event('click', { bubbles: true }));
  await wait(50);
  console.log('click vao legend mo dung Asset Detail:', doc.getElementById('view-detail').classList.contains('active'), '(expect true)');
  win.closeAssetDetailPage();
  await wait(20);
  win.toggleDQDrilldown();
  await wait(20);
  console.log('panel sau khi bam dong lai:', doc.getElementById('dqDrilldownPanel').style.display, '(expect none)');

  console.log('\n=== 10) Card nay KHONG doi theo filter bar (dung assetsMock, khong dung filtered) ===');
  const before = doc.getElementById('dqKpiRow').textContent;
  const ddStatus = doc.getElementById('ddOvStatus');
  ddStatus.dispatchEvent(new win.Event('click', { bubbles: true }));
  await wait(20);
  const input = [...ddStatus.querySelectorAll('input[type=checkbox]')].find(i=>i.value==='Critical');
  input.checked = true;
  input.dispatchEvent(new win.Event('change', { bubbles: true }));
  await wait(20);
  const after = doc.getElementById('dqKpiRow').textContent;
  console.log('KPI truoc/sau khi filter Critical GIONG NHAU (dung, vi khong theo filter):', before === after);

  console.log('\nDONE');
  process.exit(0);
})();
