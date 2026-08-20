// Đồng bộ lại các field tĩnh của asset (testsTotal/testsFailed/healthStatus/healthScore/
// failingDimensions) cho khớp với bộ rule THẬT vừa sinh lại (tools/fill-heatmap-gaps.js) — các field
// này trước giờ là số tĩnh chép tay trong mock-assets.json, không tự tính lại, nên sau khi đổi số
// lượng rule sẽ lệch nếu không đồng bộ (ảnh hưởng cột "Tests fail/tổng" ở Asset Detail và các
// assertion trong runCoverageChecks so khớp asset<->rule).
// KHÔNG đụng 3 asset cố tình 0 rule (payment/subscriptions_057/kyc_check) — giữ đúng kịch bản demo
// bug Rule Coverage.
const fs = require('fs');
const path = require('path');

const assetsFile = path.join(__dirname, '..', 'JSON', 'mock-assets.json');
const rulesFile = path.join(__dirname, '..', 'JSON', 'mock-rules.json');
const assetsData = JSON.parse(fs.readFileSync(assetsFile, 'utf8'));
const rulesData = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));

const EXCLUDE_ASSET_IDS = ['asset_004', 'asset_013', 'asset_017'];
const RADAR_DIMS = ['Accuracy', 'Completeness', 'Uniqueness', 'Validity', 'Consistency', 'Freshness'];
const THRESHOLD_AMBER = 70, THRESHOLD_GREEN = 90;

const byAsset = {};
rulesData.rules.forEach(r => { (byAsset[r.assetId] = byAsset[r.assetId] || []).push(r); });

function dimensionScore(assetId, dim) {
  const rules = (byAsset[assetId] || []).filter(r => r.healthDimension === dim);
  const evaluated = rules.filter(r => r.latestResult != null);
  if (!evaluated.length) return null;
  return Math.round(evaluated.filter(r => r.latestResult === 'Pass').length / evaluated.length * 100);
}
function statusForScore(score) {
  if (score == null) return 'Unmonitored';
  if (score >= THRESHOLD_GREEN) return 'Healthy';
  if (score >= THRESHOLD_AMBER) return 'Warning';
  return 'Critical';
}

assetsData.assets.forEach(asset => {
  if (EXCLUDE_ASSET_IDS.includes(asset.id)) return;
  const rules = byAsset[asset.id] || [];
  const dimScores = {};
  RADAR_DIMS.forEach(d => { dimScores[d] = dimensionScore(asset.id, d); });
  const measured = RADAR_DIMS.map(d => dimScores[d]).filter(v => v != null);
  const overall = measured.length ? Math.round(measured.reduce((s, v) => s + v, 0) / measured.length) : null;

  asset.healthDimensions = dimScores;
  asset.healthScore = overall;
  asset.healthStatus = overall == null ? 'Unknown' : statusForScore(overall);
  asset.failingDimensions = RADAR_DIMS.filter(d => dimScores[d] != null && dimScores[d] < THRESHOLD_AMBER);
  asset.testsTotal = rules.length;
  asset.testsFailed = rules.filter(r => r.latestResult === 'Fail').length;
});

fs.writeFileSync(assetsFile, JSON.stringify(assetsData, null, 2) + '\n', 'utf8');
const jsContent = fs.readFileSync(path.join(__dirname, '..', 'JSON', 'mock-assets.js'), 'utf8');
const newJs = jsContent.replace(/window\.MOCK_ASSETS_DATA\s*=\s*[\s\S]*;\s*$/, 'window.MOCK_ASSETS_DATA = ' + JSON.stringify(assetsData, null, 2) + ';\n');
fs.writeFileSync(path.join(__dirname, '..', 'JSON', 'mock-assets.js'), newJs, 'utf8');
console.log('mock-assets.json + mock-assets.js synced from rules.');
