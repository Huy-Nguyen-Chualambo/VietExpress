**Blueprint Chương Thiết Kế: Kiến Trúc Automation + AI + KPI Đo Lường**

**1. Mục Tiêu Thiết Kế**
1. Xây dựng môi trường mô phỏng vận hành cho SME logistics nội địa, đủ gần thực tế để chạy thử các luồng tự động hóa.
2. Tách rõ vai trò giữa hệ thống nghiệp vụ, bộ điều phối workflow, và lớp AI để dễ mở rộng và đánh giá.
3. Định lượng hiệu quả bằng KPI trước và sau automation, thay vì chỉ mô tả định tính.
4. Đảm bảo kiểm soát rủi ro vận hành bằng cơ chế audit, retry, idempotency, và human-in-the-loop.

**2. Phạm Vi Quy Trình Mô Phỏng**
1. Quy trình hành chính: tiếp nhận yêu cầu và chuẩn hóa thông tin đầu vào.
2. Quy trình sản xuất vận hành: điều phối lấy hàng, cập nhật trạng thái, theo dõi SLA.
3. Quy trình chăm sóc khách hàng: tạo và gửi thông báo ngữ cảnh theo trạng thái vận đơn.
4. Quy trình phân tích: tổng hợp KPI vận hành và KPI AI theo ngày, tuần, tháng.

**3. Nguyên Tắc Kiến Trúc**
1. Single Source of Truth: toàn bộ trạng thái cuối cùng nằm trong cơ sở dữ liệu nghiệp vụ.
2. Event-driven orchestration: workflow phản ứng theo sự kiện thay vì gọi tay theo từng màn hình.
3. AI as copilot, not autopilot: AI đề xuất hoặc sinh nội dung, quyết định quan trọng vẫn có bước duyệt.
4. Observable by design: mọi workflow phải có log, metric, và trace để đo được hiệu quả.
5. Safe by default: mọi webhook và callback đều có xác thực chữ ký, chống chạy trùng, và giới hạn quyền.

**4. Kiến Trúc Tổng Thể 4 Lớp**
1. Lớp ứng dụng nghiệp vụ.
- Web portal khách hàng và nhân viên.
- API nghiệp vụ tạo đơn, đổi trạng thái, tracking, thông báo.
- CSDL vận hành gồm đơn hàng, sự kiện, người dùng, cấu hình.
2. Lớp điều phối automation.
- n8n làm orchestration engine.
- Trigger theo webhook, schedule, hoặc database event.
- Quản lý retry, branching, fallback, dead-letter.
3. Lớp AI services.
- Mô hình ngôn ngữ để phân loại yêu cầu, trích xuất thông tin, sinh nội dung thông báo.
- Mô hình đánh giá rủi ro trễ SLA.
- Cơ chế chấm độ tin cậy để quyết định auto-apply hay chuyển duyệt tay.
4. Lớp quan sát và đánh giá.
- Dashboard KPI vận hành.
- Dashboard chất lượng AI.
- Kho audit phục vụ đối chiếu và viết chương đánh giá.

**5. Thành Phần Kỹ Thuật Và Trách Nhiệm**
1. Ứng dụng web.
- Nhập liệu nghiệp vụ, xem trạng thái, thao tác tác nghiệp.
- Phát sinh business events khi có thay đổi quan trọng.
2. API Integration Gateway.
- Nhận yêu cầu từ n8n và hệ thống ngoài.
- Xác thực chữ ký, chuẩn hóa payload, trả mã lỗi chuẩn.
3. Event Store.
- Lưu bất biến các sự kiện domain như tạo đơn, nhận hàng, giao hàng.
- Cung cấp dữ liệu cho replay và phân tích hậu kiểm.
4. Automation Run Store.
- Lưu vòng đời mỗi lần chạy workflow: start, step, success/fail, retry.
5. AI Inference Store.
- Lưu input đã ẩn dữ liệu nhạy cảm, output AI, confidence, latency, token cost, verdict.
6. KPI Mart.
- Bảng tổng hợp theo time window để vẽ biểu đồ và so sánh trước/sau.

**6. Mô Hình Dữ Liệu Bổ Sung Cho Luận Văn**
1. Bảng domain_event.
- event_id, event_type, aggregate_type, aggregate_id, payload_json, created_at, source, correlation_id.
2. Bảng automation_run.
- run_id, workflow_name, trigger_type, trigger_ref, status, started_at, ended_at, duration_ms, retry_count, error_code, error_message, correlation_id.
3. Bảng automation_step_run.
- step_run_id, run_id, step_name, status, started_at, ended_at, duration_ms, input_ref, output_ref.
4. Bảng ai_inference_log.
- inference_id, run_id, model_name, task_type, prompt_hash, input_ref, output_ref, confidence_score, latency_ms, token_in, token_out, estimated_cost, human_override, created_at.
5. Bảng kpi_daily_snapshot.
- snapshot_date, process_name, metric_name, metric_value, baseline_value, delta_percent, notes.
6. Bảng dead_letter_queue.
- dlq_id, workflow_name, failed_payload, failed_step, error_detail, first_failed_at, retry_after, resolved_at, resolution_note.

**7. Danh Mục Workflow Cốt Lõi**
1. WF-01: Intake và chuẩn hóa yêu cầu.
- Trigger: khách gửi form hoặc email.
- AI: phân loại dịch vụ, trích xuất tuyến, trọng lượng, ràng buộc thời gian.
- Output: tạo yêu cầu báo giá chuẩn; nếu thiếu dữ liệu thì tạo tác vụ bổ sung.
2. WF-02: Điều phối lấy hàng.
- Trigger: đơn mới ở trạng thái pending.
- AI: tính điểm ưu tiên xử lý dựa trên ETA, khu vực, tải đội xe, độ gấp.
- Output: gán nhóm phụ trách, nhắc việc tự động, cập nhật tracking mốc đầu.
3. WF-03: Giám sát SLA và cảnh báo sớm.
- Trigger: scheduler 5-15 phút.
- AI: phát hiện nguy cơ trễ từ lịch sử tracking và trạng thái hiện tại.
- Output: cảnh báo nhân viên, đề xuất hành động khắc phục, ghi nhận mức rủi ro.
4. WF-04: Tạo thông báo khách hàng ngữ cảnh.
- Trigger: khi trạng thái đơn thay đổi.
- AI: sinh nội dung thông báo phù hợp ngữ cảnh, tone chuyên nghiệp, rõ hành động tiếp theo.
- Output: gửi qua kênh đã bật và ghi log delivery.
5. WF-05: Báo cáo vận hành tự động.
- Trigger: cuối ngày.
- AI: tóm tắt bất thường, nguyên nhân chính, khuyến nghị ngày tiếp theo.
- Output: dashboard và báo cáo gửi quản lý.

**8. Luồng Dữ Liệu Chuẩn End-to-End**
1. Người dùng thao tác trong portal.
2. API nghiệp vụ ghi trạng thái và phát sự kiện domain_event.
3. n8n nhận event qua webhook hoặc queue.
4. Workflow gọi AI service cho bước cần suy luận.
5. Kết quả AI được kiểm tra confidence và policy.
6. Nếu confidence thấp hoặc giao dịch nhạy cảm thì chuyển human approval.
7. Workflow cập nhật trạng thái nghiệp vụ và ghi automation_run, ai_inference_log.
8. Dashboard KPI đọc dữ liệu tổng hợp và hiển thị theo thời gian thực gần đúng.

**9. Chính Sách Quyết Định AI**
1. Ngưỡng tin cậy.
- Auto-apply nếu confidence lớn hơn hoặc bằng 0.85 và không thuộc nhóm rủi ro cao.
- Human review nếu confidence từ 0.60 đến dưới 0.85.
- Reject và fallback rule-based nếu confidence dưới 0.60.
2. Nhóm quyết định bắt buộc duyệt tay.
- Hủy đơn.
- Chấp thuận mức giá vượt ngưỡng.
- Chuyển trạng thái completed.
3. Giải thích quyết định.
- Lưu rationale ngắn cho mỗi suy luận AI để phục vụ kiểm toán.

**10. Bảo Mật, Tuân Thủ, Và Quản Trị**
1. Webhook security.
- HMAC signature, timestamp window, nonce chống replay.
2. RBAC.
- Tách quyền customer, employee, admin.
3. Data protection.
- Ẩn hoặc băm dữ liệu nhạy cảm trước khi ghi vào log AI.
4. Idempotency.
- Mỗi trigger có idempotency key, workflow chỉ xử lý một lần thành công.
5. Auditability.
- Mọi thay đổi trạng thái phải truy vết được ai, khi nào, từ workflow nào.

**11. Bộ KPI Đo Lường Bắt Buộc**
1. KPI hiệu quả vận hành.
- Thời gian xử lý từ tạo đơn đến lấy hàng.
- Thời gian từ tạo đơn đến giao thành công.
- Tỷ lệ đơn vượt ETA.
- Tỷ lệ hoàn thành đúng hạn.
2. KPI năng suất quy trình.
- Số thao tác thủ công trung bình trên mỗi đơn.
- Tỷ lệ tự động hóa theo công đoạn.
- Thời gian phản hồi khách hàng đầu tiên.
3. KPI chất lượng AI.
- Độ chính xác phân loại yêu cầu.
- Tỷ lệ cần human override.
- Latency AI trung bình mỗi lần suy luận.
- Chi phí AI trên mỗi đơn.
4. KPI chất lượng hệ thống.
- Tỷ lệ thành công workflow.
- Tỷ lệ retry.
- Tỷ lệ vào dead-letter queue.
- MTTR cho lỗi workflow.
5. KPI trải nghiệm khách hàng.
- Tỷ lệ thông báo thành công.
- Tỷ lệ khiếu nại liên quan thông tin chậm/sai.
- Điểm hài lòng nội bộ trong giai đoạn thử nghiệm.

**12. Công Thức Đo Lường Đề Xuất**
1. Tỷ lệ tự động hóa:
$$Automation\ Rate = \frac{So\ tac\ vu\ tu\ dong}{Tong\ tac\ vu} \times 100\%$$
2. Tỷ lệ đúng hạn:
$$OnTime\ Rate = \frac{So\ don\ giao\ dung\ ETA}{Tong\ don\ da\ giao} \times 100\%$$
3. Mức cải thiện thời gian xử lý:
$$Improvement\% = \frac{Baseline\ Time - Post\ Automation\ Time}{Baseline\ Time} \times 100\%$$
4. Tỷ lệ override AI:
$$Override\ Rate = \frac{So\ quyet\ dinh\ bi\ sua\ boi\ nguoi}{Tong\ quyet\ dinh\ AI} \times 100\%$$
5. Tỷ lệ thành công workflow:
$$Workflow\ Success\ Rate = \frac{Run\ thanh\ cong}{Tong\ run} \times 100\%$$

**13. Thiết Kế Thực Nghiệm Đánh Giá**
1. Giai đoạn baseline.
- Chạy quy trình bán thủ công trong 2 tuần.
- Thu thập toàn bộ KPI gốc.
2. Giai đoạn can thiệp.
- Bật 3-5 workflow automation + AI trong 2-4 tuần.
- Giữ cùng khối lượng mẫu hoặc chuẩn hóa theo số đơn.
3. Giai đoạn so sánh.
- So sánh trung bình, trung vị, và phân vị 90%.
- Phân tích các ca ngoại lệ để tránh thiên lệch.
4. Tiêu chí kết luận thành công.
- Giảm thời gian xử lý tối thiểu 20%.
- Tăng tỷ lệ đúng hạn tối thiểu 10%.
- Workflow success rate lớn hơn hoặc bằng 98%.
- Override rate giảm dần theo từng tuần vận hành.

**14. Lộ Trình Triển Khai Đề Xuất**
1. Tuần 1.
- Hoàn thiện event schema, integration gateway, logging nền.
2. Tuần 2.
- Triển khai WF-01 và WF-02, bật dashboard vận hành cơ bản.
3. Tuần 3.
- Triển khai WF-03 và WF-04, thêm human approval.
4. Tuần 4.
- Triển khai WF-05, chốt bộ KPI và chạy thực nghiệm so sánh.
5. Tuần 5.
- Phân tích kết quả, viết chương đánh giá và kết luận.

**15. Ma Trận Rủi Ro Và Giảm Thiểu**
1. Rủi ro dữ liệu thiếu hoặc sai.
- Giảm thiểu bằng schema validation và quy tắc bắt buộc trường.
2. Rủi ro workflow chạy trùng.
- Giảm thiểu bằng idempotency key và lock theo aggregate_id.
3. Rủi ro AI trả lời thiếu ổn định.
- Giảm thiểu bằng confidence threshold và fallback rule-based.
4. Rủi ro chậm hệ thống khi tải cao.
- Giảm thiểu bằng queue, batch update, và giới hạn timeout.
5. Rủi ro bảo mật webhook.
- Giảm thiểu bằng ký số, rotate secret, và giới hạn IP.

**16. Tiêu Chí Nghiệm Thu Chương Thiết Kế**
1. Có sơ đồ kiến trúc 4 lớp và mô tả trách nhiệm từng thành phần.
2. Có định nghĩa dữ liệu cho event, workflow run, AI inference.
3. Có tối thiểu 3 workflow AI chạy được end-to-end.
4. Có dashboard KPI và dữ liệu trước/sau automation.
5. Có bằng chứng audit cho các quyết định quan trọng.

Nếu bạn muốn, mình sẽ viết tiếp ngay bản Chương 3 hoàn chỉnh theo văn phong học thuật, gồm:
1. Mô tả kiến trúc bằng sơ đồ Mermaid.
2. Đặc tả chi tiết từng workflow theo format Input - Process - Output - Exception.
3. Bộ bảng KPI mẫu và khung trình bày kết quả để đưa thẳng vào luận văn.