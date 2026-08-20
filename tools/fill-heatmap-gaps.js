// Bổ sung rule cho các asset-dimension đang chỉ có 0-1 rule (gây ô "—" xám hoặc 0/100 cực đoan
// trên heatmap "Chất lượng theo Asset × Dimension") — KHÔNG đụng tới 3 asset cố tình không có rule
// nào (payment/subscriptions_057/kyc_check, xem tools/add-rule-coverage-gap.js) vì đó là kịch bản
// demo cho bug "Rule Coverage" đã fix riêng.
// Target % mỗi dimension lấy từ asset.healthDimensions[dim] có sẵn trong mock-assets.json (giữ đúng
// "cá tính" từng asset đã thiết kế: asset nào từng định là tệ/khá/tốt thì vẫn tệ/khá/tốt sau khi có
// nhiều rule hơn) — chỉ đổi CÁCH suy ra điểm (từ nhiều rule pass/fail) thay vì để 1 rule/0 rule.
//
// QUAN TRỌNG: dimensionScore() trong index.html tính theo latestResult (Pass/Fail) của TỪNG rule,
// không phải theo mật độ ngày Success/Failed bên trong history30 của 1 rule — nên latestResult của
// mỗi rule phải được GÁN TRỰC TIẾP theo tỉ lệ mục tiêu (bao nhiêu/${N} rule Pass), rồi mới sinh
// history30 cho KHỚP với quyết định đó — không được suy latestResult ngược lại từ history ngẫu
// nhiên (dò lại thấy version đầu làm vậy: 30 ngày random hiếm khi rơi đúng ngày cuối theo tỉ lệ
// mong muốn, khiến rule "Completeness=3%" vẫn ra toàn Pass).
const fs = require('fs');
const path = require('path');

const assetsFile = path.join(__dirname, '..', 'JSON', 'mock-assets.json');
const rulesFile = path.join(__dirname, '..', 'JSON', 'mock-rules.json');
const assetsData = JSON.parse(fs.readFileSync(assetsFile, 'utf8'));
const rulesData = JSON.parse(fs.readFileSync(rulesFile, 'utf8'));

const EXCLUDE_ASSET_IDS = ['asset_004', 'asset_013', 'asset_017']; // payment / subscriptions_057 / kyc_check

const RADAR_DIMS = ['Accuracy', 'Completeness', 'Uniqueness', 'Validity', 'Consistency', 'Freshness'];
const DIM_TO_RULETYPE = { Accuracy: 'accuracy', Completeness: 'completeness', Uniqueness: 'uniqueness', Validity: 'validity', Consistency: 'consistency', Freshness: 'freshness' };
const DIM_TO_COLUMN = { Accuracy: 'amount', Completeness: 'created_at', Uniqueness: 'id', Validity: 'status', Consistency: 'total', Freshness: 'updated_at' };

const OWNER_POOL = ['Data Platform', 'Content', 'Finance Ops', 'Analytics', 'Marketing Ops'];
const BIZ_OWNER_POOL = ['Sales Ops', 'Finance Ops', 'Operations Ops', 'Marketing Ops', 'Risk Ops', 'Compliance Ops'];
const CREATOR_POOL = ['Analytics', 'Content', 'Marketing Ops', 'Finance Ops', 'Data Platform'];

// PRNG tất định (mulberry32) seed theo assetId+dim -> chạy lại script luôn ra cùng 1 kết quả,
// không phụ thuộc Math.random() (đổi mỗi lần chạy sẽ làm mock "nhấp nháy" giữa các lần generate).
function seededRng(seedStr) {
  let h = 1779033703 ^ seedStr.length;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 30 mốc lịch sử 09:00/21:00 UTC+7, kết thúc đúng "2026-08-18T09:00:00+07:00" (mốc tường thuật cố
// định của toàn bộ file demo) — cùng convention đã dùng ở các rule gốc.
function history30Timestamps() {
  const stamps = [];
  const end = new Date('2026-08-18T09:00:00+07:00');
  for (let i = 29; i >= 0; i--) {
    const d = new Date(end.getTime() - i * 12 * 3600 * 1000);
    stamps.push(d.toISOString().replace('.000Z', '+07:00').replace('Z', ''));
  }
  return stamps;
}

// endsOnFail = quyết định TRƯỚC (từ tỉ lệ mục tiêu), không suy ngược từ lịch sử — history30 chỉ là
// "diễn giải" hợp lý cho quyết định đó: cụm fail ở cuối nếu endsOnFail, hoặc noise thấp + có thể có
// 1 cụm fail cũ đã hồi phục (asset "Recovered") nếu không.
function buildHistory(endsOnFail, rng) {
  const stamps = history30Timestamps();
  const statuses = new Array(30).fill('Success');
  if (endsOnFail) {
    const streakLen = 1 + Math.floor(rng() * 4); // 1..4 ngày fail liên tiếp tính đến hiện tại
    for (let i = 0; i < streakLen; i++) statuses[29 - i] = 'Failed';
    // Có thể có thêm 1 đợt fail cũ trước đó (tạo recurrenceCount>=2 cho vài rule, không phải tất cả)
    if (rng() < 0.35) {
      const oldLen = 1 + Math.floor(rng() * 3);
      const start = Math.floor(rng() * Math.max(1, 29 - streakLen - oldLen));
      for (let i = 0; i < oldLen; i++) statuses[start + i] = 'Failed';
    }
  } else if (rng() < 0.4) {
    // Rule "đang Pass" nhưng từng có 1 đợt fail đã hồi phục — tạo dữ liệu Recovered/chronic đa dạng.
    const oldLen = 1 + Math.floor(rng() * 3);
    const start = Math.floor(rng() * 20);
    for (let i = 0; i < oldLen; i++) statuses[start + i] = 'Failed';
  }
  return stamps.map((ts, i) => ({ timestamp: ts, status: statuses[i] }));
}

function lifecycleStateFor(latest, previous, recurrenceCount) {
  if (latest === 'Pass' && previous === 'Pass' && recurrenceCount === 0) return 'Stable';
  if (latest === 'Pass' && previous === 'Fail') return 'Recovered';
  if (latest === 'Fail' && previous === 'Pass') return recurrenceCount > 1 ? 'Reopened' : 'New';
  if (latest === 'Fail' && previous === 'Fail') return 'Ongoing';
  return 'Stable';
}

function buildRule({ asset, dim, idx, rng, endsOnFail, anchor }) {
  const ruleType = DIM_TO_RULETYPE[dim];
  const column = (anchor && anchor.column) || DIM_TO_COLUMN[dim];
  const suffix = idx === 0 ? '' : `_${idx + 1}`;
  const ruleName = `${asset.name}_${ruleType}${suffix}`;
  const history30 = buildHistory(endsOnFail, rng);
  const toResult = s => (s === 'Success' ? 'Pass' : 'Fail');
  const latestResult = toResult(history30[history30.length - 1].status); // luôn khớp endsOnFail
  const previousResult = toResult(history30[history30.length - 2].status);
  const latestRunAt = history30[history30.length - 1].timestamp;
  const previousRunAt = history30[history30.length - 2].timestamp;

  // recurrenceCount = số "đợt fail" khác nhau trong lịch sử (transition Success->Failed), currentFailStreak
  // = số lần fail liên tiếp tính từ cuối lịch sử trở về trước — cùng định nghĩa với dữ liệu gốc.
  let recurrenceCount = 0;
  for (let i = 0; i < history30.length; i++) {
    if (history30[i].status === 'Failed' && (i === 0 || history30[i - 1].status !== 'Failed')) recurrenceCount++;
  }
  let currentFailStreak = 0;
  for (let i = history30.length - 1; i >= 0 && history30[i].status === 'Failed'; i--) currentFailStreak++;

  const totalFailedRuns = history30.filter(h => h.status === 'Failed').length;
  const totalRuns = history30.length;
  const failRatePct = Math.round((totalFailedRuns / totalRuns) * 1000) / 10;
  const isChronic = recurrenceCount >= 3;
  const lifecycleState = lifecycleStateFor(latestResult, previousResult, recurrenceCount);

  let lastRecurrenceAt = null, firstFailOfCurrentCycleAt = null;
  const failedIdx = [];
  history30.forEach((h, i) => { if (h.status === 'Failed') failedIdx.push(i); });
  if (failedIdx.length) {
    lastRecurrenceAt = history30[failedIdx[failedIdx.length - 1]].timestamp;
    let start = failedIdx.length - 1;
    while (start > 0 && failedIdx[start - 1] === failedIdx[start] - 1) start--;
    firstFailOfCurrentCycleAt = history30[failedIdx[start]].timestamp;
  }
  const avgRecoveryHours = recurrenceCount > 0 ? Math.round((6 + rng() * 30) * 10) / 10 : null;
  const avgDaysBetweenRecurrence = recurrenceCount >= 2 ? Math.round(2 + rng() * 8) : null;

  const owner = (anchor && anchor.owner) || asset.owner || pick(rng, OWNER_POOL);
  const systemOwner = (anchor && anchor.systemOwner) || pick(rng, OWNER_POOL);
  const businessRuleOwner = (anchor && anchor.businessRuleOwner) || pick(rng, BIZ_OWNER_POOL);
  const ruleCreator = (anchor && anchor.ruleCreator) || pick(rng, CREATOR_POOL);

  return {
    id: `rule_gap_${asset.id}_${ruleType}_${idx}`,
    assetId: asset.id,
    ruleName,
    testCaseFqn: `${asset.fqn}.${column}.${ruleName}`,
    table: asset.name,
    tableFqn: asset.fqn,
    column,
    service: asset.service,
    domain: asset.domain,
    ruleType,
    healthDimension: dim,
    tier: asset.tier,
    owner,
    systemOwner,
    businessRuleOwner,
    ruleCreator,
    previousResult,
    latestResult,
    previousRunAt,
    latestRunAt,
    lifecycleState,
    recurrenceCount,
    currentFailStreak,
    lastRecurrenceAt,
    firstFailOfCurrentCycleAt,
    totalFailedRuns,
    totalRuns,
    failRatePct,
    avgRecoveryHours,
    avgDaysBetweenRecurrence,
    isChronic,
    history30,
  };
}

// Rule KHÔNG thuộc 27 asset đang xử lý (giữ nguyên nội dung gốc) — chỉ regenerate rule của 27 asset
// này cho toàn bộ 6 dimension, để 1 nguồn công thức duy nhất áp dụng nhất quán (không trộn 1 rule cũ
// + N rule mới với 2 cách tính khác nhau như bản đầu đã làm sai).
const untouchedRules = rulesData.rules.filter(r => EXCLUDE_ASSET_IDS.includes(r.assetId));
const oldRulesByAssetDim = {};
rulesData.rules.forEach(r => {
  const key = r.assetId + '|' + r.healthDimension;
  (oldRulesByAssetDim[key] = oldRulesByAssetDim[key] || []).push(r);
});

const newRules = untouchedRules.slice();
assetsData.assets.forEach(asset => {
  if (EXCLUDE_ASSET_IDS.includes(asset.id)) return;
  RADAR_DIMS.forEach(dim => {
    const key = asset.id + '|' + dim;
    const rng = seededRng(key);
    const N = 3 + Math.floor(rng() * 3); // 3..5 rule/asset-dimension
    const targetPct = (asset.healthDimensions && asset.healthDimensions[dim] != null) ? asset.healthDimensions[dim] : 70;
    const passCount = Math.max(0, Math.min(N, Math.round((targetPct / 100) * N)));
    const decisions = shuffle(
      Array.from({ length: N }, (_, i) => i < passCount), // true = Pass
      rng
    );
    const anchor = (oldRulesByAssetDim[key] || [])[0] || null;
    decisions.forEach((isPass, idx) => {
      newRules.push(buildRule({ asset, dim, idx, rng, endsOnFail: !isPass, anchor }));
    });
  });
});

console.log('Rules total:', newRules.length, '(was', rulesData.rules.length, ')');
rulesData.rules = newRules;

fs.writeFileSync(rulesFile, JSON.stringify(rulesData, null, 2) + '\n', 'utf8');

const jsContent = fs.readFileSync(path.join(__dirname, '..', 'JSON', 'mock-rules.js'), 'utf8');
const newJs = jsContent.replace(/window\.MOCK_RULES_DATA\s*=\s*[\s\S]*;\s*$/, 'window.MOCK_RULES_DATA = ' + JSON.stringify(rulesData, null, 2) + ';\n');
fs.writeFileSync(path.join(__dirname, '..', 'JSON', 'mock-rules.js'), newJs, 'utf8');
console.log('mock-rules.json + mock-rules.js updated.');
