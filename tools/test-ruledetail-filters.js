const { JSDOM } = require('jsdom');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const fileUrl = 'file:///' + path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/');

function newDom() {
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable', url: fileUrl, pretendToBeVisual: true });
  const win = dom.window;
  win.scrollTo = () => {};
  return win;
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));
async function click(win, el) { el.dispatchEvent(new win.Event('click', { bubbles: true })); await wait(30); }
function setSelect(win, el, value) { el.value = value; el.dispatchEvent(new win.Event('change', { bubbles: true })); }
function typeInto(win, el, value) { el.value = value; el.dispatchEvent(new win.Event('input', { bubbles: true })); }

async function main() {
  const errors = [];
  const win = newDom();
  console.error = (...a) => { errors.push(a.join(' ')); };
  await wait(500);
  const doc = win.document;

  let pass = 0, fail = 0;
  const chk = (label, cond) => { console.log((cond ? 'PASS' : 'FAIL') + '  ' + label); cond ? pass++ : fail++; };

  console.log('\n=== Mo Rule/Test Detail (Tang 4) tu bang rule cua 1 asset that fail nhieu ===');
  const rules = win.eval('rulesMock');
  const rule = rules.filter(r => r.totalFailedRuns > 0).sort((a,b) => b.totalFailedRuns - a.totalFailedRuns)[0];
  console.log('rule chon:', rule.id, rule.ruleName, 'totalFailedRuns=', rule.totalFailedRuns, 'failRatePct=', rule.failRatePct);
  win.openRuleDetail(rule.id);
  await wait(50);
  chk('view-test active', doc.getElementById('view-test').classList.contains('active'));
  chk('testTitle = ruleName', doc.getElementById('testTitle').textContent === rule.ruleName);

  console.log('\n=== Failure Trend: pill mac dinh 30D, doi sang 7D/90D ===');
  chk('pill 30D active mac dinh', doc.querySelector('#testTrendRangePills .time-pill[data-range="30"]').classList.contains('active'));
  const rate30 = doc.getElementById('testTrendCurrentRate').textContent;
  const peak30 = doc.getElementById('testTrendPeakRate').textContent;
  console.log('  30D: current=', rate30, 'peak=', peak30, 'points=', doc.getElementById('testTrendLine').getAttribute('points').split(' ').length);

  await click(win, doc.querySelector('#testTrendRangePills .time-pill[data-range="7"]'));
  chk('pill 7D active sau khi bam', doc.querySelector('#testTrendRangePills .time-pill[data-range="7"]').classList.contains('active'));
  chk('pill 30D het active', !doc.querySelector('#testTrendRangePills .time-pill[data-range="30"]').classList.contains('active'));
  const pts7 = doc.getElementById('testTrendLine').getAttribute('points').split(' ').filter(Boolean);
  chk('7D co 7 diem tren chart', pts7.length === 7);
  console.log('  7D: current=', doc.getElementById('testTrendCurrentRate').textContent, 'peak=', doc.getElementById('testTrendPeakRate').textContent, 'label=', doc.getElementById('testTrendAxisLabel').textContent);

  await click(win, doc.querySelector('#testTrendRangePills .time-pill[data-range="90"]'));
  const pts90 = doc.getElementById('testTrendLine').getAttribute('points').split(' ').filter(Boolean);
  chk('90D co 90 diem tren chart', pts90.length === 90);
  console.log('  90D: current=', doc.getElementById('testTrendCurrentRate').textContent, 'peak=', doc.getElementById('testTrendPeakRate').textContent);

  console.log('\n=== Lifecycle History dung chung time range voi Failure Trend ===');
  chk('note "Dang xem trong 90 ngay"', doc.getElementById('lifecycleRangeNote').textContent.includes('90 ngày'));
  const cycles90 = doc.querySelectorAll('#lifecycleCyclesBody .cycle-row').length;
  await click(win, doc.querySelector('#testTrendRangePills .time-pill[data-range="7"]'));
  chk('note doi theo pill: "Dang xem trong 7 ngay"', doc.getElementById('lifecycleRangeNote').textContent.includes('7 ngày'));
  const cycles7 = doc.querySelectorAll('#lifecycleCyclesBody .cycle-row').length;
  console.log('  so chu ky: 90D=', cycles90, '7D=', cycles7, '(7D phai <= 90D)');
  chk('7D co so chu ky <= 90D', cycles7 <= cycles90);

  console.log('\n=== Rule chua tung fail lan nao -> Lifecycle History rong dung cach ===');
  const cleanRule = rules.find(r => r.totalFailedRuns === 0);
  if (cleanRule) {
    win.openRuleDetail(cleanRule.id);
    await wait(50);
    chk('reset ve 30D khi mo rule khac', doc.querySelector('#testTrendRangePills .time-pill[data-range="30"]').classList.contains('active'));
    const emptyNote = doc.getElementById('lifecycleCyclesBody').textContent;
    console.log('  lifecycle body text:', emptyNote.trim().slice(0,80));
    chk('sampleRowsCount = "0 dong bi quarantine"', doc.getElementById('sampleRowsCount').textContent.trim() === '0 dòng bị quarantine');
    chk('Failed Records Sample hien empty state', doc.getElementById('sampleRowsBody').textContent.includes('Không tìm thấy dòng nào'));
  } else {
    console.log('  (khong tim thay rule nao co totalFailedRuns=0 trong mock hien tai, bo qua kiem tra nay)');
  }

  console.log('\n=== Mo lai rule co fail, kiem tra Failed Records Sample: search + 2 dropdown, AND filter ===');
  win.openRuleDetail(rule.id);
  await wait(50);
  chk('sampleTimeFilter mac dinh la 30', doc.getElementById('sampleTimeFilter').value === '30');
  chk('sampleSearchInput rong mac dinh', doc.getElementById('sampleSearchInput').value === '');
  chk('sampleColFilter co option dong voi cot that cua rule', [...doc.getElementById('sampleColFilter').options].some(o => o.value === rule.column));

  const countHeader = doc.getElementById('sampleRowsCount').textContent;
  const rowsBefore = doc.querySelectorAll('#sampleRowsBody tr').length;
  console.log('  header:', countHeader, '| so dong hien thi (30 ngay qua):', rowsBefore);

  setSelect(win, doc.getElementById('sampleTimeFilter'), 'all');
  await wait(30);
  const rowsAll = doc.querySelectorAll('#sampleRowsBody tr').length;
  chk('doi sang "Toan bo" so dong hien thi >= truoc do', rowsAll >= rowsBefore);
  chk('header KHONG doi khi filter (van la tong that)', doc.getElementById('sampleRowsCount').textContent === countHeader);

  typeInto(win, doc.getElementById('sampleSearchInput'), 'ZZZZZ-KHONG-TON-TAI');
  await wait(350); // qua debounce 300ms
  chk('search khong khop -> empty state dung text', doc.getElementById('sampleRowsBody').textContent.includes('Không tìm thấy dòng nào khớp điều kiện lọc'));
  chk('header van khong doi khi search rong ket qua', doc.getElementById('sampleRowsCount').textContent === countHeader);

  typeInto(win, doc.getElementById('sampleSearchInput'), '');
  await wait(350);
  const firstRowId = doc.querySelector('#sampleRowsBody tr td')?.textContent;
  if (firstRowId && firstRowId.startsWith('#')) {
    typeInto(win, doc.getElementById('sampleSearchInput'), firstRowId.slice(1));
    await wait(350);
    const rowsAfterIdSearch = doc.querySelectorAll('#sampleRowsBody tr').length;
    chk('search dung Row ID loc con dung 1 dong', rowsAfterIdSearch === 1);
  }

  console.log('\n=== Activity Log: dropdown loc theo loai hanh dong ===');
  const allItemsCount = doc.querySelectorAll('#activityLog .activity-item').length;
  console.log('  tong so activity item (Tat ca hanh dong):', allItemsCount);
  setSelect(win, doc.getElementById('activityTypeFilter'), 'system');
  await wait(30);
  const sysCount = doc.querySelectorAll('#activityLog .activity-item').length;
  const sysOnly = [...doc.querySelectorAll('#activityLog .act-type-tag')].every(t => t.textContent === 'Hệ thống');
  chk('loc "He thong" chi hien item He thong', sysOnly && sysCount > 0);

  setSelect(win, doc.getElementById('activityTypeFilter'), 'user');
  await wait(30);
  const userTags = [...doc.querySelectorAll('#activityLog .act-type-tag')];
  chk('loc "Nguoi dung" chi hien item Nguoi dung (hoac rong)', userTags.every(t => t.textContent === 'Người dùng'));

  setSelect(win, doc.getElementById('activityTypeFilter'), 'all');
  await wait(30);
  chk('quay lai "Tat ca" hien du lai so item ban dau', doc.querySelectorAll('#activityLog .activity-item').length === allItemsCount);

  console.log('\n=== Reset filter khi chuyen sang rule khac (khong giu state) ===');
  const rule2 = rules.filter(r => r.id !== rule.id && r.totalFailedRuns > 0)[0];
  // Doi state khoi mac dinh truoc khi chuyen rule
  await click(win, doc.querySelector('#testTrendRangePills .time-pill[data-range="7"]'));
  typeInto(win, doc.getElementById('sampleSearchInput'), 'abc');
  setSelect(win, doc.getElementById('activityTypeFilter'), 'note');
  await wait(350);
  win.openRuleDetail(rule2.id);
  await wait(50);
  chk('sau khi mo rule khac: pill ve lai 30D', doc.querySelector('#testTrendRangePills .time-pill[data-range="30"]').classList.contains('active'));
  chk('sau khi mo rule khac: search rong lai', doc.getElementById('sampleSearchInput').value === '');
  chk('sau khi mo rule khac: activity filter ve "Tat ca"', doc.getElementById('activityTypeFilter').value === 'all');

  console.log('\n=== Console errors tong hop ===');
  console.log('so console.error ghi nhan:', errors.length);
  errors.forEach(e => console.log('  -', e));
  chk('khong co console.error nao', errors.length === 0);

  console.log(`\n=== DONE: ${pass} PASS / ${fail} FAIL ===`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error('CRASH:', e); process.exit(1); });
