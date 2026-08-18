# Tab mới: Rule Lifecycle Tracking (Theo dõi vòng đời Rule theo ngày)

*Chốt lại theo trao đổi trong cuộc họp — dựa trên phần bạn đã xác nhận, có 1 điểm cần hỏi lại sếp để chắc chắn (đánh dấu bên dưới).*

## Nguyên tắc vận hành (đã thống nhất)

Mỗi ngày, mỗi rule (áp dụng cho 1 table/column cụ thể) có kết quả Pass hoặc Fail. Hệ thống **tự động** so sánh kết quả hôm nay với hôm qua để phân loại:

| Hôm qua | Hôm nay | Phân loại | Ý nghĩa |
|---|---|---|---|
| Fail | Pass | **Closed** | Đã hết lỗi |
| Fail | Fail | **Continue** | Tái phạm, vẫn đang lỗi |
| Pass | Fail | **New** | Lỗi mới phát sinh |
| Pass | Pass | (không hiển thị) | Bình thường |

Việc phân loại này **tính tự động cuối ngày** (sau khi có đủ kết quả chạy rule trong ngày) — đây là "nguồn sự thật" (source of truth) cho báo cáo, không phụ thuộc con người.

**Song song đó**, người xử lý (assignee) có 1 trạng thái thủ công riêng để tự theo dõi công việc của mình: khi họ sửa xong, họ tự tích **"Done"**. Trạng thái "Done" này KHÔNG tự động đổi phân loại Closed/Continue — nó chỉ là dấu hiệu "tôi nghĩ tôi đã sửa xong". Việc rule có thật sự chuyển sang Closed hay không vẫn phải chờ hệ thống tự động đánh giá lại vào ngày hôm sau. Cách này khớp đúng với ý bạn: "cần kết hợp song song" — tự động làm nguồn sự thật, con người tự đánh dấu tiến độ công việc của họ.

## Cấu trúc tab mới

### Phần 1 — Bảng tổng hợp (đầu tab, dạng KPI card)
- Số rule **New** trong ngày
- Số rule **Continue** (đang tái phạm)
- Số rule **Closed** trong ngày
- (tuỳ chọn) breakdown theo Domain/Owner

### Phần 2 — Bảng chi tiết (record-level), các cột:

| Cột | Ý nghĩa |
|---|---|
| Rule / Test | Tên rule kiểm tra |
| Table / Column | Bảng và cột dữ liệu bị áp dụng rule |
| Trạng thái hôm qua → hôm nay | Pass/Fail của 2 ngày liên tiếp |
| Phân loại (New / Continue / Closed) | Tính tự động theo bảng trên |
| Thời điểm phát hiện lỗi | *(đổi tên từ "thời gian phê duyệt" theo bạn giải thích lại — xem ghi chú bên dưới)* |
| Trạng thái xử lý thủ công | Open / In Progress / Done — do người xử lý tự tích |
| Thời gian đánh dấu Done | Khi assignee tự tích xong |
| Người xử lý (Assignee) | Ai đang chịu trách nhiệm sửa |
| Chủ sở hữu hệ thống (System Owner) | Ai chịu trách nhiệm hệ thống/bảng dữ liệu chứa rule này |
| Chủ sở hữu Business Rule | Ai chịu trách nhiệm định nghĩa nghiệp vụ của rule này |
| Người tạo Rule | Ai đã khai báo/tạo rule này trong hệ thống DQS |

## 2 điểm cần xác nhận thêm với sếp (nói rõ để bạn hỏi lại cho chắc)

**Điểm 1 — "Người tạo mẫu tin":** Bạn nghiêng về ý "người tạo Rule trong hệ thống DQS" (đã đưa vào bảng ở cột "Người tạo Rule" trên). Nhưng vì bạn cũng chưa chắc 100%, tôi vẫn giữ khả năng đây có thể là ý khác: "người/hệ thống đã tạo ra dòng dữ liệu gốc bị đánh giá là fail" (ví dụ dòng dữ liệu customer bị lỗi được insert bởi hệ thống CRM nào, ai nhập). Đây là 2 thông tin hoàn toàn khác nhau về mặt kỹ thuật (1 cái nằm trong hệ thống DQS, 1 cái nằm trong hệ thống nguồn chứa dữ liệu). Nếu cần cả 2, sẽ phải thêm 1 cột riêng "Nguồn gốc bản ghi lỗi" — bạn hỏi lại sếp câu cụ thể: *"Cột này để biết ai tạo ra RULE, hay ai tạo ra DÒNG DỮ LIỆU bị lỗi?"* rồi báo tôi để tôi thêm đúng cột.

**Điểm 2 — "Thời gian phê duyệt":** Bạn giải thích lại là ý sếp muốn nói **thời điểm lỗi xảy ra** (không phải "phê duyệt" theo nghĩa ký duyệt). Tôi đã đổi tên cột thành "Thời điểm phát hiện lỗi" theo đúng ý này. Nhưng vì từ "phê duyệt" trong tiếng Việt hành chính thường mang nghĩa rất khác (ký duyệt/approval), nếu có dịp bạn xác nhận lại 1 câu với sếp cho chắc: *"Cột 'thời gian phê duyệt' là thời điểm lỗi xảy ra, hay là thời điểm có người ký duyệt việc đóng issue?"* — để tránh sau này làm sai hướng.

Tôi đã thiết kế theo đúng những gì bạn hiểu để không làm chậm tiến độ; khi có câu trả lời chính xác từ sếp, chỉ cần đổi tên/thêm cột, không phải làm lại từ đầu.
