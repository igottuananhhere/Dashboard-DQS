const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

function newDom(initialHash) {
  const url = fileUrl + (initialHash ? '#' + initialHash : '');
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url, pretendToBeVisual: true });
  const win = dom.window;
  win.scrollTo = () => {};
  win.navigator.clipboard = { writeText: () => Promise.resolve() };
  Object.defineProperty(win, 'isSecureContext', { value: true });
  return win;
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));
async function click(win, el) { el.dispatchEvent(new win.Event('click', { bubbles: true })); await wait(30); }
async function keydown(win, el, key) { el.dispatchEvent(new win.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })); await wait(30); }

async function main() {
  const errors = [];
  const win = newDom();
  console.error = (...a) => { errors.push(a.join(' ')); };

  await wait(500);
  const doc = win.document;

  console.log('\n=== selfTestDetail(): "Vi du kiem tra Asset Detail" trong COVERAGE.md ===');
  {
    const assets = win.eval('assetsMock'), rules = win.eval('rulesMock');
    const byAsset = {};
    rules.forEach(r => (byAsset[r.assetId] = byAsset[r.assetId] || []).push(r));
    let p = 0, f = 0;
    const chk = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); cond ? p++ : f++; };

    const customer = assets.find(a => a.name === 'customer');
    const customerRules = byAsset[customer.id] || [];
    chk(`customer testsFailed/Total = ${customer.testsFailed}/${customer.testsTotal} (expect 3/3), rules=${customerRules.length} (expect 3)`,
      customer.testsFailed === 3 && customer.testsTotal === 3 && customerRules.length === 3);

    const orders = assets.find(a => a.name === 'orders');
    const ordersRules = byAsset[orders.id] || [];
    chk(`orders testsFailed/Total = ${orders.testsFailed}/${orders.testsTotal} (expect 4/6), rules=${ordersRules.length} (expect 6)`,
      orders.testsFailed === 4 && orders.testsTotal === 6 && ordersRules.length === 6);

    const orderItems = assets.find(a => a.name === 'order_items');
    const oiRules = byAsset[orderItems.id] || [];
    chk(`order_items testsFailed/Total = ${orderItems.testsFailed}/${orderItems.testsTotal} (expect 0/5), rules=${oiRules.length} (expect 5)`,
      orderItems.testsFailed === 0 && orderItems.testsTotal === 5 && oiRules.length === 5);

    let joinOk = 0;
    assets.forEach(a => { const rs = byAsset[a.id] || []; if (rs.length === a.testsTotal && rs.filter(r=>r.latestResult==='Fail').length===a.testsFailed) joinOk++; });
    chk(`toan bo 30 asset: testsTotal khop voi so rule join duoc (${joinOk}/30)`, joinOk === 30);

    console.log(`Tong: ${p} pass / ${f} fail`);
  }

  console.log('\n=== grep: khong con alert() nao goi thuc su ===');
  const realAlertCalls = (html.match(/[\(=]\s*alert\(/g) || []).length;
  console.log('so lenh goi alert() thuc su:', realAlertCalls, '(expect 0)');

  console.log('\n=== Mo Asset Detail (full page) tu Needs Attention ===');
  {
    const firstRow = doc.querySelector('#needsAttentionBody [data-asset-id]');
    await click(win, firstRow);
    console.log('view-detail active:', doc.getElementById('view-detail').classList.contains('active'), '(expect true)');
    console.log('view-main active:', doc.getElementById('view-main').classList.contains('active'), '(expect false)');
    console.log('detailTitle:', doc.getElementById('detailTitle').textContent);
    console.log('detailNavIndex:', doc.getElementById('detailNavIndex').textContent);
    console.log('KPI grid cells:', doc.querySelectorAll('#detailKpiGrid .kpi').length, '(expect 4)');
    console.log('rule table rows:', doc.querySelectorAll('#detailRuleBody tr').length);
    console.log('trend svg rendered:', !!doc.querySelector('#detailTrendChart svg'));
  }

  console.log('\n=== Chuyen 5 asset bang Truoc/Sau ===');
  {
    for (let i = 0; i < 5; i++) {
      const nextBtn = doc.getElementById('detailNextBtn');
      if (nextBtn.disabled) { console.log('  (het danh sach, dung o buoc', i, ')'); break; }
      await click(win, nextBtn);
      const svgCount = doc.querySelectorAll('#detailTrendChart svg').length;
      console.log(`  step ${i+1}: asset=${doc.getElementById('detailTitle').textContent}, nav=${doc.getElementById('detailNavIndex').textContent}, svg count=${svgCount} (expect 1, khong cong don)`);
    }
  }

  console.log('\n=== Quay lai (breadcrumb) roi mo lai ===');
  {
    await click(win, doc.querySelector('.breadcrumb a'));
    console.log('sau khi back: view-detail active:', doc.getElementById('view-detail').classList.contains('active'), '(expect false)');
    console.log('sau khi back: view-main active:', doc.getElementById('view-main').classList.contains('active'), '(expect true)');
    console.log('sau khi back: location.hash:', JSON.stringify(win.location.hash), '(expect rong)');
  }

  console.log('\n=== Mo asset Unknown - khong throw / NaN / undefined ===');
  {
    const unknownAsset = win.eval('assetsMock').find(a => a.healthStatus === 'Unknown');
    win.openAssetDetail(unknownAsset.id, 'health');
    await wait(50);
    const pageHtml = doc.getElementById('view-detail').innerHTML;
    console.log('asset:', unknownAsset.id, unknownAsset.name);
    console.log('view-detail active:', doc.getElementById('view-detail').classList.contains('active'));
    console.log('healthScore hien thi:', doc.getElementById('detailScore').textContent, '(expect —)');
    console.log('co chua "NaN"?', pageHtml.includes('NaN'));
    console.log('co chua "undefined"?', pageHtml.includes('undefined'));
    console.log('trend empty-state:', pageHtml.includes('Chưa có dữ liệu lịch sử'));
    console.log('so rule (tat ca No data):', doc.querySelectorAll('#detailRuleBody tr').length);
  }

  console.log('\n=== Ap filter roi click asset trong bang da loc - van mo duoc (test bug listener) ===');
  {
    win.closeAssetDetailPage();
    await wait(30);
    win.switchTab('health');
    const ddStatus = doc.getElementById('ddHealthStatus');
    await click(win, ddStatus);
    const input = [...ddStatus.querySelectorAll('input[type=checkbox]')].find(i => i.value === 'Critical');
    input.checked = true;
    input.dispatchEvent(new win.Event('change', { bubbles: true }));
    const rowsAfterFilter = doc.querySelectorAll('#healthTableBody [data-asset-id]');
    console.log('so dong sau khi loc Critical:', rowsAfterFilter.length, '(expect 6)');
    await click(win, rowsAfterFilter[0]);
    console.log('mo duoc sau khi loc:', doc.getElementById('view-detail').classList.contains('active'), '(expect true)');
    console.log('asset dang mo:', doc.getElementById('detailTitle').textContent);
  }

  console.log('\n=== Deep link: mo tab moi voi hash co san ===');
  {
    const someAsset = win.eval('assetsMock')[4];
    const win2 = newDom('asset=' + encodeURIComponent(someAsset.id));
    await wait(500);
    const doc2 = win2.document;
    console.log('mo tab moi voi #asset=' + someAsset.id + ' -> view-detail active:', doc2.getElementById('view-detail').classList.contains('active'), '(expect true)');
    console.log('dung asset:', doc2.getElementById('detailTitle').textContent, '(expect ' + someAsset.name + ')');

    console.log('\n=== Nhan Back (gia lap: xoa hash) -> ve trang chinh ===');
    win2.location.hash = '';
    await wait(30);
    console.log('sau khi xoa hash: view-detail active:', doc2.getElementById('view-detail').classList.contains('active'), '(expect false)');
    win2.close();
  }

  console.log('\n=== Esc quay lai duoc trang chinh ===');
  {
    const row = doc.querySelector('#needsAttentionBody [data-asset-id]') || doc.querySelector('[data-asset-id]');
    win.switchTab('overview');
    await click(win, row);
    console.log('mo:', doc.getElementById('view-detail').classList.contains('active'));
    await keydown(win, doc, 'Escape');
    console.log('sau Esc: view-detail active:', doc.getElementById('view-detail').classList.contains('active'), '(expect false)');
  }

  console.log('\n=== Console errors tong hop ===');
  console.log('so console.error ghi nhan:', errors.length);
  errors.forEach(e => console.log('  -', e));

  console.log('\n=== DONE ===');
  process.exit(0);
}

main();
