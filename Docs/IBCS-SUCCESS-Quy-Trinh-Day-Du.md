# Quy Tắc & Quy Trình Thiết Kế Report/Dashboard Chuẩn IBCS (SUCCESS Framework)

> **Nguồn gốc**: Dựa trên khung SUCCESS của IBCS (International Business Communication Standards) — bộ tiêu chuẩn được IBCS Association công bố miễn phí theo giấy phép Creative Commons (CC BY-SA). Từ 2024, các nguyên tắc này đã trở thành nền tảng cho tiêu chuẩn ISO 24896 (Notation for Business Reporting).
>
> Tài liệu này là bản diễn giải và cụ thể hóa thành **quy trình làm việc nội bộ**, áp dụng cho Power BI / Superset / Tableau — không phải bản dịch nguyên văn tài liệu gốc.

---

## Mục lục
1. Tổng quan khung SUCCESS
2. Quy trình 8 bước thiết kế 1 report/dashboard mới
3. Chi tiết từng nguyên tắc (kèm before/after, áp dụng Power BI)
4. Checklist review trước khi publish
5. Bảng tra nhanh loại biểu đồ theo mục đích phân tích
6. Bảng quy ước màu/ký hiệu chuẩn (Unify)

---

## 1. Tổng quan khung SUCCESS

| # | Nhóm | Bản chất | Pillar | Câu hỏi tự kiểm tra |
|---|------|----------|--------|----------------------|
| 1 | **S**ay | Truyền tải thông điệp rõ ràng | Conceptual | "Report này đang *nói* điều gì, hay chỉ *trưng* số liệu?" |
| 2 | **U**nify | Ký hiệu ngữ nghĩa thống nhất | Semantic | "Màu/font/định dạng số có giống nhau ở mọi report không?" |
| 3 | **C**ondense | Cô đọng, loại bỏ dư thừa | Perceptual | "Có thể xóa bớt gì mà không mất thông tin quan trọng?" |
| 4 | **C**heck | Đúng và nhất quán | Perceptual | "Số có khớp giữa các trang/công cụ BI không?" |
| 5 | **E**xpress | Đúng loại biểu đồ cho đúng mục đích | Perceptual | "Biểu đồ này có phải cách trực quan tốt nhất cho loại so sánh này không?" |
| 6 | **S**implify | Tối giản hình ảnh | Perceptual | "Có gridline/3D/hiệu ứng thừa nào cần bỏ không?" |
| 7 | **S**tructure | Bố cục logic, dẫn dắt mắt người xem | Conceptual | "Mắt người xem có đi đúng đường ưu tiên (Z/F-pattern) không?" |

- **Conceptual** (Say, Structure): dựa trên tư duy kể chuyện dữ liệu (Barbara Minto)
- **Perceptual** (Condense, Check, Express, Simplify): dựa trên nguyên tắc nhận thức thị giác (Playfair, Tufte, Stephen Few)
- **Semantic** (Unify): dựa trên hệ ký hiệu chuẩn hóa (Rolf Hichert / IBCS Notation, nền tảng ISO 24896)

---

## 2. Quy trình 8 bước thiết kế 1 report/dashboard mới

1. **Xác định thông điệp chính** (Say) — viết ra 1 câu trước khi mở công cụ BI
2. **Liệt kê chỉ số cần thiết**, loại bỏ chỉ số không phục vụ thông điệp (Condense)
3. **Xác nhận nguồn số liệu** đi qua semantic layer duy nhất, không tự viết logic riêng ở từng tool (Check)
4. **Phác thảo layout** theo Z/F-pattern trước khi build (Structure)
5. **Chọn loại biểu đồ** theo bảng tra Express cho từng chỉ số
6. **Áp theme màu/định dạng chuẩn** đã thống nhất toàn team (Unify)
7. **Rà soát và tối giản**: tắt mọi hiệu ứng, border, gridline thừa (Simplify)
8. **Review chéo**: đối chiếu số với report nguồn, kiểm tra tiêu đề đã phản ánh đúng insight chưa (Check + Say)

---

## 3. Chi tiết từng nguyên tắc

### 3.1 SAY — Mỗi report phải "nói" điều gì đó

**Vấn đề thường gặp**: Dashboard chỉ là tập hợp KPI card + biểu đồ, không có thông điệp; người xem phải tự diễn giải.

**Nguyên tắc áp dụng**:
- Mỗi trang/report cần trả lời: "Nếu quản lý chỉ đọc 1 câu, đó là câu gì?"
- Tiêu đề biểu đồ nên là **câu kết luận**, không phải tên chỉ số.

**Before/After**

| Before | After |
|---|---|
| "Doanh thu theo tháng" | "Doanh thu Q3 giảm 8%, chủ yếu do miền Bắc" |
| "Tỷ lệ hoàn thành mục tiêu" | "72% team đạt KPI — thấp hơn cùng kỳ 15 điểm %" |

**Áp dụng Power BI**: Dùng Dynamic Title (DAX measure dạng text, có điều kiện SWITCH/IF theo mức độ nghiêm trọng) để tiêu đề/insight tự cập nhật theo dữ liệu, thay vì tiêu đề tĩnh.

---

### 3.2 UNIFY — Ký hiệu ngữ nghĩa thống nhất

**Nguyên tắc gốc**: Cùng một loại thông tin phải luôn được biểu diễn giống nhau ở mọi nơi trong tổ chức — người xem không phải "học lại" cách đọc mỗi report.

**Before/After**

| Before | After |
|---|---|
| Mỗi dashboard tự chọn màu (report A: đỏ = tăng trưởng; report B: đỏ = giảm) | Toàn hệ thống: đỏ **luôn luôn** là biến động âm |
| Số âm hiển thị `-1,234` ở report này, `(1,234)` ở report khác | Chuẩn hóa 1 kiểu duy nhất |

**Áp dụng Power BI**: Tạo file `theme.json` dùng chung, khóa cứng bảng màu semantic (không để user tự đổi conditional formatting tùy hứng). Định dạng số qua Format String Expression trong DAX để đồng bộ toàn bộ report.

**Áp dụng đa công cụ (Power BI + Superset + Tableau)**: Định nghĩa ngưỡng/màu/logic ngay ở semantic layer (Cube Core) để mọi BI tool hiển thị cùng 1 kết quả, tránh mỗi tool tự viết lại logic riêng.

---

### 3.3 CONDENSE — Cô đọng, loại bỏ dư thừa

**Nguyên tắc**: Não người xử lý tốt nhất khi thông tin được nhóm và rút gọn — không phải khi có nhiều dữ liệu nhất.

**Kỹ thuật**:
- Gộp nhiều biểu đồ nhỏ lẻ thành 1 bảng multi-tier (nhiều chỉ số trên cùng trục thời gian)
- Ẩn chi tiết vào drill-through/tooltip, chỉ hiện tổng quan ở màn hình chính
- Giới hạn số lượng visual/trang: tối đa ~6-8 visual chính

**Before/After**

| Before | After |
|---|---|
| 12 card KPI riêng lẻ dàn hàng ngang | 1 bảng tổng hợp 12 chỉ số, nhóm theo category, có sparkline |
| 5 biểu đồ line riêng cho 5 vùng miền | 1 biểu đồ multi-series, có legend, filter theo vùng |

**Áp dụng Power BI**: Dùng Small Multiples thay vì tạo nhiều visual riêng lẻ; dùng Tooltip pages cho chi tiết drill-down.

---

### 3.4 CHECK — Đảm bảo tính đúng và nhất quán

**Nguyên tắc**: Số liệu phải khớp nhau giữa mọi trang, mọi công cụ BI.

**Rủi ro điển hình**: Nếu Power BI, Superset, Tableau đều query trực tiếp từ database thay vì qua semantic layer, mỗi công cụ có thể tự định nghĩa lại logic tính toán (VD: "doanh thu thuần" tính khác nhau) → số liệu lệch nhau giữa các dashboard.

**Nguyên tắc áp dụng**:
- Mọi metric quan trọng phải định nghĩa **1 lần duy nhất** ở semantic layer, không định nghĩa lại trong từng BI tool
- Trước khi publish, đối chiếu số tổng giữa report mới và report nguồn

**Áp dụng Power BI**: Kết nối trực tiếp tới semantic layer (Cube Core qua SQL/REST API) thay vì viết lại DAX measure trùng logic đã có sẵn.

---

### 3.5 EXPRESS — Chọn đúng loại biểu đồ cho đúng mục đích

Xem bảng tra chi tiết tại Mục 5.

**Before/After**

| Before | After |
|---|---|
| Pie/Donut chart nhiều lát thể hiện thị phần | Bar chart ngang, sắp xếp từ cao đến thấp, hoặc 100% stacked bar |
| Gauge/Speedometer chart cho % hoàn thành mục tiêu | Bullet chart (có target line rõ ràng) hoặc bar chart with reference line |

**Áp dụng Power BI**: Dùng custom visual "Bullet Chart" hoặc "Waterfall" có sẵn trong AppSource thay vì Gauge mặc định.

---

### 3.6 SIMPLIFY — Tối giản hình ảnh

**Nguyên tắc**: Mọi yếu tố trang trí không mang thông tin đều là nhiễu, làm chậm thời gian đọc hiểu.

**Checklist loại bỏ**:
- Gridline dày, không cần thiết → giữ tối thiểu hoặc bỏ hẳn
- Hiệu ứng 3D, bóng đổ (shadow), gradient
- Border/khung viền dư thừa quanh mỗi card
- Data label trùng lặp với trục đã có sẵn
- Legend nếu chỉ có 1-2 series (dùng data label trực tiếp thay thế)

**Before/After**: Card KPI có border, shadow, icon trang trí, gradient nền → Card phẳng (flat design), chỉ số lớn, không viền, đủ khoảng trắng xung quanh.

**Áp dụng Power BI**: Format pane → tắt Shadow, tắt Border, set Background = None/Transparent cho phần lớn visual; khoảng cách giữa các visual tối thiểu 8-16px.

---

### 3.7 STRUCTURE — Bố cục & luồng mắt (Z/F-pattern)

**Nguyên tắc mắt người đọc dashboard**:

```
[KPI tổng quan quan trọng nhất]  →  [KPI phụ / xu hướng ngắn]
                ↓
[Biểu đồ xu hướng chính - giữa màn hình]
                ↓
[Bảng chi tiết / breakdown]  →  [Ghi chú, footnote]
```

- **Góc trên-trái**: KPI quan trọng nhất, tổng quan cấp cao
- **Giữa màn hình**: biểu đồ xu hướng/phân tích chính
- **Dưới-phải**: bảng chi tiết, dữ liệu drill-down
- **Filter**: cố định 1 vị trí duy nhất trên toàn dashboard (top bar hoặc sidebar trái) — không đặt giữa nội dung, không đổi vị trí giữa các tab

**Container hóa**: Nhóm các chỉ số liên quan vào 1 khung/section riêng, cách biệt rõ với nhóm khác bằng khoảng trắng hoặc đường phân cách nhẹ.

**Áp dụng Power BI**: Dùng Grid layout cố định 12 cột (giống Bootstrap), khóa vị trí bằng Selection pane; nhóm visual bằng Group để di chuyển/style đồng bộ theo section.

---

## 4. Checklist review trước khi publish

### A. Trước khi thiết kế (Say + Structure)
- [ ] Xác định 1 thông điệp chính của dashboard
- [ ] Đặt KPI quan trọng nhất góc trên-trái (Z/F-pattern)
- [ ] Nhóm các chỉ số liên quan vào cùng container/section
- [ ] Filter đặt cố định 1 vị trí (top hoặc sidebar trái), đồng nhất mọi tab

### B. Ký hiệu & định dạng (Unify)
- [ ] Cùng 1 chỉ số → cùng màu, cùng định dạng số trên mọi report
- [ ] Màu có ngữ nghĩa cố định, dùng xuyên suốt
- [ ] Số âm luôn cùng 1 kiểu hiển thị

### C. Rút gọn & kiểm tra (Condense + Check)
- [ ] Bỏ mọi bảng/biểu đồ không phục vụ thông điệp chính
- [ ] Đối chiếu số liệu giữa các trang/công cụ BI — không mâu thuẫn
- [ ] Không hiển thị quá 5-7 chỉ số/biểu đồ trên 1 màn hình

### D. Loại biểu đồ đúng mục đích (Express)
- [ ] So sánh theo thời gian → line/column, không pie
- [ ] So sánh tỷ trọng → 100% stacked bar, không 3D pie
- [ ] Actual vs plan → waterfall/bullet chart
- [ ] Không dùng biểu đồ 3D, gauge, speedometer

### E. Tối giản thị giác (Simplify)
- [ ] Bỏ gridline, border, hiệu ứng 3D/shadow/gradient thừa
- [ ] Đủ khoảng trắng (negative space) giữa các container

### F. Bố cục cuối cùng (Structure)
- [ ] Luồng mắt: KPI tổng quan → xu hướng → bảng chi tiết
- [ ] Bảng dữ liệu chi tiết đặt cuối luồng đọc
- [ ] Tiêu đề mỗi biểu đồ nêu kết luận, không chỉ nêu tên chỉ số

---

## 5. Bảng tra nhanh loại biểu đồ theo mục đích phân tích

| Mục đích phân tích | Biểu đồ nên dùng | Biểu đồ nên tránh |
|---|---|---|
| So sánh theo thời gian | Line chart, Column chart | Pie chart |
| So sánh cơ cấu/tỷ trọng | 100% Stacked Bar | 3D Pie, Donut nhiều lát |
| Phân tích chênh lệch actual vs plan | Waterfall chart | Số đơn thuần không baseline |
| Xếp hạng | Bar chart ngang, sắp xếp giảm dần | Pie chart |
| Phân bố | Histogram, Box plot | Scatter không có trục rõ ràng |
| Tương quan 2 biến | Scatter plot | Bar chart ghép trục |
| % hoàn thành mục tiêu | Bullet chart, bar + reference line | Gauge, Speedometer |

---

## 6. Bảng quy ước màu/ký hiệu chuẩn (Unify) — mẫu tham khảo

| Loại dữ liệu | Màu | Ký hiệu |
|---|---|---|
| Actual (thực tế) | Xanh navy đậm | Cột đặc |
| Plan/Budget | Xám | Cột viền/outline |
| Forecast | Xanh nhạt | Nét đứt |
| Variance dương | Xanh lá | Mũi tên lên |
| Variance âm | Đỏ | Mũi tên xuống |
| Healthy/Good | Xanh lá | Badge tròn |
| Degraded/Warning | Vàng/Cam | Badge tròn |
| Critical/Bad | Đỏ | Badge tròn |
| Unknown | Xám | Badge tròn |

> Bảng này chỉ áp dụng **1 lần duy nhất** cho toàn hệ thống báo cáo (mọi dashboard, mọi công cụ BI) — không định nghĩa lại riêng lẻ theo từng report.

---

## Áp dụng nhanh vào Power BI (tổng hợp)

| Nguyên tắc | Hành động cụ thể |
|---|---|
| Say | Dynamic Title bằng DAX measure, có điều kiện theo mức độ nghiêm trọng |
| Unify | 1 theme JSON dùng chung, khóa bảng màu semantic, format string đồng bộ |
| Condense | Small Multiples, Tooltip pages cho drill-down |
| Check | Kết nối trực tiếp tới semantic layer (Cube Core), không viết lại logic trong DAX |
| Express | Bullet Chart, Waterfall (AppSource); tránh Gauge, Pie nhiều lát |
| Simplify | Tắt Shadow/Border trong Format pane, spacing 8-16px giữa visual |
| Structure | Grid layout 12 cột, khóa vị trí bằng Selection pane, Group theo section |
