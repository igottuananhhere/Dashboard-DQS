const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');
const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: fileUrl, pretendToBeVisual: true });
const win = dom.window;
win.scrollTo = () => {};

async function dumpAsset(id, label) {
  win.openAssetDetail(id, 'health', null);
  await new Promise(r => setTimeout(r, 50));
  const doc = win.document;
  console.log(`\n========== DRAWER: ${label} (${id}) ==========`);
  console.log('Header:', doc.getElementById('drawerHeaderTitle').textContent, '| Nav:', doc.getElementById('drawerNavIndex').textContent);
  console.log('FQN:', doc.getElementById('drawerFqnText').textContent);
  console.log('Badges:', [...doc.querySelectorAll('.drawer-body .badge')].slice(0,2).map(b=>b.textContent).join(' | '));
  const drawerBody = doc.getElementById('drawerBody');
  console.log('Health score:', drawerBody.querySelector('.health-score').textContent.replace(/\s+/g,' ').trim());
  console.log('Meta row:', drawerBody.querySelector('.meta-row').textContent.replace(/\s+/g,' ').trim());
  console.log('KPI grid:', [...doc.querySelectorAll('.drawer-kpi')].map(k=>k.textContent.replace(/\s+/g,' ').trim()).join(' || '));
  console.log('Dimension rows:');
  doc.querySelectorAll('.drawer-body .dim-row').forEach(r=>console.log('   ', r.textContent.replace(/\s+/g,' ').trim()));
  console.log('Trend chart:', doc.querySelector('.drawer-body svg') ? 'SVG line chart rendered' : doc.querySelector('.drawer-body .empty-note')?.textContent);
  console.log('Rule table rows:', doc.querySelectorAll('#drawerRuleTable tbody tr').length);
  doc.querySelectorAll('#drawerRuleTable tbody tr').forEach(tr=>console.log('   ', tr.textContent.replace(/\s+/g,' | ').trim()));
  console.log('Metadata:', [...doc.querySelectorAll('.drawer-body .kv')].map(k=>k.textContent.replace(/\s+/g,' ').trim()).join(' || '));
}

setTimeout(async () => {
  const assets = win.eval('assetsMock');
  const critical = assets.find(a => a.name === 'customer');
  const unknown = assets.find(a => a.healthStatus === 'Unknown');
  await dumpAsset(critical.id, 'CRITICAL asset');
  await dumpAsset(unknown.id, 'UNKNOWN asset');
  process.exit(0);
}, 600);
