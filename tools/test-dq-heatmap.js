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

(async () => {
  await wait(600);
  const doc = win.document;

  console.log('=== 1) 6 con so tren radar KHOP voi 6 con so cua Health by Dimension truoc khi xoa ===');
  const assetsMock = win.eval('assetsMock');
  const RADAR_DIMS = win.eval('RADAR_DIMS');
  const { scores } = win.eval('weightedDimensionScores(assetsMock, null)');
  const radarTexts = [...doc.querySelectorAll('#dqRadarWrap text[data-dq-dim]')];
  RADAR_DIMS.forEach(dim=>{
    const expected = scores[dim]==null ? '—' : String(Math.round(scores[dim]));
    const el = radarTexts.find(t=>t.getAttribute('data-dq-dim')===dim);
    const tspan = el.querySelector('tspan');
    console.log(`  ${dim}: radar hien "${tspan.textContent}" (expect ${expected}) -> ${tspan.textContent===expected?'KHOP':'SAI'}`);
  });

  console.log('\n=== 2) Khong con id/ham cua Health by Dimension cu ===');
  console.log('con ovDimFillAccuracy?', !!doc.getElementById('ovDimFillAccuracy'), '(expect false)');
  console.log('con "ovDimFill" hoac "ovDimNum" trong toan file?', /ovDimFill|ovDimNum/.test(html), '(expect false)');

  console.log('\n=== 3) So dong heatmap = min(dqHeatmapRange mac dinh=20, filtered.length) ===');
  let rows = doc.querySelectorAll('#dqHeatmapWrap .hm-name');
  console.log('khong filter:', rows.length, '(expect 20, vi mac dinh Top 20 va tong 30 asset)');

  console.log('\n=== 4) Thu tu cot heatmap = thu tu truc radar ===');
  const heads = [...doc.querySelectorAll('#dqHeatmapWrap .hm-head')].slice(1).map(h=>h.title);
  console.log('cot heatmap:', heads.join(', '));
  console.log('khop thu tu RADAR_DIMS:', JSON.stringify(heads)===JSON.stringify(RADAR_DIMS));

  console.log('\n=== 5) Filter con rong -> empty state ===');
  // Tim 1 to hop domain+owner chac chan cho ra 0 asset (kiem tra bang du lieu that, khong doan mo).
  const emptyCombo = (()=>{
    for(const d of [...new Set(assetsMock.map(a=>a.domain))]){
      for(const o of [...new Set(assetsMock.map(a=>a.owner))]){
        if(!assetsMock.some(a=>a.domain===d && a.owner===o)) return {d,o};
      }
    }
    return null;
  })();
  console.log('to hop rong tim duoc:', JSON.stringify(emptyCombo));
  const ddDomain = doc.getElementById('ddOvDomain');
  ddDomain.dispatchEvent(new win.Event('click', { bubbles: true }));
  await wait(20);
  const ownerDd = doc.getElementById('ddOvOwner');
  const input = [...ddDomain.querySelectorAll('input[type=checkbox]')].find(i => i.value === emptyCombo.d);
  input.checked = true; input.dispatchEvent(new win.Event('change', { bubbles: true }));
  await wait(20);
  ownerDd.dispatchEvent(new win.Event('click', { bubbles: true }));
  await wait(20);
  const ownerInput = [...ownerDd.querySelectorAll('input[type=checkbox]')].find(i => i.value === emptyCombo.o);
  ownerInput.checked = true; ownerInput.dispatchEvent(new win.Event('change', { bubbles: true }));
  await wait(20);
  console.log('ovCountBadge:', doc.getElementById('ovCountBadge').textContent, '(expect 0 / 30)');
  console.log('heatmap empty state:', doc.getElementById('dqHeatmapWrap').textContent.trim());
  win.clearOverviewFilters();
  await wait(20);

  console.log('\n=== 6) Click 1 o heatmap -> mo dung asset, cuon toi dung dimension, khong loi console ===');
  rows = doc.querySelectorAll('#dqHeatmapWrap .hm-name');
  const firstAssetId = rows[0].dataset.assetId;
  const cell = doc.querySelector(`#dqHeatmapWrap .hm-cell[data-asset-id="${firstAssetId}"][data-scroll-dim="Freshness"]`);
  cell.dispatchEvent(new win.Event('click', { bubbles: true }));
  await wait(30);
  console.log('view-detail active:', doc.getElementById('view-detail').classList.contains('active'), '(expect true)');
  const expectedName = assetsMock.find(a=>a.id===firstAssetId).name;
  console.log('dung asset mo:', doc.getElementById('detailTitle').textContent, '(expect', expectedName, ') ->', doc.getElementById('detailTitle').textContent===expectedName?'KHOP':'SAI');
  const focused = doc.activeElement;
  console.log('phan tu dang focus la diem Freshness tren radar chi tiet:', focused && focused.dataset && focused.dataset.dim === 'Freshness');
  console.log('tooltip hien dung dimension:', doc.getElementById('radarTooltip').innerHTML.includes('Freshness'));

  console.log('\n=== 7) Khong con console error ===');
  console.log('so loi:', errors.length);
  errors.forEach(e => console.log('  -', e));

  console.log('\nDONE');
  process.exit(0);
})();
