// Thêm field recordCount vào mock-assets.json để tính weighted average thật cho Overview
// "Data Quality Score" (dimension_score = Σ(score_i * recordCount_i) / Σ(recordCount_i)).
// Seeded PRNG để lần chạy lại cho ra đúng số cũ (không dùng Math.random).
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'JSON', 'mock-assets.json');
const data = JSON.parse(fs.readFileSync(file, 'utf8'));

let seed = 42;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}

const TIER_BASE = { Tier1: 4_000_000, Tier2: 700_000, Tier3: 60_000 };

data.assets.forEach(a => {
  const base = TIER_BASE[a.tier] || 100_000;
  const variance = 0.6 + rand() * 0.8; // 0.6x - 1.4x
  a.recordCount = Math.round(base * variance);
});

// Outlier chủ đích: web_sessions (Tier3, event log) có khối lượng khổng lồ dù tier thấp — minh hoạ
// đúng rủi ro nêu trong yêu cầu (asset lớn có thể "nuốt" điểm số, không liên quan tới tier).
const outlier = data.assets.find(a => a.name === 'web_sessions');
if (outlier) outlier.recordCount = 90_000_000;

fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf8');

const total = data.assets.reduce((s, a) => s + a.recordCount, 0);
console.log('Tong recordCount:', total.toLocaleString());
data.assets
  .slice()
  .sort((a, b) => b.recordCount - a.recordCount)
  .slice(0, 5)
  .forEach(a => console.log(' ', a.name, a.recordCount.toLocaleString(), (a.recordCount / total * 100).toFixed(1) + '%'));
