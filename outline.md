# Mapping Đề Tài → Workflows n8n Automation + AI

**Đề Tài:** *Thiết kế, xây dựng, vận hành và đánh giá các luồng automation tích hợp AI trong một số quy trình sản xuất và hành chính*

---

## 1. Phân Chia Quy Trình

### **QUYTRÌNH HÀNH CHÍNH (Administrative Processes)**
Quản lý dữ liệu, thông tin, tài chính, hợp đồng, báo cáo hành chính

### **QUY TRÌNH SẢN XUẤT/VẬN HÀNH (Production/Operations Processes)**
Thực tế giao hàng: lấy hàng, vận chuyển, giao hàng, theo dõi

---

## 2. Ma Trận Workflows × Quy Trình

| # | Workflow | Category | Mô Tả | AI Role |
|---|----------|----------|-------|---------|
| **1** | Order Intake & Data Normalization | **HÀNH CHÍNH** | Nhận yêu cầu → chuẩn hóa thông tin → kiểm tra rủi ro | Address parsing, fraud detection |
| **2** | Quote Calculation & Pricing | **HÀNH CHÍNH** | Tính cước dựa bảng giá → apply phụ phí → gợi ý surcharge | Price suggestion, discount rules |
| **3** | Quote Sending & Customer Communication | **HÀNH CHÍNH** | Gửi báo giá qua Zalo/Email → track response → follow-up | Message personalization, NLP sentiment |
| **4** | Customer Order Confirmation & Contract | **HÀNH CHÍNH** | Khách xác nhận → tạo contract → yêu cầu thanh toán | Contract auto-generation, payment verification |
| **5** | Pickup Dispatch & Route Optimization | **SẢN XUẤT** | Gán xe + driver → tối ưu lộ trình → thông báo driver | Route optimization, ETA prediction |
| **6** | Real-time Shipment Tracking & Status Updates | **SẢN XUẤT** | Driver scan barcode → cập nhật status → thông báo khách | Anomaly detection, risk assessment |
| **7** | SLA Monitoring & Predictive Intervention | **SẢN XUẤT** | Phát hiện trễ → AI recommend action → execute intervention | Time-series prediction, decision engine |
| **8** | Delivery Completion & Receipt | **SẢN XUẤT** | Xác nhận giao hàng → tạo receipt → follow-up gợi dịch vụ | NPS sentiment, service upselling |
| **9** | Invoice & Payment Collection | **HÀNH CHÍNH** | Generate hóa đơn → gửi → track thanh toán → nhắc nhở | Intelligent reminders, payment prediction |
| **10** | Daily KPI Report & Performance Analysis | **HÀNH CHÍNH** | Tổng hợp KPI → generate insights → recommend improvements | Trend analysis, anomaly detection, NLP insights |
| **11** | Exception Handling & Escalation Queue | **HÀNH CHÍNH** | Route ngoại lệ → assign task → track resolution | Smart routing, priority scoring |
| **12** | Customer Feedback & Sentiment Analysis | **HÀNH CHÍNH** | Collect NPS → analyze comments → identify issues | NLP sentiment, topic extraction |

---

## 3. Workflows HÀNH CHÍNH Chi Tiết

### **HÀNH CHÍNH #1: Order Intake & Data Normalization** 
**Trigger:** Customer submits order form on web portal  
**Input:** {customer_name, phone, address_from, address_to, weight, dimensions, service_type, notes}  
**Output:** {order_id, normalized_data, risk_score, assigned_to_queue}

**AI Integration:**
```python
# 1. Address Parsing (Claude)
address_input = "thôn Hoài, xã Hạ Hòa, Hưng Yên"
→ Claude API + vector DB cộng hòa xã
→ {ward: "Hạ Hòa", district: "Hưng Yên", province: "Hưng Yên", geo_code: "..."}

# 2. Service Type Classification (LLM + fuzzy match)
service_input = "chuyên chở nhanh"
→ n8n fuzzy match + LLM confirm
→ {service_type: "express", confidence: 0.95}

# 3. Fraud Detection (rule + ML)
features = {weight, address_unusual, customer_history, ...}
→ ML model or rule-based scoring
→ risk_score: 0-100, recommendation: "approve" | "review" | "reject"
```

**Key Metrics:**
- address_parsing_accuracy (% correctly identified province/district)
- manual_review_rate (% orders requiring human review)
- time_to_process (seconds to normalize)

---

### **HÀNH CHÍNH #2: Quote Calculation & Pricing**
**Trigger:** After Order Intake validation  
**Input:** {normalized_order_data, customer_segment, market_conditions}  
**Output:** {base_price, surcharges, total_quote, price_breakdown}

**AI Integration:**
```python
# 1. Dynamic Pricing (rule-based + AI suggestion)
base_price = calculate_base_price(service_type, weight, distance, region)
surcharges = {
    "peak_hour": 50000 if time.hour in [7-9, 17-19] else 0,
    "weather": 100000 if weather.temp < 5 or weather.humidity > 80 else 0,
    "insurance": ask_ai_should_upsell_insurance(customer_segment, order_value),
    "cold_chain": 150000 if service_type == "cold" else 0
}

# 2. Discount Eligibility (AI-guided)
customer_loyalty = days_since_first_order, repeat_frequency, total_value
→ Claude analyze + recommend: "Offer 5% discount to incentivize repeat"
→ confidence_score for discount acceptance

# 3. Competitive Pricing (optional)
competitor_prices = fetch_competitor_estimates()
→ LLM: "Our price is 10% higher than market. Recommend 8% discount to win deal."
```

**Key Metrics:**
- quote_generation_time (target: <30 seconds)
- price_accuracy (% quotes accepted without negotiation)
- margin_achieved (actual_price / cost_of_service)

---

### **HÀNH CHÍNH #3: Quote Sending & Customer Communication**
**Trigger:** After quote calculated  
**Input:** {customer_contact, quote_details, customer_segment}  
**Output:** {message_id, sent_via_channels, response_tracking}

**AI Integration:**
```python
# 1. Message Personalization (LLM)
customer_profile = {segment: "VIP", past_feedback: "values speed", language: "Vietnamese"}
message_tone = determine_tone(customer_profile)  # "professional", "casual", "urgent"
message_content = {
    "greeting": f"Chào {customer_name}",  # personalized
    "value_prop": f"Dịch vụ {service_type} của chúng tôi...",  # AI-customized
    "cta": "Xác nhận ngay để được ưu tiên" if segment == "VIP" else "Hãy xác nhận",
    "urgency": "Báo giá hết hiệu lực trong 24h" if order_value > threshold else ""
}

# 2. Multi-Channel Orchestration
channels = {
    "zalo": (message_zalo, confidence=0.95),
    "email": (message_email_html, confidence=0.98),
    "sms": (message_sms_short, confidence=1.0)  # fallback
}
→ n8n send each channel with retry logic

# 3. Response Tracking
→ Track: open_time, click_time, reply_time, sentiment
→ If no response in 2 hours + VIP → auto-follow-up with discount hint
```

**Key Metrics:**
- message_open_rate (Zalo, Email)
- response_rate_within_4h, 24h, 72h
- conversion_rate (quote_sent → customer_confirmed)
- message_personalization_score (A/B test custom vs template)

---

### **HÀNH CHÍNH #4: Customer Order Confirmation & Contract**
**Trigger:** Customer confirms quote  
**Input:** {customer_agreement, payment_method, delivery_preferences}  
**Output:** {contract_id, payment_request, delivery_appointment}

**AI Integration:**
```python
# 1. Automated Contract Generation (LLM)
contract_template = templates["standard_delivery"]
contract_filled = LLM.fill_contract(
    template=contract_template,
    order_data=order_details,
    customer_data=customer_info,
    terms=terms_from_config
)
→ Generate PDF + embed terms

# 2. Payment Verification & Risk
payment_method = customer.payment_method  # COD, bank transfer, card
→ If COD: LLM assess risk "High-value COD order, should verify customer"
→ If bank transfer: auto-create payment request + calendar reminder

# 3. Delivery Preferences Collection (conversational)
delivery_options = ["home_delivery", "office_delivery", "pickup_point"]
→ LLM suggest best option: "Based on your history, you prefer quick pickup"
→ Ask confirmation: "Shall we deliver to your usual office?"
```

**Key Metrics:**
- contract_generation_time
- payment_confirmation_rate
- delivery_preference_accuracy (customers happy with suggestion?)

---

### **HÀNH CHÍNH #5: Invoice & Payment Collection**
**Trigger:** After delivery confirmed  
**Input:** {order_id, final_charges, payment_status, customer_contact}  
**Output:** {invoice_id, payment_tracking, reminder_schedule}

**AI Integration:**
```python
# 1. Smart Invoice Generation
invoice = {
    "order_items": [...],
    "base_charge": 500000,
    "surcharges": {...},
    "discounts": -50000,  # loyalty discount
    "tax": 50000,
    "total": 500000,
    "notes": LLM.generate_invoice_summary(order_context)
}

# 2. Intelligent Payment Reminders (behavioral)
if payment_status == "unpaid":
    days_overdue = (now - due_date).days
    if days_overdue == 1:
        LLM.generate_reminder("gentle")  # "Hi, just a reminder..."
    elif days_overdue == 3:
        LLM.generate_reminder("firm")   # "We haven't received payment yet..."
    elif days_overdue == 7:
        LLM.generate_reminder("urgent") # "This account is now overdue..."

# 3. Payment Prediction (ML)
payment_likelihood = predict_payment_willingness(customer_history, overdue_days, amount)
→ If likelihood < 0.5: suggest finance manager offer payment plan
```

**Key Metrics:**
- invoice_generation_accuracy
- on_time_payment_rate
- average_days_to_collect
- bad_debt_percentage

---

### **HÀNH CHÍNH #6: Daily KPI Report & Performance Analysis**
**Trigger:** Schedule 18:00 daily  
**Input:** {all_orders_today, events, incidents}  
**Output:** {kpi_report_html, executive_summary, recommendations}

**AI Integration:**
```python
# 1. KPI Aggregation
kpis = {
    "orders_received": 145,
    "orders_delivered": 142,
    "on_time_percentage": 94.4,
    "avg_delivery_time": 24.5,
    "failed_orders": 3,
    "average_quote_response_time": 3.2,  # minutes
    "quote_conversion_rate": 87.5,
    "ai_intervention_success_rate": 0.76,
    "revenue": 50_000_000,
    "cost_of_interventions": 2_500_000,
}

# 2. AI Insight Generation (Claude)
claude_prompt = f"""
Analyze today's logistics KPIs:
{json.dumps(kpis)}

Compared to 7-day average:
{json.dumps(kpis_7day_avg)}

Weather conditions: {weather_today}
Special events: {events_today}

Generate:
1. Key observations (3-5 bullets)
2. Anomalies detected (if any)
3. Root cause hypothesis
4. Recommendations for tomorrow
"""
insights = claude.generate(claude_prompt)

# 3. Visualization & Export
report_html = render_template(
    title="Daily Operations Report",
    kpis=kpis,
    insights=insights,
    charts={...}
)
→ Email to management, upload to dashboard
```

**Key Metrics:**
- report_generation_time
- insight_accuracy (manager agrees with recommendations?)
- actionability (% recommendations that improve KPI)

---

### **HÀNH CHÍNH #7: Exception Handling & Escalation Queue**
**Trigger:** Any workflow error or AI low-confidence  
**Input:** {exception_type, order_context, ai_recommendation}  
**Output:** {task_id, assigned_to, deadline, escalation_status}

**AI Integration:**
```python
# 1. Smart Queue Routing (rule + LLM)
exceptions_map = {
    "missing_address": {queue: "data_entry", priority: "medium", deadline_minutes: 60},
    "fraud_suspected": {queue: "compliance", priority: "critical", deadline_minutes: 15},
    "payment_issue": {queue: "finance", priority: "high", deadline_minutes: 120},
    "sla_at_risk": {queue: "operations", priority: "critical", deadline_minutes: 10},
}

# 2. Task Auto-Generation (LLM)
task_summary = LLM.generate_task_summary(
    exception_type=exception_type,
    order_context=order_context,
    ai_insight=ai_recommendation
)
→ Include: what went wrong, AI suggestion, recommended action, examples

# 3. Assignment & Escalation
assignee = smart_assign_by_skill_and_load(queue, task_priority)
→ Send notification + set escalation: if not resolved in 2x_deadline → notify_manager

# 4. Task Tracking & Cost
→ Log: assignee_id, resolution_time, decision_override_reason, cost_of_labor
→ KPI: % tasks resolved within deadline, cost per exception
```

**Key Metrics:**
- exception_rate (% of orders requiring manual review)
- resolution_time (target: <60 min for high-priority)
- resolution_rate (% of escalations that get resolved vs waiting)

---

### **HÀNH CHÍNH #8: Customer Feedback & Sentiment Analysis**
**Trigger:** After delivery completed  
**Input:** {customer_contact, nps_score, feedback_text, interaction_history}  
**Output:** {sentiment_label, issue_category, actionable_insight}

**AI Integration:**
```python
# 1. NPS Survey & Data Collection
nps_survey = {
    "question": "Bạn có giới thiệu VietExpress cho bạn bè không? (0-10)",
    "follow_up": "Vì sao bạn chọn điểm {score}?"
}
→ Collect via Zalo, SMS link, or portal

# 2. Sentiment Analysis & Issue Extraction (Claude)
feedback_text = "Hàng đến muộn 2 tiếng, driver không gọi trước. Tuy nhiên, giá rẻ."
sentiment = claude.analyze_sentiment(
    text=feedback_text,
    language="vi",
    return_structure={
        "overall_sentiment": "mixed",
        "positive_aspects": ["affordable pricing"],
        "negative_aspects": ["late delivery", "driver communication"],
        "issue_categories": ["sla_breach", "customer_service"],
        "urgency": "high"  # because SLA breach
    }
)

# 3. Actionable Insights & Auto-Response
if sentiment.urgency == "high":
    response = LLM.generate_apology_and_remedy(
        issue=sentiment.negative_aspects,
        customer_segment=customer.segment,
        order_value=order.value
    )
    → "Xin lỗi vì giao muộn. Chúng tôi muốn bù lại 10% cước phí cho đơn tiếp theo..."
    → Send auto-response + flag for manager review

# 4. CRM Update & Reporting
→ Update customer profile: last_feedback_sentiment, issues_trend
→ Aggregate: sentiment_trend_over_time, top_issues_this_week
```

**Key Metrics:**
- nps_score (target: > 40)
- sentiment_distribution (% positive, neutral, negative)
- issue_resolution_rate (% issues addressed proactively)
- customer_retention_rate (% detractors who remain customers)

---

## 4. Workflows SẢN XUẤT Chi Tiết

### **SẢN XUẤT #1: Pickup Dispatch & Route Optimization**
*[Chi tiết có trong Workflow #2 của tài liệu chính]*  
**Focus:** Vehicle assignment, route optimization, driver notification

---

### **SẢN XUẤT #2: Real-time Shipment Tracking & Status Updates**
*[Chi tiết có trong Workflow #3 của tài liệu chính]*  
**Focus:** Status update, anomaly detection, intelligent notifications

---

### **SẢN XUẤT #3: SLA Monitoring & Predictive Intervention**
*[Chi tiết có trong Workflow #4 của tài liệu chính]*  
**Focus:** Risk prediction, intervention recommendation, outcome tracking

---

### **SẢN XUẤT #4: Delivery Completion & Receipt**
*[Chi tiết có trong Workflow #5 của tài liệu chính]*  
**Focus:** Delivery confirmation, receipt generation, customer satisfaction

---

## 5. Process Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    HÀNH CHÍNH (ADMINISTRATIVE)              │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Order Intake        2. Quote Calc        3. Quote Send   │
│  (Normalize data)       (Price + AI)         (Multi-channel) │
│       ↓                      ↓                     ↓          │
│  [Risk Score]          [Surcharge AI]        [Sentiment AI]  │
│                                                               │
│              ↓──────────────────────────↑                     │
│                                          │                    │
│  4. Order Confirmation    ← Customer Response                 │
│  (Contract + Payment)                                         │
│       ↓                                                        │
│  [AI auto-fill contract]                                      │
│                                                               │
│                      ↓                                        │
├─────────────────────────────────────────────────────────────┤
│                    SẢN XUẤT (PRODUCTION)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  5. Pickup Dispatch  6. Real-time Tracking  7. SLA Monitor   │
│  (Route opt)         (Status updates)       (Risk assessment)│
│       ↓                     ↓                     ↓          │
│  [Route AI]          [Anomaly Detection]    [Intervention]   │
│  [ETA predict]       [Sentiment analysis]   [Suggestion AI]  │
│       ↓                     ↓                     ↓          │
│  Driver notified  ←──  Customer notified ←─ Manager alert    │
│                                                               │
│  8. Delivery Complete                                         │
│  (Receipt + feedback)                                         │
│       ↓                                                        │
│  [NPS collection]                                            │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                 HÀNH CHÍNH (BACK-OFFICE)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  9. Invoice & Payment    10. Daily KPI      11. Exceptions   │
│       ↓                       ↓                  ↓            │
│  [Smart reminders]       [Insight gen]      [Smart routing]  │
│                          [Trend analysis]   [Task assign]     │
│                                                               │
│  12. Customer Feedback & CRM Update                          │
│       ↓                                                        │
│  [Sentiment NLP]  [Issue extraction]  [CRM auto-update]      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Recommended Implementation Sequence

### **Phase 1: Foundation (Weeks 1-2)**
**HÀNH CHÍNH:**
- #1 Order Intake & Data Normalization
- #2 Quote Calculation

**SẢN XUẤT:**
- #5 Pickup Dispatch (without advanced optimization)

**Outcome:** End-to-end flow: order → quote → pickup

### **Phase 2: Core Operations (Weeks 3-4)**
**HÀNH CHÍNH:**
- #3 Quote Sending (multi-channel, no AI personalization yet)

**SẢN XUẤT:**
- #6 Real-time Tracking (basic notifications, no AI)

**Outcome:** Full operational pipeline with basic notifications

### **Phase 3: AI Integration (Weeks 5-6)**
**HÀNH CHÍNH:**
- #3 Quote Sending (+ AI message personalization)
- #4 Order Confirmation (+ AI contract generation)

**SẢN XUẤT:**
- #7 SLA Monitoring (+ AI risk prediction & intervention)
- #6 Real-time Tracking (+ AI anomaly detection, sentiment)

**Outcome:** Smart routing, intelligent notifications

### **Phase 4: Back-Office & Analytics (Weeks 7-8)**
**HÀNH CHÍNH:**
- #5 Invoice & Payment (+ AI smart reminders)
- #10 Daily KPI Report (+ AI insights)
- #8 Customer Feedback (+ NLP sentiment)
- #11 Exception Handling (+ smart queue routing)

**Outcome:** Full loop: automation → data → insights → improvement

---

## 7. Technology Stack (Refining)

```yaml
# Orchestration: n8n
# AI Models:
#   - Address parsing: Claude 3.5 Sonnet + vector DB (Pinecone)
#   - Risk scoring: LLM-guided + simple ML (if data available)
#   - Message generation: Claude 3.5 Sonnet (personalization)
#   - Sentiment analysis: Claude 3.5 Sonnet (NLP)
#   - KPI insights: Claude 3.5 Sonnet (analysis)
#   - Route optimization: Claude/GPT-4o heuristic OR Python OR Google Maps API
# Channels: Zalo OA, Twilio SMS, SendGrid Email
# Data: PostgreSQL (existing), Redis cache
# Logging: ELK or simple JSON logs → BigQuery/BI tool
# Monitoring: Datadog/New Relic OR custom dashboard
```

---

## 8. Key Success Metrics (Before/After Comparison)

| Category | Metric | Baseline (Manual) | Target (AI-Automated) | Measurement |
|----------|--------|------|------|---|
| **HÀNH CHÍNH** | Quote turnaround | 60 min | < 5 min | timestamp diff |
| | Manual review rate | 40% | < 15% | % orders requiring human touch |
| | Data quality issues | 15% | < 5% | NPS of data accuracy |
| | Invoice accuracy | 98% | > 99% | % invoices error-free |
| **SẢN XUẤT** | SLA on-time % | 85% | > 94% | delivery_time vs sla_deadline |
| | Pickup efficiency | 8 orders/vehicle/day | 15 orders/vehicle/day | orders_per_vehicle_per_day |
| | Customer satisfaction | 6.5/10 NPS | > 8/10 NPS | NPS survey |
| **AI QUALITY** | Address parsing accuracy | - | > 95% | % correct province/district |
| | Risk prediction precision | - | > 80% | % flagged orders that breach SLA |
| | Message open rate | 45% (template) | 65% (personalized) | % of Zalo/Email opened |
| **ROI** | Labor hours saved | - | 20-30 hours/day | manual_time_before vs after |
| | Intervention cost | - | 2-5M VND/month | sum(discounts + exceptions) |
| | Payback period | - | 4-6 months | investment / monthly_savings |

---

## 9. Deliverables for Thesis

### **Chapter: Thiết Kế (Design)**
1. Architecture diagram (4-layer: business app, orchestration, AI, monitoring)
2. Process flow diagrams (administrative vs production)
3. Data model (orders, shipments, events, audit_log)
4. Error handling & fallback scenarios

### **Chapter: Xây Dựng (Implementation)**
1. n8n workflow JSON (exportable, reproducible)
2. API specification (webhooks, request/response)
3. AI prompt engineering (address parsing, risk scoring, message gen)
4. Database schema + migrations

### **Chapter: Vận Hành (Operations)**
1. Deployment checklist
2. Monitoring dashboard (KPI, workflow health)
3. Incident response playbook
4. User training materials

### **Chapter: Đánh Giá (Evaluation)**
1. Before/After KPI comparison (metrics table)
2. AI model performance (accuracy, precision, recall)
3. Cost-benefit analysis (ROI, payback period)
4. Customer feedback & sentiment analysis
5. Lessons learned & future improvements

---

**End of Document**

*Bản map này giúp bạn phân rõ 8 workflows HÀNH CHÍNH (từ tiếp nhận → tính giá → gửi → hóa đơn) và 4 workflows SẢN XUẤT (lấy hàng → vận chuyển → giao → hoàn tất). Đồng thời cung cấp sequencing thực hiện theo 4 phase.*
