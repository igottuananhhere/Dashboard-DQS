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
async function keydown(win, el, key, shiftKey) { el.dispatchEvent(new win.KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true })); await wait(30); }

async function main() {
  const errors = [];
  const win = newDom();
  const origError = console.error;
  console.error = (...a) => { errors.push(a.join(' ')); };

  await new Promise(r => setTimeout(r, 500));
  const doc = win.document;

  console.log('\n=== selfTestDetail(): kiem tra "Vi du kiem tra Asset Detail" trong COVERAGE.md ===');
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
    const custStates = customerRules.sort((a,b)=>a.ruleName.localeCompare(b.ruleName)).map(r=>r.ruleName+'='+r.lifecycleState);
    console.log('   customer rule states:', custStates.join(', '));

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

    const healthyOk = assets.filter(a=>a.healthStatus==='Healthy').every(a=>(byAsset[a.id]||[]).every(r=>r.latestResult!=='Fail'));
    const healthyCount = assets.filter(a=>a.healthStatus==='Healthy').length;
    chk(`asset Healthy khong co rule Fail (${healthyCount}/${healthyCount})`, healthyOk);

    const criticalOk = assets.filter(a=>a.healthStatus==='Critical').every(a=>(byAsset[a.id]||[]).some(r=>r.latestResult==='Fail'));
    const criticalCount = assets.filter(a=>a.healthStatus==='Critical').length;
    chk(`asset Critical co >=1 rule Fail (${criticalCount}/${criticalCount})`, criticalOk);

    console.log(`Tong: ${p} pass / ${f} fail`);
  }

  console.log('\n=== grep: khong con alert() nao trong file ===');
  console.log('so alert() con lai:', (html.match(/\balert\(/g) || []).length, '(expect 0)');

  console.log('\n=== Mo drawer tu Needs Attention (asset dau tien trong danh sach) ===');
  {
    const firstRow = doc.querySelector('#needsAttentionBody [data-asset-id]');
    const assetId = firstRow.dataset.assetId;
    await click(win, firstRow);
    console.log('drawer.open class:', doc.getElementById('assetDrawer').classList.contains('open'));
    console.log('overlay.open class:', doc.getElementById('assetDrawerOverlay').classList.contains('open'));
    console.log('location.hash:', win.location.hash);
    console.log('drawerHeaderTitle:', doc.getElementById('drawerHeaderTitle').textContent);
    console.log('drawerNavIndex:', doc.getElementById('drawerNavIndex').textContent);
    console.log('drawerRuleTable rows:', doc.querySelectorAll('#drawerRuleTable tbody tr').length);
    console.log('active element is drawer (focus moved in):', doc.activeElement && doc.activeElement.id === 'assetDrawer');
  }

  console.log('\n=== Chuyen 5 asset bang Truoc/Sau, kiem tra khong throw, chart khong ve de ===');
  {
    for (let i = 0; i < 5; i++) {
      const nextBtn = doc.getElementById('drawerNextBtn');
      if (nextBtn.disabled) { console.log('  (het danh sach, dung lai o buoc', i, ')'); break; }
      await click(win, nextBtn);
      const svgCount = doc.querySelectorAll('.drawer-body svg').length;
      console.log(`  step ${i+1}: asset=${doc.getElementById('drawerHeaderTitle').textContent}, nav=${doc.getElementById('drawerNavIndex').textContent}, svg count trong drawer=${svgCount} (expect 1, khong duoc cong don)`);
    }
  }

  console.log('\n=== Dong drawer roi mo lai ===');
  {
    await click(win, doc.getElementById('assetDrawer').querySelector('.drawer-close'));
    await new Promise(r => setTimeout(r, 30));
    console.log('sau khi dong: drawer.open class:', doc.getElementById('assetDrawer').classList.contains('open'), '(expect false)');
    console.log('sau khi dong: location.hash:', JSON.stringify(win.location.hash), '(expect rong)');
    console.log('sau khi dong: focus tra ve dung phan tu vua click:', doc.activeElement === win.__lastClickedRow || 'n/a (kiem tra thu cong o duoi)');
  }

  console.log('\n=== Mo asset Unknown (asset thu 8 trong danh sach) - khong duoc throw / NaN ===');
  {
    const unknownAsset = win.eval('assetsMock').find(a => a.healthStatus === 'Unknown');
    console.log('asset Unknown chon de test:', unknownAsset.id, unknownAsset.name);
    win.openAssetDetail(unknownAsset.id, 'health', null);
    await new Promise(r => setTimeout(r, 30));
    const bodyHtml = doc.getElementById('drawerBody').innerHTML;
    console.log('drawer mo thanh cong, khong throw. healthScore hien thi:', doc.querySelector('.health-score').textContent.trim());
    console.log('co chua "NaN"?', bodyHtml.includes('NaN'));
    console.log('co chua "undefined"?', bodyHtml.includes('undefined'));
    console.log('empty-note cho trend chart (history30d rong):', bodyHtml.includes('Chưa có dữ liệu lịch sử'));
    console.log('so rule cua asset Unknown (tat ca lifecycleState=No data):', doc.querySelectorAll('#drawerRuleTable tbody tr').length);
  }

  console.log('\n=== Ap filter roi click asset trong bang da loc - drawer van mo duoc (test bug listener) ===');
  {
    win.closeAssetDrawer();
    await new Promise(r => setTimeout(r, 30));
    win.switchTab('health');
    const ddStatus = doc.getElementById('ddHealthStatus');
    await click(win, ddStatus);
    const input = [...ddStatus.querySelectorAll('input[type=checkbox]')].find(i => i.value === 'Critical');
    input.checked = true;
    input.dispatchEvent(new win.Event('change', { bubbles: true }));
    const rowsAfterFilter = doc.querySelectorAll('#healthTableBody [data-asset-id]');
    console.log('so dong sau khi loc Critical:', rowsAfterFilter.length, '(expect 6)');
    await click(win, rowsAfterFilter[0]);
    console.log('drawer mo duoc sau khi loc:', doc.getElementById('assetDrawer').classList.contains('open'), '(expect true - neu false la bug listener)');
    console.log('asset dang mo:', doc.getElementById('drawerHeaderTitle').textContent);
    win.closeAssetDrawer();
  }

  console.log('\n=== Deep link: mo tab moi voi hash co san ===');
  {
    const someAsset = win.eval('assetsMock')[4];
    const win2 = newDom('asset=' + encodeURIComponent(someAsset.id));
    await new Promise(r => setTimeout(r, 500));
    const doc2 = win2.document;
    console.log('mo tab moi voi #asset=' + someAsset.id + ' -> drawer.open:', doc2.getElementById('assetDrawer').classList.contains('open'), '(expect true)');
    console.log('dung asset:', doc2.getElementById('drawerHeaderTitle').textContent, '(expect ' + someAsset.name + ')');

    console.log('\n=== Nhan Back (popstate/hashchange gia lap bang xoa hash) -> drawer dong ===');
    win2.location.hash = '';
    await new Promise(r => setTimeout(r, 30));
    console.log('sau khi xoa hash: drawer.open:', doc2.getElementById('assetDrawer').classList.contains('open'), '(expect false)');
    win2.close();
  }

  console.log('\n=== Esc dong duoc drawer; focus tra ve dung dong vua click ===');
  {
    const row = doc.querySelector('#needsAttentionBody [data-asset-id]');
    row.id = 'test-trigger-row';
    row.tabIndex = -1;
    await click(win, row);
    await new Promise(r => setTimeout(r, 30));
    console.log('drawer mo:', doc.getElementById('assetDrawer').classList.contains('open'));
    await keydown(win, doc.getElementById('assetDrawer'), 'Escape');
    await new Promise(r => setTimeout(r, 30));
    console.log('sau Esc: drawer.open:', doc.getElementById('assetDrawer').classList.contains('open'), '(expect false)');
    console.log('focus tra ve dung dong vua click:', doc.activeElement === row, '(expect true)');
  }

  console.log('\n=== Console errors tong hop ===');
  console.log('so console.error ghi nhan:', errors.length);
  errors.forEach(e => console.log('  -', e));

  console.log('\n=== DONE ===');
  process.exit(0);
}

main();
