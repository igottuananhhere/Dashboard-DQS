# PROMPT — Refactor tab "Rule Lifecycle" (Data Health / DQS Dashboard)

> Copy toàn bộ nội dung dưới đây và paste vào agent code (Claude Code / Cursor) đang mở repo dashboard.

---

## CONTEXT

Tôi đang có tab **Rule Lifecycle** trong dashboard **Data Health** (nguồn dữ liệu: OpenMetadata test cases / data quality rules). Tab hiện tại gồm:

- 3 KPI card: `New — lỗi mới phát sinh`, `Continue — đang tái phạm`, `Closed — đã hết lỗi`
- Bảng `Rule Lifecycle — Chi tiết theo Rule` với các cột:
  `Rule / Test | Table / Column | Hôm qua → Hôm nay | Phân loại | Thời điểm phát hiện lỗi | Trạng thái xử lý thủ công | Thời gian đánh dấu Done | Người xử lý | Chủ sở hữu hệ thống | Chủ sở hữu Business Rule | Người tạo Rule`
- Filter: `Phân loại`, `Domain`, `Owner`, `Trạng thái xử lý`, `Clear`, `Hôm nay`

## VẤN ĐỀ HIỆN TẠI

1. **Cột `Hôm qua → Hôm nay` sai về mặt ngữ nghĩa.** Rule không chạy theo ngày cố định — nó chạy theo schedule (có thể nhiều lần/ngày, hoặc vài ngày/lần). Nhãn "hôm qua/hôm nay" tạo cảm giác sai và vô nghĩa khi rule không chạy trong ngày.
2. **Cột `Trạng thái xử lý thủ công` là nguồn gây nhiễu.** Nó do người tự bấm, không đồng bộ với kết quả test thật.
3. **Xuất hiện dữ liệu tự mâu thuẫn:** rule `stock_adjustment_098_freshness` có `Fail → Fail` nhưng trạng thái `Done`; ngược lại `staff_freshness` có `Fail → Pass` mà vẫn `Open`. Hai cột không hề được reconcile → dashboard mất độ tin cậy.
4. **Thiếu thứ quan trọng nhất:** không biết **một rule đã bị lỗi lặp lại bao nhiêu lần dù đã từng được sửa xong**. Đây mới là chỉ số đo chất lượng thật của data pipeline.

---

## YÊU CẦU THỰC HIỆN

### 1. Đổi cột `Hôm qua → Hôm nay` → `Kết quả 2 lần chạy gần nhất`

- Đổi nhãn cột thành: **`Lần chạy trước → Lần chạy mới nhất`**
- So sánh dựa trên **2 execution gần nhất theo `test_case_result.timestamp`**, KHÔNG dựa vào mốc ngày lịch.
- Mỗi badge `Pass` / `Fail` phải có **tooltip hiển thị timestamp thực tế** của lần chạy đó (định dạng `MMM d, yyyy HH:mm (UTC+7)`).
- Xử lý edge case bắt buộc:
  - Chỉ có 1 lần chạy → hiển thị `— → Fail` với nhãn nhỏ `first run`
  - Chưa có lần chạy nào → `No data` (màu xám), không rơi vào bất kỳ phân loại nào
  - Lần chạy mới nhất cũ hơn `Aborted` / `Queued` → hiển thị state `Stale` kèm cảnh báo

### 2. XOÁ hoàn toàn cột `Trạng thái xử lý thủ công`

- Xoá cột khỏi bảng, xoá filter `Trạng thái xử lý`, xoá cột `Thời gian đánh dấu Done`.
- Xoá luôn field này khỏi data model / API response nếu chỉ tab này dùng. Nếu field còn được tab khác dùng, giữ ở backend nhưng không expose ra UI tab này.
- **Không thay bằng một field thủ công khác.** Toàn bộ trạng thái phải được **suy ra từ kết quả test (derived state)**.

### 3. Thay bằng state machine tự động (fix mâu thuẫn Fail→Fail nhưng Done)

Tính `lifecycle_state` hoàn toàn từ chuỗi kết quả test, theo đúng bảng sau:

| State | Điều kiện | Màu |
|---|---|---|
| `New` | Lần chạy trước `Pass` (hoặc không tồn tại) → mới nhất `Fail`, **và rule này chưa từng Fail trước đó** | Cam |
| `Reopened` | Mới nhất `Fail`, và trước đó rule đã từng có ít nhất 1 lần chuyển `Fail → Pass` (tức đã từng được sửa xong rồi lỗi lại) | **Đỏ đậm — mức ưu tiên cao nhất** |
| `Ongoing` | `Fail → Fail` liên tục, chưa từng Pass kể từ lần Fail đầu tiên của chu kỳ hiện tại | Đỏ |
| `Recovered` | `Fail → Pass` ở lần chạy mới nhất | Xanh lá |
| `Stable` | Pass liên tục ≥ N lần chạy (N cấu hình được, default 3) | Xám nhạt |
| `No data` | Không có kết quả test | Xám |

**Quan trọng:** `Reopened` phải tách khỏi `Ongoing`. Đây chính là case mà trước đây bị đánh `Done` sai — giờ hệ thống tự phát hiện thay vì phụ thuộc con người.

### 4. Thêm nhóm cột đo mức độ tái phát (yêu cầu cốt lõi)

Thêm các cột mới, tính trên toàn bộ history của `test_case_result` (mặc định lookback 90 ngày, cấu hình được):

| Cột | Định nghĩa chính xác |
|---|---|
| `Số lần tái phát` (`recurrence_count`) | Số lần rule chuyển từ `Pass → Fail` trong khoảng lookback. `0` = chưa từng tái phát; `≥1` = đã sửa xong rồi lỗi lại. **Đây là cột quan trọng nhất, cho phép sort giảm dần và là default sort.** |
| `Chu kỳ lỗi hiện tại` (`current_fail_streak`) | Số lần chạy Fail liên tiếp tính đến hiện tại |
| `Lần tái phát gần nhất` | Timestamp của lần `Pass → Fail` mới nhất |
| `Khoảng cách tái phát TB` (`avg_days_between_recurrence`) | Số ngày trung bình giữa các lần tái phát. Càng nhỏ = càng bất ổn |
| `Tổng số lần Fail / Tổng số lần chạy` | Tỷ lệ fail, ví dụ `12 / 40 (30%)` — dùng làm chỉ số độ tin cậy của rule |
| `Thời gian khắc phục TB` (`avg_recovery_time`) | Trung bình khoảng thời gian từ lần Fail đầu chu kỳ đến lần Pass đầu tiên sau đó (MTTR thực, tính bằng dữ liệu, không cần ai bấm Done) |

Thêm badge trực quan trên cột `Rule / Test`:

- `recurrence_count = 0` → không badge
- `1–2` → badge vàng `↻ 2`
- `≥3` → badge đỏ `↻ 5 · Chronic` (rule bất ổn dai dẳng, cần escalate)

### 5. Thêm mini-timeline (sparkline trạng thái)

Thêm cột **`Lịch sử 30 lần chạy`**: dãy ô vuông nhỏ, mỗi ô = 1 lần chạy, đỏ = Fail / xanh = Pass / xám = không chạy. Hover hiện timestamp + kết quả. Đây là cách đọc nhanh nhất để thấy pattern lỗi (lỗi rời rạc vs lỗi liên tục vs lỗi theo chu kỳ tuần).

### 6. Cập nhật KPI card

Thay 3 card cũ bằng 4 card:

1. **`New`** — lỗi phát sinh lần đầu
2. **`Reopened`** — đã sửa xong nhưng lỗi lại *(card nhấn mạnh, viền đỏ)*
3. **`Ongoing`** — đang fail liên tục, chưa khắc phục
4. **`Recovered`** — vừa hết lỗi ở lần chạy mới nhất

Mỗi card:
- Kèm delta so với kỳ trước (ví dụ `▲ +2 vs kỳ trước`)
- Click vào card → filter bảng theo state tương ứng
- Bỏ dòng mô tả dạng câu văn ở dưới, thay bằng 1 dòng insight có giá trị: `X rule chiếm 80% tổng số lần fail` (Pareto)

### 7. Cập nhật filter

- **Xoá:** `Trạng thái xử lý`
- **Đổi:** `Phân loại` → `Trạng thái` (New / Reopened / Ongoing / Recovered / Stable / No data)
- **Thêm:**
  - `Số lần tái phát` (slider hoặc chọn nhanh: `0` / `1–2` / `≥3`)
  - `Loại rule` (freshness / completeness / uniqueness / validity / accuracy — parse từ tên test hoặc `testDefinition`)
  - `Khoảng thời gian` (7 / 30 / 90 ngày / custom) — thay nút `Hôm nay` cố định
  - `Chỉ hiện rule đang Fail` (toggle)

### 8. Đề xuất bổ sung để tab này hoàn chỉnh

Triển khai thêm những phần sau (nếu scope lớn, hãy làm theo thứ tự ưu tiên này và báo tôi những phần bạn bỏ lại):

**Ưu tiên cao**
- **Row expand / drill-down:** click 1 rule → panel mở ra hiện: định nghĩa test, threshold, SQL, biểu đồ giá trị metric theo thời gian (kèm đường threshold), danh sách lần chạy gần nhất, lineage của table bị ảnh hưởng.
- **Bảng `Top rule bất ổn`:** đứng riêng phía trên, top 10 theo `recurrence_count`, đây là danh sách hành động cho tuần.
- **Group by Table:** nhiều rule fail trên cùng 1 table → thường là 1 nguyên nhân gốc (pipeline upstream). Cần collapse theo table để thấy điều đó.
- **Export CSV/Excel** theo đúng filter đang áp dụng.

**Ưu tiên trung bình**
- **Ownership accountability:** panel tổng hợp theo `Chủ sở hữu Business Rule`: số rule đang fail, tổng recurrence, MTTR trung bình. Dùng cho review vận hành định kỳ.
- **Heatmap tái phát:** trục X = ngày, trục Y = rule, ô đỏ = fail. Phát hiện seasonality (ví dụ luôn fail thứ Hai → job weekly có vấn đề).
- **Severity / Criticality:** nếu rule có tier hoặc table có tag `Tier1/Gold`, thêm cột `Mức độ nghiêm trọng` và cho sort. Một rule fail trên bảng Tier1 khác hoàn toàn một rule fail trên bảng sandbox.
- **Empty state & loading skeleton** cho bảng và từng card.

**Ưu tiên thấp (nice to have)**
- Cột `Ghi chú` dạng free-text theo rule (không phải trạng thái) để lưu root cause đã tìm được — chỉ là annotation, tuyệt đối không dùng để suy ra lifecycle state.
- Link `Xem trong OpenMetadata` mở trực tiếp trang test case.
- Cảnh báo `Rule chưa chạy quá X ngày` (silent failure — rule tưởng là Pass nhưng thực ra không chạy).

---

## RÀNG BUỘC KỸ THUẬT

- **Single source of truth = kết quả test tự động.** Không có field thủ công nào được tham gia vào việc quyết định lifecycle state.
- Toàn bộ metric tái phát nên tính ở tầng backend/SQL (window function trên `test_case_result` sắp theo `timestamp`), không tính ở client, để bảng vẫn nhanh khi số rule tăng.
- Gợi ý logic: dùng `LAG(status) OVER (PARTITION BY test_case_id ORDER BY timestamp)` để phát hiện transition; `recurrence_count = COUNT(*) WHERE prev_status='Success' AND status='Failed'`.
- Giữ nguyên design system hiện tại (font, spacing, badge style, màu). Chỉ thêm 1 màu mới: đỏ đậm cho `Reopened`.
- Bảng phải virtualize hoặc phân trang nếu > 100 dòng; giữ được horizontal scroll với cột `Rule / Test` **sticky bên trái**.
- Đảm bảo accessibility: badge không chỉ phân biệt bằng màu, phải có text/icon kèm theo.

## OUTPUT MONG ĐỢI

1. Liệt kê các file cần sửa trước khi sửa.
2. Cập nhật data model / API contract (kèm ví dụ JSON response mới).
3. SQL/query tính các metric tái phát.
4. Code UI cho bảng + KPI card + filter mới.
5. Cuối cùng: bảng đối chiếu `trước → sau` để tôi review từng thay đổi.
