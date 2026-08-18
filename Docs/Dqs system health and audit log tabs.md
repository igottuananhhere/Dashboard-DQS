# 2 tab bổ sung: System Health & Audit Log

*Bổ sung theo đề xuất "nên có sớm" — theo dõi sức khỏe vận hành của chính hệ thống DQS (khác với sức khỏe dữ liệu) và lịch sử thay đổi cấu hình.*

## Tab 1: System Health (sức khỏe vận hành Rule Engine / Data Source)

**Mục đích:** Trả lời câu hỏi "bản thân hệ thống DQS có đang chạy đúng không" — khác hẳn các tab khác (đang trả lời "dữ liệu có tốt không"). Nếu Rule Engine tự nó lỗi hoặc mất kết nối tới nguồn dữ liệu, các tab kia vẫn hiển thị số cũ trông có vẻ ổn nhưng thực chất không kiểm tra gì mới — tab này để phát hiện đúng rủi ro đó.

### Phần 1 — KPI card
- **Last Full Scan** — thời điểm engine chạy xong vòng quét gần nhất, kèm chỉ báo còn "tươi" hay đã quá hạn (ví dụ xanh nếu < 1 giờ, đỏ nếu > lịch chạy dự kiến).
- **Job Success Rate** — % job chạy thành công trong 24h/7 ngày gần nhất.
- **Failed Jobs (24h)** — số lượng job lỗi gần đây.
- **Data Sources Connected** — bao nhiêu / tổng số nguồn dữ liệu đang kết nối tốt (ví dụ 4/5).

### Phần 2 — Bảng "Job Run History"
Cột: Job Name, Nguồn dữ liệu (Source), Thời gian bắt đầu, Thời gian kết thúc, Thời lượng chạy, Trạng thái (Success/Failed), Thông báo lỗi (nếu Failed), Loại kích hoạt (Scheduled/Manual).

### Phần 3 — Bảng "Data Source Connections"
Cột: Tên nguồn, Loại (Postgres/Snowflake/BigQuery/Redshift...), Trạng thái (Connected/Disconnected), Lần đồng bộ thành công gần nhất, Độ trễ (latency).

## Tab 2: Audit Log (lịch sử thay đổi cấu hình)

**Mục đích:** Trả lời "ai đã thay đổi gì trong hệ thống, khi nào" — phục vụ governance/audit nội bộ, khác với Activity Log của từng issue riêng lẻ (activity log gắn theo 1 issue cụ thể, Audit Log này ghi mọi thay đổi cấu hình toàn hệ thống).

### Bảng chính
Cột: Thời gian, Người thực hiện, Hành động (Tạo Rule / Sửa ngưỡng (threshold) / Xoá Rule / Đổi Owner / Gán Issue / Đổi trạng thái Issue / Sửa cấu hình cảnh báo...), Đối tượng bị ảnh hưởng (tên Rule/Table/Trường cấu hình), Giá trị cũ → Giá trị mới, Ghi chú/lý do (nếu có).

### Filter
Theo người thực hiện, theo loại hành động, theo khoảng thời gian, theo đối tượng (rule/table cụ thể).

## Ràng buộc chung khi thiết kế/code

- Không sửa các tab đã có (Overview, Health, Asset Detail, Rule Lifecycle Tracking).
- Giữ đúng phong cách/spacing/màu sắc đang dùng ở các tab trước.
- Đây là 2 tab có thể chỉ dành cho vai trò Admin/Data Platform xem — nút hành động hoặc toàn bộ tab có thể cần ẩn với người dùng thường, cần xác nhận lại phân quyền khi triển khai thật.