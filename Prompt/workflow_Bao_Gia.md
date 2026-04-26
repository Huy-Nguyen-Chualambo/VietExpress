**Mục tiêu workflow**
1. Giảm thời gian phản hồi báo giá từ vài giờ xuống vài phút.
2. Chuẩn hóa báo giá theo bảng giá tham chiếu để tránh lệch giữa nhân viên.
3. Tự động gửi đa kênh Zalo và Email ngay sau khi có yêu cầu hợp lệ.
4. Ghi log đầy đủ để đo KPI trước và sau automation.

**Ý tưởng tổng thể**
1. Rule engine tính giá nền là lõi chính.
2. AI chỉ đóng vai trò trợ lý ở giai đoạn đầu.
3. Human-in-the-loop cho ca rủi ro hoặc dữ liệu thiếu.
4. Mọi bước đều phải có trạng thái rõ ràng để đo hiệu quả vận hành.

**Workflow đề xuất phiên bản MVP không AI**
1. Trigger
2. Khi có quote mới trạng thái pending.
3. Validate dữ liệu
4. Kiểm tra service type, tuyến, trọng lượng, số điện thoại hoặc email.
5. Nếu thiếu dữ liệu thì chuyển trạng thái need_info và tạo task cho nhân viên.
6. Tính giá tự động
7. Lấy giá từ bảng tham chiếu theo loại dịch vụ.
8. Cộng phụ phí khu vực hoặc thời gian nếu có.
9. Tạo báo giá
10. Sinh mã báo giá, thời hạn hiệu lực, tổng tiền tạm tính.
11. Gửi thông báo
12. Gửi Zalo theo template đã duyệt.
13. Gửi Email kèm nội dung chi tiết.
14. Cập nhật hệ thống
15. quote_requests chuyển từ pending sang quoted.
16. Lưu quoted_price, sent_at, channel_status.
17. Follow-up
18. Sau 24 giờ chưa phản hồi thì gửi nhắc lần 1.
19. Sau 72 giờ chưa phản hồi thì chuyển stale.

**Workflow nâng cao có AI**
1. Giữ nguyên flow MVP.
2. Bổ sung AI ở 3 điểm:
3. Chuẩn hóa dữ liệu đầu vào tự do thành cấu trúc rõ.
4. Sinh nội dung tin nhắn cá nhân hóa theo ngữ cảnh khách.
5. Chấm điểm lead để ưu tiên nhân viên chăm sóc.
6. Quy tắc an toàn:
7. AI không tự quyết giá cuối cùng.
8. AI confidence thấp thì bắt buộc duyệt tay.
9. Các ca đặc thù lạnh, hàng nguy hiểm, tuyến khó luôn qua nhân viên.

**Thiết kế trạng thái nghiệp vụ**
1. pending
2. dữ liệu mới nhận
3. need_info
4. thiếu thông tin để tính giá
5. quoted
6. đã gửi báo giá
7. customer_replied
8. khách đã phản hồi
9. accepted
10. khách đồng ý
11. rejected
12. khách từ chối
13. stale
14. quá hạn chưa phản hồi

**Nhánh lỗi bắt buộc phải có**
1. Lỗi gửi Zalo thì fallback email.
2. Lỗi gửi cả hai kênh thì tạo ticket cho nhân viên gọi tay.
3. Timeout API thì retry tối đa 3 lần theo backoff.
4. Chống gửi trùng bằng idempotency key theo quote id và version báo giá.

**Có nên dùng AI không**
1. Nên dùng, nhưng theo lộ trình.
2. Giai đoạn 1 dùng AI cho nội dung và phân loại.
3. Giai đoạn 2 mới cân nhắc AI đề xuất phụ phí hoặc mức giá gợi ý.
4. Không nên để AI toàn quyền báo giá trong bản đầu của khóa luận.

**Tính khả thi thực tế**
1. Kỹ thuật: cao, vì n8n xử lý orchestration tốt.
2. Nghiệp vụ: cao, vì luồng báo giá lặp lại và có quy tắc rõ.
3. Vận hành: trung bình cao, phụ thuộc chính sách Zalo OA template.
4. Dữ liệu: đủ khả thi nếu bạn chuẩn hóa đầu vào và log chuẩn.

**KPI để chứng minh thành công**
1. Thời gian từ lúc tạo yêu cầu đến lúc gửi báo giá đầu tiên.
2. Tỷ lệ gửi thành công theo từng kênh.
3. Tỷ lệ phản hồi khách sau báo giá.
4. Tỷ lệ chốt đơn sau báo giá.
5. Số thao tác thủ công trung bình trên mỗi yêu cầu.
6. Tỷ lệ override của nhân viên với đề xuất AI.

**Roadmap triển khai gọn cho luận văn**
1. Tuần 1 làm MVP no-AI, chạy baseline.
2. Tuần 2 ổn định lỗi gửi và retry.
3. Tuần 3 thêm AI cho chuẩn hóa dữ liệu và soạn nội dung.
4. Tuần 4 đo KPI trước sau và viết phần đánh giá.
