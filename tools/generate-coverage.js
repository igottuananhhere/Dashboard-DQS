// Sinh lại Docs/COVERAGE.md từ đúng dữ liệu hiện có trong JSON/mock-assets.json + mock-rules.json —
// chạy lại file này mỗi khi sửa mock để COVERAGE.md không bao giờ lệch với dữ liệu thật.
const fs = require('fs');
const path = require('path');

const assets = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'JSON', 'mock-assets.json'), 'utf8')).assets;
const rules = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'JSON', 'mock-rules.json'), 'utf8')).rules;

const countBy = (arr, key) => arr.reduce((m, x) => { const v = x[key]; if (v != null) m[v] = (m[v] || 0) + 1; return m; }, {});
const countArrField = (arr, key, val) => arr.filter(x => Array.isArray(x[key]) && x[key].includes(val)).length;
const fmt = obj => Object.entries(obj).map(([k, v]) => `\`${k}\`=${v}`).join(', ');

const byAsset = {};
rules.forEach(r => { (byAsset[r.assetId] = byAsset[r.assetId] || []).push(r); });

const ruleCountDist = {};
assets.forEach(a => { const n = (byAsset[a.id] || []).length; ruleCountDist[n] = (ruleCountDist[n] || 0) + 1; });
const ruleCountKeys = Object.keys(ruleCountDist).map(Number).sort((a, b) => a - b);

const recurBucket = r => r.recurrenceCount === 0 ? '0' : r.recurrenceCount <= 2 ? '1-2' : '>=3';

const dims = ['Accuracy', 'Completeness', 'Consistency', 'Freshness', 'Uniqueness', 'Validity'];
const failingDim = {}; dims.forEach(d => failingDim[d] = countArrField(assets, 'failingDimensions', d));

const rl = countBy(rules, 'lifecycleState');
const rd = countBy(rules, 'domain');
const rs = countBy(rules, 'service');
const ro = countBy(rules, 'owner');
const rt = countBy(rules, 'ruleType');
const rhd = countBy(rules, 'healthDimension');
const rtier = countBy(rules, 'tier');
const rbo = countBy(rules, 'businessRuleOwner');
const rb = countBy(rules.map(r => ({ b: recurBucket(r) })), 'b');
const chronicCount = rules.filter(r => r.recurrenceCount >= 3).length;
const latestResultCounts = countBy(rules.map(r => ({ lr: r.latestResult == null ? 'None' : r.latestResult })), 'lr');

const ah = countBy(assets, 'healthStatus');
const ad = countBy(assets, 'domain');
const as_ = countBy(assets, 'service');
const ao = countBy(assets, 'owner');
const at = countBy(assets, 'tier');

const assetsWithRule = assets.filter(a => (byAsset[a.id] || []).length > 0).length;
const assetsWithoutRule = assets.length - assetsWithRule;

const md = `# COVERAGE — mock data (${assets.length} assets + ${rules.length} rules)

> Sinh tat dinh tu gen.py + tools/generate-coverage.js, anchor 2026-08-18T09:00:00+07:00. Moi con so duoi day la 1 assertion phai dung.

## Assets (tab Overview / Health)

- **healthStatus**: ${fmt(ah)}
- **domain**: ${fmt(ad)}
- **service**: ${fmt(as_)}
- **owner**: ${fmt(ao)}
- **tier**: ${fmt(at)}
- **failing healthDimension**: ${fmt(failingDim)}

## Rules (tab Rule Lifecycle)

- **lifecycleState**: ${fmt(rl)}
- **domain**: ${fmt(rd)}
- **service**: ${fmt(rs)}
- **owner**: ${fmt(ro)}
- **ruleType**: ${fmt(rt)}
- **healthDimension**: ${fmt(rhd)}
- **tier**: ${fmt(rtier)}
- **businessRuleOwner**: ${fmt(rbo)}
- **recurrenceBucket**: ${fmt(rb)}
- **chronic (recurrence>=3)**: ${chronicCount} rules
- **latestResult**: ${fmt(latestResultCounts)} (null = rule chua chay)

## Lien ket Asset <-> Rule (dung cho Asset Detail)

- Join bang \`rule.assetId === asset.id\` (hoac \`rule.table === asset.name\`).
- So rule moi asset: ${ruleCountKeys.map(n => `\`${n} rule\`=${ruleCountDist[n]} asset`).join(', ')}
- Asset co rule: ${assetsWithRule}/${assets.length} — Asset KHONG co rule nao: ${assetsWithoutRule} (dung cho Rule Coverage KPI o tab Overview).
- \`asset.testsTotal\` / \`asset.testsFailed\` **duoc suy ra tu chinh danh sach rule** -> phai khop 100%.
- Nhat quan: asset \`Healthy\` khong co rule nao dang Fail; asset \`Critical\` luon co >=1 rule Fail.
- Moi dimension trong \`asset.failingDimensions\` deu co it nhat 1 rule tuong ung dang Fail.

## Vi du kiem tra Asset Detail

- \`customer\` (Critical): 3/3 test fail, 3 rule -> \`customer_completeness\`=Reopened, \`customer_freshness\`=Ongoing, \`customer_uniqueness\`=Reopened
- \`orders\` (Warning): 4/6 test fail, 6 rule -> \`orders_freshness\`=Ongoing, \`orders_completeness\`=Ongoing, \`orders_uniqueness\`=New, \`orders_validity\`=Stable, \`orders_accuracy\`=Reopened, \`orders_consistency\`=Recovered
- \`order_items\` (Healthy): 0/5 test fail, 5 rule -> \`order_items_completeness\`=Stable, \`order_items_freshness\`=Stable, \`order_items_uniqueness\`=Recovered, \`order_items_validity\`=Stable, \`order_items_accuracy\`=Recovered
`;

fs.writeFileSync(path.join(__dirname, '..', 'Docs', 'COVERAGE.md'), md, 'utf8');
console.log('COVERAGE.md regenerated.');
console.log('assetsWithRule:', assetsWithRule, '| assetsWithoutRule:', assetsWithoutRule);
