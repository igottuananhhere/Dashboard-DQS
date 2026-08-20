// Tạo kịch bản "asset chưa có rule nào" cho card Rule Coverage — chọn 3 asset Healthy (testsFailed=0,
// failingDimensions=[]) để xoá rule không vi phạm bất biến "asset Critical luôn có >=1 rule Fail".
// Sau khi chạy: phải chạy lại tools/generate-coverage.js để đồng bộ Docs/COVERAGE.md + assertion.
const fs = require('fs');
const path = require('path');

const assetsFile = path.join(__dirname, '..', 'JSON', 'mock-assets.json');
const rulesFile = path.join(__dirname, '..', 'JSON', 'mock-rules.json');
const assetsData = JSON.parse(fs.readFileSync(assetsFile, 'utf8'));
const rulesData = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));

const TARGET_IDS = ['asset_013', 'asset_017', 'asset_004']; // subscriptions_057, kyc_check, payment — đều Healthy

const before = rulesData.rules.length;
rulesData.rules = rulesData.rules.filter(r => !TARGET_IDS.includes(r.assetId));
console.log('Rules removed:', before - rulesData.rules.length, '-> total rules:', rulesData.rules.length);

assetsData.assets.forEach(a => {
  if (TARGET_IDS.includes(a.id)) {
    a.testsTotal = 0;
    a.testsFailed = 0;
    console.log('Zeroed rules for', a.id, a.name);
  }
});

fs.writeFileSync(assetsFile, JSON.stringify(assetsData, null, 2) + '\n', 'utf8');
fs.writeFileSync(rulesFile, JSON.stringify(rulesData, null, 2) + '\n', 'utf8');
