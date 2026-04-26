# CHECKLIST THỰC NGHIỆM 2 TUẦN BASELINE + 2 TUẦN AUTOMATION

## 0) Mục tiêu và phạm vi đánh giá
- [ ] Chốt mục tiêu đánh giá: so sánh quy trình chạy thủ công và quy trình có automation + AI.
- [ ] Chốt phạm vi: chỉ đánh giá các quy trình đã đưa vào sản xuất thử nghiệm (tạo đơn, xác nhận lấy hàng, cập nhật trạng thái, thông báo).
- [ ] Chốt KPI bắt buộc:
  - [ ] Thời gian xử lý trung bình từ tạo đơn đến lấy hàng.
  - [ ] Tỷ lệ đơn đúng ETA.
  - [ ] Số tác vụ thủ công trên mỗi đơn.
  - [ ] Tỷ lệ thành công workflow.
  - [ ] Tỷ lệ retry / lỗi.
  - [ ] Tỷ lệ cần human override (nếu có AI ra quyết định).
- [ ] Chốt ngưỡng kết luận thành công:
  - [ ] Giảm >= 20% thời gian xử lý.
  - [ ] Tăng >= 10% tỷ lệ đúng ETA.
  - [ ] Workflow success rate >= 98%.

---

## 1) Cấu trúc Chương Đánh Giá (format để viết luận văn)

### 4.1 Mục tiêu và câu hỏi đánh giá
- [ ] Nêu rõ câu hỏi nghiên cứu (manual vs automation, AI có tạo cải thiện hay không).
- [ ] Nêu rõ giả thuyết H1, H2, H3.

### 4.2 Thiết kế thực nghiệm
- [ ] Mô tả kiểu thực nghiệm trước-sau (before/after).
- [ ] Mô tả cửa sổ thời gian: 2 tuần baseline + 2 tuần automation.
- [ ] Mô tả đối tượng mẫu: đơn hàng, thao tác nhân viên, sự kiện tracking.
- [ ] Nêu rõ các biến kiểm soát (khối lượng mẫu, khung giờ, loại dịch vụ, tuyến).

### 4.3 Kết quả baseline (2 tuần)
- [ ] Tổng hợp KPI baseline theo ngày và theo tuần.
- [ ] Nêu các điểm nghẽn trong quy trình thủ công.

### 4.4 Kết quả automation (2 tuần)
- [ ] Tổng hợp KPI automation theo ngày và theo tuần.
- [ ] Mô tả mức độ ổn định workflow (success/retry/fail).

### 4.5 So sánh và phân tích
- [ ] So sánh baseline vs automation theo từng KPI.
- [ ] Tính Improvement % cho các KPI chính.
- [ ] Phân tích ngoại lệ và nguyên nhân.

### 4.6 Đe dọa tính hợp lệ và hạn chế
- [ ] Hạn chế dữ liệu, hạn chế mô phỏng, hạn chế AI.
- [ ] Biện giảm thiểu đã áp dụng.

### 4.7 Kết luận chương
- [ ] Trả lời trực tiếp câu hỏi nghiên cứu.
- [ ] Tổng kết KPI đạt/không đạt theo ngưỡng.

---

## 2) Trước ngày bắt đầu (D-3 đến D-1)
- [ ] Đóng băng phiên bản hệ thống (git tag/commit cho baseline).
- [ ] Xác nhận dữ liệu seed ban đầu và tài khoản test.
- [ ] Xác nhận bảng log đã sẵn sàng (action_logs, tracking_events, notifications, orders).
- [ ] Xác nhận quy tắc ghi nhận mode:
  - [ ] Baseline: executionMode = manual.
  - [ ] Automation: executionMode = automation.
- [ ] Chốt dashboard/truy vấn dùng để rút KPI.
- [ ] Chốt biểu mẫu ghi nhật ký sự cố (incident log).
- [ ] Chốt người phụ trách vận hành và người đối soát số liệu.

---

## 3) Checklist 2 tuần BASELINE (Tuần 1-2)

## 3.1 Checklist đầu mỗi ngày
- [ ] Xác nhận hệ thống hoạt động, không bật workflow tự động.
- [ ] Xác nhận nhân viên thao tác thủ công theo quy trình đã chốt.
- [ ] Xác nhận dữ liệu phát sinh được ghi vào action_logs với mode=manual.
- [ ] Chụp snapshot KPI đầu ngày (số đơn tồn, SLA cảnh báo).

## 3.2 Checklist cuối mỗi ngày
- [ ] Tổng số đơn tạo mới trong ngày.
- [ ] Tổng số tác vụ thủ công trong ngày.
- [ ] Thời gian trung bình tạo đơn -> lấy hàng (nếu đủ mẫu).
- [ ] Tỷ lệ đơn đúng ETA (trên tập đơn đã giao).
- [ ] Số sự cố vận hành (nếu có) + mô tả nguyên nhân.
- [ ] Lưu bảng tổng hợp ngày vào phụ lục.

## 3.3 Checklist cuối Tuần 1
- [ ] Tổng hợp KPI 7 ngày đầu.
- [ ] Kiểm tra chất lượng dữ liệu (thiếu log, sai mode, trùng bản ghi).
- [ ] Đối soát 5-10 mẫu đơn ngẫu nhiên với nhật ký thao tác.

## 3.4 Checklist cuối Tuần 2 (kết thúc baseline)
- [ ] Chốt bộ KPI baseline chính thức.
- [ ] Tính trung bình, trung vị, P90 cho KPI chính.
- [ ] Chốt danh sách vấn đề thủ công cần cải thiện.
- [ ] Tạo mốc chuyển pha sang automation (go/no-go).

---

## 4) Điều kiện chuyển sang AUTOMATION (Gate)
- [ ] Dữ liệu baseline đủ số lượng (khuyến nghị >= 50 đơn hoặc theo ngưỡng đề tài).
- [ ] Tất cả KPI baseline đã có số liệu đầy đủ.
- [ ] Logging và dashboard không lỗi trong ít nhất 3 ngày liên tiếp.
- [ ] Workflow test trên môi trường staging đạt tỷ lệ thành công tối thiểu 95%.
- [ ] Có kế hoạch fallback về manual nếu workflow lỗi.

---

## 5) Checklist 2 tuần AUTOMATION (Tuần 3-4)

## 5.1 Checklist đầu mỗi ngày
- [ ] Bật workflow đã được phê duyệt.
- [ ] Xác nhận webhook, scheduler, kết nối AI service bình thường.
- [ ] Xác nhận ghi log action_logs với mode=automation.
- [ ] Xác nhận có cơ chế human-in-the-loop cho trường hợp confidence thấp.

## 5.2 Checklist cuối mỗi ngày
- [ ] Tổng số run workflow.
- [ ] Workflow success rate trong ngày.
- [ ] Số retry, số fail, số bản ghi vào dead-letter (nếu có).
- [ ] Thời gian trung bình tạo đơn -> lấy hàng.
- [ ] Tỷ lệ đơn đúng ETA.
- [ ] Số tác vụ thủ công còn lại (sau automation).
- [ ] Tỷ lệ human override (nếu có AI).
- [ ] Incident log: lỗi, cách xử lý, MTTR.

## 5.3 Checklist cuối Tuần 3
- [ ] Tổng hợp KPI 7 ngày đầu automation.
- [ ] Đối soát tính đúng của phân loại AI/khuyến nghị AI trên mẫu kiểm tra.
- [ ] Đánh giá độ ổn định workflow (success/retry/fail trend).

## 5.4 Checklist cuối Tuần 4 (kết thúc automation)
- [ ] Chốt bộ KPI automation chính thức.
- [ ] Tính trung bình, trung vị, P90 cho KPI chính.
- [ ] Chốt danh sách lỗi hệ thống và bài học rút ra.

---

## 6) Checklist so sánh baseline vs automation
- [ ] Tính Improvement % cho từng KPI.
- [ ] So sánh theo cùng khung giờ/cùng loại dịch vụ (nếu có).
- [ ] Tách phân tích theo nhóm đơn (FTL/LTL/Express).
- [ ] Tách phân tích theo khu vực/tuyến chính.
- [ ] Nêu rõ KPI nào cải thiện, KPI nào không cải thiện.
- [ ] Giải thích nguyên nhân gốc cho KPI không đạt kỳ vọng.

Công thức khuyến nghị:
- [ ] Automation Rate = (Số tác vụ tự động / Tổng tác vụ) * 100%.
- [ ] On-time Rate = (Số đơn đúng ETA / Tổng đơn đã giao) * 100%.
- [ ] Improvement % = ((Baseline - Automation) / Baseline) * 100%.
- [ ] Workflow Success Rate = (Run thành công / Tổng run) * 100%.

---

## 7) Mẫu bảng tổng hợp để đưa vào chương đánh giá

## 7.1 Bảng tổng hợp ngày (áp dụng cho cả baseline và automation)
- [ ] Date
- [ ] Mode (manual/automation)
- [ ] Số đơn mới
- [ ] Số tác vụ thủ công
- [ ] Số tác vụ automation
- [ ] Avg tạo đơn -> lấy hàng (phút)
- [ ] On-time rate (%)
- [ ] Workflow success rate (%)
- [ ] Retry count
- [ ] Fail count
- [ ] Human override rate (%)
- [ ] Incident note

## 7.2 Bảng tổng hợp tuần
- [ ] Tuần
- [ ] Mode
- [ ] Mean KPI
- [ ] Median KPI
- [ ] P90 KPI
- [ ] Nhận xét xu hướng

## 7.3 Bảng so sánh kết quả cuối kỳ
- [ ] KPI
- [ ] Baseline value
- [ ] Automation value
- [ ] Delta
- [ ] Improvement %
- [ ] Đạt ngưỡng? (Yes/No)

---

## 8) Checklist viết phần thảo luận kết quả
- [ ] Nêu rõ KPI cải thiện mạnh nhất và lý do.
- [ ] Nêu rõ KPI chưa cải thiện và lý do.
- [ ] Nêu rõ vai trò của AI: bước nào tạo giá trị rõ nhất.
- [ ] Nêu rõ chi phí đổi lấy hiệu quả (độ phức tạp vận hành, quản trị lỗi, chi phí AI).
- [ ] Nêu rõ khả năng nhân rộng cho SME logistics thực tế.

---

## 9) Checklist tài liệu minh chứng kèm theo phụ lục
- [ ] Ảnh dashboard KPI theo 4 mốc: đầu baseline, cuối baseline, đầu automation, cuối automation.
- [ ] Trích xuất mẫu log manual và automation.
- [ ] Mẫu incident log và cách đóng sự cố.
- [ ] Mẫu quyết định human override (nếu có).
- [ ] Truy vấn SQL/báo cáo đã dùng để tính KPI.

---

## 10) Checklist nghiệm thu nội bộ trước khi nộp luận văn
- [ ] Đủ số liệu 4 tuần, không bị đứt quãng.
- [ ] Có đối soát tính nhất quán giữa dashboard và bảng tổng hợp.
- [ ] Có bảng so sánh cuối kỳ đầy đủ KPI và kết luận đạt/không đạt.
- [ ] Có phần hạn chế và đề xuất hướng mở rộng.
- [ ] Có phụ lục minh chứng đủ để hội đồng kiểm tra.

---

## 11) Kế hoạch thời gian 4 tuần (bản rút gọn để theo dõi)

### Tuần 1 (Baseline)
- [ ] Chạy manual 100%.
- [ ] Ghi nhận KPI hằng ngày.

### Tuần 2 (Baseline)
- [ ] Chạy manual 100%.
- [ ] Chốt baseline và báo cáo giữa kỳ.

### Tuần 3 (Automation)
- [ ] Bật workflow đã phê duyệt.
- [ ] Theo dõi success/retry/fail và override.

### Tuần 4 (Automation)
- [ ] Ổn định workflow.
- [ ] Chốt số liệu, so sánh, kết luận.

---

## 12) Định nghĩa done cho Chương Đánh Giá
- [ ] Chương có đủ 7 mục: mục tiêu, thiết kế, baseline, automation, so sánh, đe dọa hợp lệ, kết luận.
- [ ] Có ít nhất 3 bảng + 2 hình minh họa KPI.
- [ ] Có kết luận dựa trên số liệu (không chỉ mô tả cảm tính).
- [ ] Có trích dẫn rõ cách tính KPI.