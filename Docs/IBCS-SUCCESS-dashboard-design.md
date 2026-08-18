# IBCS-SUCCESS Design Process for Data Health Dashboard

Áp dụng cho toàn bộ dashboard và mọi tab/chart mới trong hệ thống data-health-dashboard.html.

## 1) Thứ tự áp dụng bắt buộc

1. Say
   - Viết ra 1 câu thông điệp chính trước khi mở BI tool.
   - Ví dụ: "Tình trạng sức khỏe dữ liệu đang xấu đi do freshness và validity đang tụt ở các asset critical."

2. Condense
   - Chỉ giữ các chỉ số phục vụ câu chuyện chính.
   - Loại bỏ KPI, filter, hoặc annotation không phục vụ insight.

3. Check
   - Dữ liệu phải lấy từ 1 nguồn chuẩn (semantic layer / source of truth).
   - Không tự code logic khác nhau ở từng tool hoặc từng tab nếu không cần thiết.

4. Structure
   - Phác thảo layout theo Z/F-pattern trước khi build.
   - KPI trên-trái → xu hướng giữa → bảng chi tiết dưới-phải.
   - Filter cố định 1 vị trí, nhất quán trên mọi tab.

5. Express
   - Chọn đúng loại biểu đồ theo mục đích:
     - line cho xu hướng
     - stacked bar cho tỷ trọng
     - waterfall cho chênh lệch
     - tránh pie/donut/gauge/3D nếu không phục vụ đọc nhanh

6. Unify
   - Dùng một bảng màu, nhãn, định dạng số, và quy ước trạng thái thống nhất xuyên suốt mọi tab/report.
   - Ví dụ: Critical = đỏ, Degraded = cam, Healthy = xanh, Unknown = xám.

7. Simplify
   - Tắt hiệu ứng không cần thiết, border thừa, gridline quá nhiều, hover phức tạp, icon rườm rà.
   - Giữ đủ khoảng trắng và đọc giản lược.

8. Check + Say (review chéo)
   - Đối chiếu lại với report nguồn.
   - Kiểm tra tiêu đề và annotation có nói đúng insight chưa.
   - Nếu không, chỉnh lại story trước khi đóng dashboard.

## 2) Cốt lõi của quy trình

- Say + Structure = kể chuyện đúng và đúng chỗ
- Unify = ký hiệu nhất quán toàn hệ thống
- Condense / Check / Express / Simplify = thiết kế thị giác chính xác, không nhiễu

## 3) Quy tắc bắt buộc cho mỗi tab/chart mới

Khi thêm tab mới hoặc chart mới, phải trả lời các câu hỏi sau trước khi build:

- Câu chuyện chính là gì?
- Chỉ số nào thật sự cần xuất hiện?
- Dữ liệu đến từ nguồn chuẩn nào?
- Layout của tab sẽ theo pattern nào?
- Chọn biểu đồ nào cho câu chuyện này?
- Màu / format số / badge đã thống nhất chưa?
- Có phần thừa nào gây nhiễu không?
- Có review lại với report nguồn chưa?

## 4) Checklist khi review dashboard

- [ ] Tên tab phản ánh thông điệp chính
- [ ] KPI trong tab có phục vụ story không
- [ ] Không có metric thừa, không có phrase lạ
- [ ] Dữ liệu được tính từ cùng 1 nguồn chuẩn
- [ ] Hiển thị đúng loại biểu đồ cho mục đích
- [ ] Màu sắc và ml định dạng gắn với bộ quy chuẩn
- [ ] Không có gridline/border/hiệu ứng thừa
- [ ] Số liệu khớp nguồn và tiêu đề đúng insight

## 5) Mẫu áp dụng cho dashboard hiện tại

- Overview: tường thuật tổng quan về trạng thái dữ liệu, xu hướng trend, và phân bố health.
- Health: cho phép drill-down theo status/dimension, ưu tiên bảng chi tiết cho phân tích.
- Rule Lifecycle: trực quan hóa sự thay đổi trạng thái rule theo day-over-day.
- System Health: tập trung vào độ ổn định engine và source connection.
- Audit Log: phục vụ traceability, không quá nhiễu về thông tin.

## 6) Hướng dẫn dùng với AI / lập trình viên

Khi tôi hoặc bạn thêm tab/chart mới, hãy thực hiện theo trình tự sau:

1. Đặt message chính
2. Chỉ giữ KPI cần thiết
3. Xác nhận dữ liệu nguồn
4. Phác thảo layout
5. Chọn biểu đồ phù hợp
6. Áp dụng màu/định dạng đồng nhất
7. Loại bỏ nhiễu
8. Review cuối cùng bằng "Check + Say"

Nếu thiếu bước nào, dashboard chưa đạt chuẩn IBCS-SUCCESS.
