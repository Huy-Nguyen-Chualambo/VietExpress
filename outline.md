# Workflow n8n Automation + AI Cho Quy Trình Sản Xuất VietExpress

## 1. Tổng Quan Chiến Lược

**Mục tiêu:**
- Tự động hóa quy trình sản xuất/vận hành từ nhận hàng → giao hàng
- Giảm độ trễ cập nhật trạng thái
- Phát hiện sớm rủi ro SLA trước khi vượt thời gian quy định
- Tối ưu điều phối lấy hàng dựa trên thuật toán + AI
- Cá nhân hóa thông báo khách hàng theo tình huống

**Nguyên tắc:**
- AI chỉ **đề xuất**, không **quyết định** ở các ca rủi cao
- Mọi bước phải có log, status, và trace để đo KPI
- Fail-safe: nếu AI không chắc chắn → chuyển queue nhân viên
- Human-in-the-loop bắt buộc cho các trường hợp ngoại lệ

---

## 2. Workflow #1: Order Intake & Data Normalization (Tóm Tắt + AI Chuẩn Hóa)

**Trigger:** 
- Webhook: `POST /api/orders/intake` từ web portal hoặc batch integration

**Quy trình:**
```
1. Validate Payload
   ├─ Check required fields (customer_id, origin, destination, weight, service)
   ├─ If missing → return 400 + list missing fields
   └─ If valid → proceed
   
2. Normalize Data (AI-assisted)
   ├─ Address parsing: AI tách "thôn Hòa, xã Hạ Hòa, Hưng Yên" → 
   │  {ward: "Hạ Hòa", district: "Hưng Yên", province: "Hưng Yên", raw_address: "..."}
   │  (dùng Claude API + mapping database cộng hòa xã thành phố)
   ├─ Service type normalization:
   │  "chuyển phát nhanh" → "express", "chở trọn gói" → "ftl"
   │  (dùng n8n fuzzy match + LLM confirmation nếu confidence < 0.8)
   ├─ Weight & dimension validation:
   │  Nếu dimensions khác thường → AI cảnh báo (dễ nhập sai)
   └─ Customer profile lookup:
      Lấy history khách: số đơn, tổng doanh thu, tỉ lệ claim
      → trả về customer_segment (VIP, regular, new)
      
3. Check for Fraud/High Risk
   ├─ Nếu weight quá lớn không match service type → flag
   ├─ Nếu destination bất thường (quốc gia? lần đầu đưa?) → flag
   ├─ Score risk (0-100) bằng rule + AI learning
   └─ Risk >= 60 → route to manual_review queue
   
4. Create Quote
   ├─ Call n8n "Calculate Reference Price" (reuse từ báo giá workflow)
   ├─ Thêm surcharge nếu có (COD, insurance, peak hour, etc.)
   └─ Return order_id, quote_id, estimated_price
   
5. Persist to DB
   ├─ INSERT into orders table (status = intake_pending)
   ├─ INSERT into audit_log (who, what, when, ip, risk_score)
   └─ Emit event: order.created → trigger workflow tiếp theo
   
6. Return Response + Schedule Confirmation
   ├─ Return 201 + {order_id, quote_link}
   ├─ Nếu customer_id chưa có (new) → Schedule email xác nhận
   └─ Nếu có Zalo OA → Schedule Zalo confirmation
```

**AI Integration Points:**
- **Address Parsing:** Claude (hoặc OpenAI) + vector DB cộng hòa xã → xác định tỉnh/huyện/xã chính xác
- **Service Type Mapping:** LLM + fuzzy match + confidence scoring
- **Risk Assessment:** Heuristic rules + optional ML model (nếu có đủ dữ liệu)
- **Customer Segmentation:** Rule-based hoặc simple classification

**Key Parameters:**
```json
{
  "webhook_path": "POST /api/orders/intake",
  "timeout_s": 15,
  "retry_count": 3,
  "fallback": "queue_to_manual_review",
  "ai_models": ["claude-3.5-sonnet", "address-parser-v1"],
  "confidence_threshold": 0.8
}
```

---

## 3. Workflow #2: Pickup Dispatch & Route Optimization (Lấy Hàng Tối Ưu + AI Routing)

**Trigger:**
- Schedule: mỗi sáng 06:00 AM quét orders với `status = ready_for_pickup`
- Hoặc real-time: khi order chuyển sang `ready_for_pickup`

**Quy trình:**
```
1. Fetch Pending Pickups
   ├─ Query orders: 
   │  WHERE status IN ('ready_for_pickup', 'scheduled_pickup')
   │  AND pickup_date <= TODAY + 1
   │  ORDER BY priority DESC, created_at ASC
   └─ Fetch delivery partner list + current location (từ GPS hoặc last_known)
   
2. Vehicle & Capacity Check
   ├─ Danh sách xe sẵn có hôm nay (status = available)
   ├─ Tính tải trọng từng xe (current_load, max_capacity)
   ├─ Tính volume mỗi xe (current_volume, max_volume)
   └─ Lọc xe khả dụng (còn chỗ)
   
3. AI Route Optimization
   ├─ Input: 
   │  - List: [order_1, order_2, ..., order_n] (pickup locations + priorities)
   │  - List: [vehicle_1, vehicle_2, ...] (current location, capacity, type)
   │  - Google Maps API: distance matrix
   ├─ Algorithm (có thể dùng một trong:)
   │  A) n8n built-in "Optimize Route" node (nếu available)
   │  B) Python subprocess: hoặc-tools, simulated annealing
   │  C) External API: Google Maps Platform / HERE Routing
   │  D) AI-guided: Claude / GPT-4o để suggest route dựa heuristic
   │
   ├─ Output:
   │  {
   │    "vehicle_id": "V001",
   │    "driver_id": "D042",
   │    "route": [
   │      {"order_id": "O123", "address": "...", "priority": 1, "seq": 1},
   │      {"order_id": "O124", "address": "...", "priority": 2, "seq": 2},
   │      ...
   │    ],
   │    "estimated_time_minutes": 120,
   │    "total_weight_kg": 250,
   │    "total_volume_m3": 0.8,
   │    "confidence_score": 0.92
   │  }
   │
   └─ Nếu confidence < 0.75 hoặc error → fallback to manual assignment
   
4. Assign & Notify Driver
   ├─ UPDATE orders SET vehicle_id, route_sequence, estimated_pickup_time
   ├─ INSERT into vehicle_manifest (vehicle_id, list of orders)
   ├─ SMS/Zalo notify driver: "Bạn có 5 đơn hàng lấy hôm nay, xuất phát 07:00"
   │  + attach dynamic route map link (Google Maps / Mapbox)
   ├─ Update order status → assigned_for_pickup
   └─ Emit event: pickup.assigned → trigger confirmation to customers
   
5. Schedule Progress Check
   ├─ Schedule callback task sau 60 phút
   ├─ Check: tất cả orders có status >= in_pickup_route?
   ├─ Nếu có order vẫn assigned → alert dispatcher
   └─ Dùng để measure pickup efficiency KPI
```

**AI Integration Points:**
- **Route Optimization:** Claude/GPT-4o hoặc Python library + Google Maps API
- **Driver Assignment:** Simple rule (closest_to_origin) hoặc LLM heuristic (nếu driver có specialization)
- **ETA Prediction:** Linear regression / time-series model dựa historical data

**Key Metrics to Log:**
- time_to_optimization
- optimization_quality_score (distance_ratio)
- driver_acceptance_time
- pickup_start_time vs estimated_start_time

---

## 4. Workflow #3: Real-time Status Update & Smart Notifications (Cập Nhật Trạng Thái + Thông Báo Tự Động)

**Trigger:**
- Webhook: driver/warehouse scan barcode → `POST /api/shipments/status_update`
- Hoặc: webhook từ 3PL warehouse khi hàng vào/ra kho

**Quy trình:**
```
1. Receive Status Update Event
   ├─ Parse webhook payload: {order_id, timestamp, event_type, location_gps, notes}
   ├─ Validate signature (HMAC-SHA256)
   ├─ Dedup check: idempotency_key để chống gửi trùng
   └─ Log to audit_log

2. Enrich Event with Context
   ├─ Fetch order details: customer_id, service_type, sla_deadline, customer_preferences
   ├─ Fetch customer contact: phone, email, zalo_user_id, language
   ├─ Fetch route context: estimated_remaining_time, next_stop
   └─ Fetch historical pattern: typical delay for this route, weather data
   
3. AI-Powered Insight Generation
   ├─ AI nhận sự kiện + context → generate insight:
   │
   │  Cases:
   │  A) Event: "in_route" (driver đang chuyên chở)
   │     Insight: "Dự kiến giao hàng {ETA}. Nếu quá giờ → Khách sẽ bị ảnh hưởng SLA"
   │     → Score urgency (0-100)
   │
   │  B) Event: "delayed_at_warehouse" (delay > 2 hours at pickup point)
   │     Input: {delay_duration, reason, service_type, customer_segment}
   │     AI: "Có khả năng vượt SLA cao. Nên gửi proactive message khách."
   │     → Generate: customer message template + compensation suggestion
   │
   │  C) Event: "attempted_delivery_failed"
   │     Input: {reason, customer_type, delivery_attempt_count, remaining_sla}
   │     AI: Suggest next action:
   │          - "Retry lần {n+1} + call trước 30 phút"
   │          - hoặc "Hold tại pickup point, customer pick up sáng mai"
   │
   ├─ Risk scoring (0-100):
   │  - actual_time vs sla_deadline
   │  - driver_performance_rating
   │  - weather conditions
   │  - past similar routes median time
   │
   └─ Return: {event_enriched, risk_score, next_action_recommendations}
   
4. Conditional Notification Routing
   ├─ IF risk_score >= 75 (very high risk)
   │  ├─ Notify dispatcher via SMS alert + phone call
   │  ├─ Ask human decision: escalate, reroute, offer compensation
   │  └─ Lock automated action (wait for human approval)
   │
   ├─ IF 50 <= risk_score < 75 (medium risk)
   │  ├─ Send customer proactive message (Zalo):
   │  │  Template AI-generated: "Hàng của bạn đang chuyên chở, có thể giao hôm {day}..."
   │  ├─ Offer options: reschedule, hold, compensation_preview
   │  └─ Log message interaction for CRM
   │
   └─ IF risk_score < 50 (normal)
      ├─ Update status quietly (no message)
      └─ Schedule standard notification at milestone (delivery_success)
      
5. Multi-Channel Message Generation & Send
   ├─ FOR each customer preferred channel (zalo, sms, email, push):
   │  ├─ Render message:
   │  │  - Zalo: "🚚 Vận đơn {id} đang trên đường. ETA {time}. [Track link]"
   │  │  - SMS: "VietExpress: Hàng đơn {id} sắp đến. Chi tiết: {link}"
   │  │  - Email: Rich HTML template with order details + insurance/COD upsell
   │  │
   │  ├─ Send via respective channel (Zalo OA API, Twilio, SendGrid)
   │  ├─ Retry logic: max 3 attempts, exponential backoff
   │  └─ Log message_send event (success/fail, timestamp, delivery_status)
   │
   └─ Fallback: nếu cả 3 channel fail → create support ticket
   
6. Update Order Status & Emit Events
   ├─ UPDATE orders SET status = {new_status}, last_status_update = NOW()
   ├─ UPDATE orders SET sla_risk_score = {risk_score} (for tracking)
   ├─ INSERT shipment_status_history (audit trail)
   ├─ Emit domain events:
   │  - order.status_changed
   │  - order.at_risk (if risk_score >= 60)
   │  - order.delayed_beyond_sla (if current_time > sla_deadline)
   └─ Return 202 Accepted
   
7. Schedule SLA Alert (if at risk)
   ├─ IF risk_score >= 50 AND not yet notified:
   │  ├─ Schedule follow-up check in 30 minutes
   │  ├─ If still at risk → escalate to supervisor
   │  └─ Supervisor manually approve: extend SLA? offer discount?
   └─ Log all decisions for KPI traceability
```

**AI Integration Points:**
- **Insight Generation:** Claude / GPT-4 analyze event + context → {recommendation, risk_score, message_template}
- **ETA Prediction:** Time-series model (if enough historical data) or rule-based estimate + weather API
- **Message Personalization:** LLM generate tone + content based on customer_segment + past interaction style
- **Anomaly Detection:** Detect unusual delays vs historical baseline

**Key Parameters:**
```json
{
  "webhook_path": "POST /api/shipments/status_update",
  "signature_algorithm": "HMAC-SHA256",
  "idempotency_key_ttl_minutes": 5,
  "risk_thresholds": {
    "critical": 75,
    "high": 50,
    "normal": 0
  },
  "notification_channels": ["zalo", "sms", "email"],
  "ai_model": "claude-3.5-sonnet",
  "max_retry": 3
}
```

---

## 5. Workflow #4: SLA Monitoring & Predictive Intervention (Giám Sát SLA + Cảnh Báo Chủ Động)

**Trigger:**
- Schedule: chạy mỗi 15 phút để quét orders có risk
- Hoặc: real-time trigger khi có status update (workflow #3)

**Quy trình:**
```
1. Fetch At-Risk Orders
   ├─ Query: 
   │  WHERE status NOT IN ('delivered', 'cancelled', 'returned')
   │  AND sla_deadline < NOW() + 2 hours
   │  AND sla_risk_score >= 50
   │  LIMIT 50 (process in batch)
   
2. For Each At-Risk Order:
   ├─ Recalculate current SLA margin:
   │  margin = sla_deadline - NOW()
   │  margin_percentage = margin / sla_deadline * 100
   │
   ├─ Check if intervention already escalated:
   │  last_escalation_time < 30 minutes → skip
   │
   ├─ Evaluate intervention options (AI-guided):
   │  A) Can we reroute? (check distance to alternative depot)
   │  B) Can we speed up? (offer express completion, ask driver)
   │  C) Should we proactively contact customer? (ask for patience, offer discount)
   │  D) Is this unrecoverable? (customer will miss SLA, prepare compensation)
   │
   └─ AI scoring: which option highest chance of success + lowest cost
      → return recommendation
      
3. Execute Recommended Intervention
   ├─ IF reroute recommendation:
   │  ├─ Call workflow #2 to reassign driver
   │  ├─ Notify driver + customer
   │  └─ Track outcome
   │
   ├─ IF proactive contact:
   │  ├─ Compose message: "Hàng của bạn còn {margin} để giao. Nếu trễ, chúng tôi sẽ..."
   │  ├─ Send via Zalo + SMS
   │  ├─ Record customer response
   │  └─ If customer agrees extension → update sla_deadline
   │
   ├─ IF unrecoverable:
   │  ├─ Prepare compensation record: {order_id, reason, amount, approved_by_supervisor}
   │  ├─ Notify customer: "Xin lỗi, hàng sẽ trễ SLA. Chúng tôi sẽ hoàn {amount} VND..."
   │  ├─ Create ticket for supervisor approval
   │  └─ Log for post-incident review
   │
   └─ Emit event: order.intervention_executed
   
4. Follow-up Check
   ├─ Schedule callback 60 minutes later
   ├─ If intervention successful → close ticket
   ├─ If still at risk → escalate to manager
   └─ Log all attempts + outcomes for KPI
   
5. Post-Delivery Analysis (async)
   ├─ After delivery_complete event:
   │  ├─ Was SLA met? 
   │  ├─ Did intervention help?
   │  ├─ What could have been done earlier?
   │  └─ Update ML training data
   └─ Email report to ops team: intervention success rate, cost of interventions, etc.
```

**AI Integration Points:**
- **Intervention Recommendation:** Claude/GPT-4o analyze {risk_score, margin, history, options} → best_option + confidence
- **Outcome Prediction:** Simple ML (logistic regression) to score success probability of each intervention
- **Compensation Calculation:** Rule-based or AI-guided (value = service_fee * discount_factor)

**Key Metrics:**
- intervention_success_rate (% orders where intervention prevented SLA breach)
- average_intervention_cost (discount + manual labor)
- false_positive_rate (predicted at-risk but eventually on-time)
- time_from_at_risk_to_intervention

---

## 6. Workflow #5: Delivery Completion & Feedback Loop (Hoàn Tất Giao Hàng + Feedback AI)

**Trigger:**
- Webhook: driver confirms delivery (scan barcode / GPS / photo)
- Event: order.status_change → delivered

**Quy trình:**
```
1. Receive Delivery Confirmation
   ├─ Parse: {order_id, timestamp, location_gps, photo, recipient_name, notes}
   ├─ Validate: signature, idempotency, barcode match
   └─ Fetch order context
   
2. Generate Delivery Receipt (AI-assisted)
   ├─ Compose receipt message:
   │  "Vận đơn {id} đã giao cho {recipient} lúc {time} tại {address}"
   ├─ Include:
   │  - tracking link for history
   │  - feedback form link
   │  - next service offer (return shipment, insurance, etc.)
   │  - receipt PDF (attach signature photo)
   └─ Personalize tone based on customer_segment
   
3. Update Order Status
   ├─ UPDATE orders SET status = 'delivered', actual_delivery_time = NOW()
   ├─ Calculate actual_sla = actual_delivery_time - created_at
   ├─ Check if SLA met: sla_met = (actual_sla <= sla_deadline)
   ├─ INSERT into delivery_completion_log
   └─ Emit event: order.delivered
   
4. Send Multi-Channel Notification
   ├─ Zalo: Receipt message + feedback form link
   ├─ SMS: Short notification
   ├─ Email: Detailed receipt + next service offers
   └─ Log delivery confirmation to CRM
   
5. AI Feedback Collection (proactive)
   ├─ Score delivery quality:
   │  - delivery_success: 1 if delivered, 0 if failed
   │  - timeliness: 1 if on-time, 0.5 if 1-2h late, 0 if >2h
   │  - driver_rating: from photo quality + notes (rough heuristic)
   │
   ├─ Generate feedback question (Claude):
   │  IF sla_met: "Hãy đánh giá trải nghiệm giao hàng của chúng tôi?"
   │  ELSE: "Hàng đã trễ. Bạn có góp ý gì để cải thiện?"
   │
   ├─ Send survey link (Typeform / custom form)
   ├─ Incentive: small discount for completing survey
   └─ Track survey response rate
   
6. Offer Next Service (Cross-sell)
   ├─ AI analyze order: service_type, value, frequency
   ├─ Suggest next likely service:
   │  - If customer is B2B → suggest bulk discount
   │  - If shipping to rural area → suggest insurance
   │  - If cold chain → suggest cold storage service
   ├─ Personalize message tone
   └─ Track offer acceptance rate
   
7. Calculate & Record KPI for Dashboard
   ├─ sla_on_time: 1 or 0
   ├─ delivery_speed_score: (sla_deadline - actual_delivery_time) / sla_deadline
   ├─ customer_happiness_prediction: (from tone of driver notes)
   ├─ repeat_purchase_likelihood: (from order history)
   └─ Store in kpi_log for BI dashboard
```

**AI Integration Points:**
- **Message Personalization:** LLM generate tone + content based on customer_segment + SLA performance
- **Service Recommendation:** Collaborative filtering / rule-based suggest next service
- **Quality Scoring:** Heuristic or simple ML to estimate delivery quality from photos + driver notes

---

## 7. Workflow #6: Daily KPI Report & Continuous Improvement (Báo Cáo KPI + Cải Thiện)

**Trigger:**
- Schedule: mỗi ngày 18:00 (cuối ca)
- Manual trigger: management request

**Quy trình:**
```
1. Fetch KPI Data (past 24 hours)
   ├─ Operational KPI:
   │  - orders_received, orders_delivered, orders_failed
   │  - average_delivery_time, on_time_percentage
   │  - average_sla_margin (hours remaining at delivery)
   │  - pickup_efficiency (orders per vehicle per day)
   │  - route_optimization_quality (actual_distance vs optimal_distance)
   │
   ├─ AI Performance KPI:
   │  - address_parsing_success_rate
   │  - service_type_classification_accuracy
   │  - risk_prediction_precision (% of at-risk orders that actually breached SLA)
   │  - intervention_success_rate (% where intervention prevented SLA breach)
   │  - notification_open_rate, feedback_form_completion_rate
   │
   └─ Financial KPI:
      - total_revenue, average_order_value
      - cost_of_interventions, cost_of_compensation
      - roi_of_automation (savings from reduced manual labor)
```

**AI Integration Points:**
- **Anomaly Detection:** Detect KPI outliers → why was this day different?
- **Trend Analysis:** Time-series model to forecast next week's KPI
- **Insight Generation:** Claude analyze KPI → {key_insights, recommendations}

**Output:**
```json
{
  "report_date": "2026-05-07",
  "period": "past_24_hours",
  "operational": {
    "orders_received": 145,
    "orders_delivered": 142,
    "on_time_percentage": 94.4,
    "average_delivery_time_hours": 24.5,
    "failed_orders": 3
  },
  "ai_quality": {
    "address_parsing_success": 0.98,
    "risk_prediction_precision": 0.87,
    "intervention_success_rate": 0.76
  },
  "ai_insights": [
    "Delivery success rate improved 2% today, likely due to new route optimization algorithm.",
    "Risk prediction had 2 false positives (flagged on-time orders as at-risk). Review thresholds.",
    "3 orders breached SLA despite intervention. Root cause: weather delay + insufficient vehicle capacity."
  ],
  "recommendations": [
    "Increase buffer time for weather-prone routes by 15% during monsoon season.",
    "Review vehicle assignment: add min_buffer_capacity check to prevent over-allocation.",
    "A/B test: proactive customer contact at 25% SLA margin (vs current 50%) to measure impact."
  ]
}
```

---

## 8. Workflow #7: Exception Handling & Manual Queue Management (Xử Lý Ngoại Lệ + Queue Thủ Công)

**Trigger:**
- Automated: when any workflow hits error / AI confidence < threshold
- Manual: supervisor creates task

**Quy trình:**
```
1. Route Exception to Right Queue
   ├─ Data quality issues (missing required field):
   │  └─ Queue: data_entry_team, priority = medium, deadline = 1 hour
   │
   ├─ AI low confidence (risk_score = null, service_type = unknown):
   │  └─ Queue: classification_team, priority = high, deadline = 30 min
   │
   ├─ Delivery failed (attempted 3x, customer not found):
   │  └─ Queue: customer_service_team, priority = high, deadline = 4 hours
   │
   ├─ SLA will breach despite intervention:
   │  └─ Queue: manager_approval, priority = critical, deadline = immediate
   │
   ├─ Payment issue (COD customer refuses to pay):
   │  └─ Queue: finance_team, priority = medium, deadline = 2 hours
   │
   └─ Other / system error:
      └─ Queue: tech_support, priority = low, deadline = 1 day
      
2. Create Task (n8n task node)
   ├─ title: "Manual: Resolve missing delivery address for order O9999"
   ├─ description: include all context (order details, error message, AI recommendation)
   ├─ assignment: auto-assign to team via round-robin or skill-based routing
   ├─ deadline: based on queue priority
   ├─ attachment: order details, AI insights, previous attempts
   ├─ workflow_id: link back to n8n workflow for audit
   └─ set status = assigned
   
3. Notify Assignee
   ├─ Email alert + Slack / Teams message
   ├─ Include task link (direct to form/portal)
   └─ Set escalation: if not acted upon in 2 hours → notify supervisor
   
4. Wait for Resolution (human action)
   ├─ Assignee: click task → see AI context + recommendation
   ├─ Options:
   │  A) Accept AI recommendation → auto-apply + resume workflow
   │  B) Override AI → manual input + log reason
   │  C) Cannot resolve → escalate to manager
   │  D) Request more info → send message to order creator
   │
   ├─ Assignee action recorded: {decision, timestamp, user_id, notes}
   └─ Task status → completed / escalated / pending_info
   
5. Callback & Resume Workflow
   ├─ Once task completed:
   │  ├─ Fetch assignee's decision
   │  ├─ Resume suspended workflow with new data
   │  ├─ Re-run AI analysis (if data changed)
   │  └─ Continue to next step
   │
   └─ Log: {who, decision, time_spent, cost_of_manual_work}
   
6. Metric: Manual Intervention Cost & Opportunity
   ├─ measure: % orders requiring manual intervention
   ├─ track: avg time to resolve per exception type
   ├─ calculate: cost = hourly_rate * time_spent
   └─ dashboard: breakdown of exception types (to identify improvement areas)
```

**Key Config:**
```json
{
  "exception_queues": {
    "data_entry_team": {"priority": "medium", "deadline_minutes": 60},
    "classification_team": {"priority": "high", "deadline_minutes": 30},
    "manager_approval": {"priority": "critical", "deadline_minutes": 5},
    "customer_service_team": {"priority": "high", "deadline_minutes": 240}
  },
  "escalation_rule": "if_unresolved_in_2x_deadline_notify_supervisor"
}
```

---

## 9. Implementation Roadmap (4 Tuần)

### **Tuần 1: MVP - Workflows #1 & #2 (No AI)**
- [ ] Order Intake workflow (basic validation + quote calculation)
- [ ] Pickup Dispatch (route assignment, no optimization)
- [ ] Test end-to-end with real order data
- [ ] Baseline KPI: measure current manual time + error rate
- [ ] Deploy to staging, smoke test

### **Tuần 2: Status Update Workflow (Workflow #3)**
- [ ] Status update webhook + notification channels (Zalo, SMS, Email)
- [ ] Simple SLA margin calculation (rule-based, no AI yet)
- [ ] Basic notification (no personalization)
- [ ] Error handling & fallback logic
- [ ] Load testing: can handle 100 concurrent updates?

### **Tuần 3: AI Integration (Workflows #1, #3, #4)**
- [ ] Add Claude/GPT-4 API calls for:
  - [ ] Address parsing (Workflow #1)
  - [ ] Risk assessment & notification personalization (Workflow #3)
  - [ ] SLA intervention recommendation (Workflow #4)
- [ ] Add confidence scoring & human-in-the-loop gates
- [ ] A/B test AI messages vs template messages
- [ ] Measure KPI improvement

### **Tuần 4: Polish & KPI Measurement**
- [ ] Workflows #5 (delivery completion), #6 (daily KPI report), #7 (exception handling)
- [ ] Dashboard for KPI monitoring
- [ ] Document all flows for thesis chapter
- [ ] Run 2-week pilot with real users
- [ ] Measure & analyze KPI before/after automation

---

## 10. Key Success Metrics (KPI to Track)

### **Operational Efficiency**
| Metric | Baseline (Manual) | Target (Automated) | How to Measure |
|--------|-----|--------|---|
| Avg time to send first quote | 60 min | < 5 min | timestamp(order.created) → timestamp(notification.sent) |
| Pickup assignment time | 20 min | < 3 min | timestamp(ready_for_pickup) → timestamp(assigned) |
| SLA on-time delivery % | 85% | > 94% | count(delivered_on_time) / count(total_delivered) |
| Orders requiring manual review | 40% | < 15% | count(manual_queue) / count(total) |
| Avg manual review time | 15 min | < 5 min | sum(assignee_time) / count(manual_queue) |

### **AI Quality**
| Metric | Definition | Target |
|--------|----|----|
| Address parsing accuracy | % addresses correctly identified to province/district/ward | > 95% |
| Risk prediction precision | % of flagged at-risk orders that actually breach SLA | > 80% |
| Intervention success rate | % where AI intervention prevented SLA breach | > 70% |
| Notification open rate | % of messages opened by customer | > 60% |
| Customer satisfaction (CSAT) | NPS or CSAT score post-delivery | > 7/10 |

### **Cost Impact**
| Metric | Formula | Unit |
|--------|---------|------|
| Labor cost saved | (manual_time_before - manual_time_after) * hourly_rate | VND/month |
| Intervention cost | count(interventions) * avg_discount_per_intervention | VND/month |
| ROI of automation | (labor_cost_saved - intervention_cost - ai_api_cost) / total_investment | % or months payback |

---

## 11. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **AI hallucination** (wrong address parsing) | Customer doesn't get order | High confidence threshold (>0.9), human review for low confidence |
| **SLA intervention too aggressive** | Unnecessary discounts, customer complaint | A/B test intervention timing, track false-positive rate |
| **Delivery partner resistance** | Manual override, low adoption | Train drivers on benefits, show reduced manual work |
| **Data quality** (missing address, wrong weight) | Garbage in → garbage out | Validate at intake, require confirmation from customer |
| **API dependencies** (Google Maps timeout) | Workflow hangs | Fallback to manual assignment, cache previous results |
| **Customer privacy** (Zalo/SMS overload) | Spam complaints | Respect opt-in preference, limit message frequency |

---

## 12. Technology Stack Recommendation

```yaml
# n8n Workflows
orchestration: n8n (self-hosted or cloud)
nodes:
  - webhook: trigger events
  - http: API calls (Google Maps, Zalo, SendGrid, etc.)
  - code: JavaScript for data transformation
  - schedule: cron jobs for batch processing
  - db_query: PostgreSQL for persistence
  - ai_integration: Claude API / OpenAI API calls

# Backend Infrastructure
database: PostgreSQL (orders, shipments, events, audit_log)
queue: Bull / Redis (for async tasks if scaling)
cache: Redis (for route cache, recent orders)
logging: ELK stack or Cloudflare Logpush (for audit trail)
monitoring: Datadog / New Relic (for workflow health, API latency)

# AI & ML
llm: Claude 3.5 Sonnet (for text generation, classification)
ml_frameworks: scikit-learn (if custom ML models for risk scoring)
vector_db: Pinecone or Chroma (for address/customer embeddings)

# Communication Channels
messaging:
  - Zalo: official OA SDK
  - SMS: Twilio or local SMS provider
  - Email: SendGrid

# Frontend (for task queue management)
portal: Next.js / React (what you already have)
auth: NextAuth (existing setup)
```

---

## 13. Monitoring & Observability

Every workflow must have:
1. **Execution logs:** {workflow_id, run_id, timestamp, status, duration, error}
2. **Event audit trail:** {event_type, actor, object_id, old_value, new_value, timestamp}
3. **KPI metrics:** {date, metric_name, value, dimension} → feed to BI dashboard
4. **Traces:** distributed tracing (OpenTelemetry) if calling external APIs

Example dashboard queries:
```sql
-- Daily KPI Report
SELECT 
  DATE(created_at) as report_date,
  COUNT(*) as orders_created,
  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
  AVG(CASE WHEN delivered_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (delivered_at - created_at))/3600 
        ELSE NULL END) as avg_delivery_hours,
  SUM(CASE WHEN delivered_at <= sla_deadline THEN 1 ELSE 0 END) * 100.0 / 
    NULLIF(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0) as on_time_percentage
FROM orders
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY report_date
ORDER BY report_date DESC;

-- AI Performance
SELECT 
  DATE(created_at) as report_date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN address_parsing_confidence > 0.9 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as high_confidence_pct,
  SUM(CASE WHEN required_manual_review = true THEN 1 ELSE 0 END) as manual_review_count
FROM orders_with_ai_metrics
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY report_date;
```

---

## 14. Next Steps

1. **Finalize Priority:** Which workflow (#1-7) to build first based on business impact?
2. **Allocate Resources:** Who builds n8n workflows? Who builds backend APIs? Who manages AI prompts?
3. **Setup Test Data:** Prepare 500-1000 orders for UAT
4. **Define SLAs:** Confirm SLA targets for each service type
5. **Compliance & Security:** Review data handling (customer phone, address) for GDPR/local regulations
6. **Go-Live Plan:** Phased rollout (staging → beta users → full production)

---

**End of Document**

*Tài liệu này đề xuất 7 workflows n8n chính để tự động hóa quy trình sản xuất VietExpress với tích hợp AI. Mỗi workflow có mục tiêu, quy trình chi tiết, integration points, và KPI đo lường.*
