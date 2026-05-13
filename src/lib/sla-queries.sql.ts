/**
 * SLA Monitoring - Supabase SQL Queries
 * Raw SQL queries để reference khi optimize hoặc debug
 */

/**
 * Query 1: Lấy tất cả at-risk orders (cơ bản)
 * Điều kiện:
 * - Status in (picked_up, in_transit, delivering)
 * - estimatedDelivery tồn tại
 * - estimatedDelivery + (maxHours + 24h) chưa qua
 * - estimatedDelivery + (maxHours + 24h) - 120 phút <= now <= deadline
 */
export const QUERY_AT_RISK_ORDERS = `
SELECT
  o.id,
  o.order_code,
  o.user_id,
  o.origin,
  o.destination,
  o.service_type,
  o.status,
  o.current_location,
  o.weight_kg,
  o.total_amount,
  o.estimated_delivery,
  o.created_at,
  o.updated_at,
  
  -- SLA Calculation (cần từng service type + route)
  CASE
    WHEN o.service_type = 'ftl' THEN 48  -- FTL max 48 giờ
    WHEN o.service_type = 'ltl' THEN 72  -- LTL max 72 giờ
    ELSE 60                               -- Default 60 giờ
  END as max_sla_hours,
  
  o.estimated_delivery + INTERVAL '1 day' + 
    (CASE
      WHEN o.service_type = 'ftl' THEN INTERVAL '48 hours'
      WHEN o.service_type = 'ltl' THEN INTERVAL '72 hours'
      ELSE INTERVAL '60 hours'
    END) as deadline,
  
  -- Time to deadline in minutes
  EXTRACT(EPOCH FROM (
    o.estimated_delivery + INTERVAL '1 day' + 
    (CASE
      WHEN o.service_type = 'ftl' THEN INTERVAL '48 hours'
      WHEN o.service_type = 'ltl' THEN INTERVAL '72 hours'
      ELSE INTERVAL '60 hours'
    END) - NOW()
  )) / 60 as time_to_deadline_minutes,
  
  -- Is breached?
  NOW() > (o.estimated_delivery + INTERVAL '1 day' + 
    (CASE
      WHEN o.service_type = 'ftl' THEN INTERVAL '48 hours'
      WHEN o.service_type = 'ltl' THEN INTERVAL '72 hours'
      ELSE INTERVAL '60 hours'
    END)) as is_breached,
  
  -- Recent alert info
  (SELECT MAX(detected_at) FROM sla_alerts 
   WHERE order_id = o.id AND status = 'open') as last_alert_at,
  
  -- Last tracking
  (SELECT location FROM tracking_events 
   WHERE order_id = o.id 
   ORDER BY event_time DESC LIMIT 1) as last_tracking_location

FROM orders o
WHERE
  o.status IN ('picked_up', 'in_transit', 'delivering')
  AND o.estimated_delivery IS NOT NULL
  AND NOW() <= (o.estimated_delivery + INTERVAL '1 day' + 
    (CASE
      WHEN o.service_type = 'ftl' THEN INTERVAL '48 hours'
      WHEN o.service_type = 'ltl' THEN INTERVAL '72 hours'
      ELSE INTERVAL '60 hours'
    END))
  AND (o.estimated_delivery + INTERVAL '1 day' + 
    (CASE
      WHEN o.service_type = 'ftl' THEN INTERVAL '48 hours'
      WHEN o.service_type = 'ltl' THEN INTERVAL '72 hours'
      ELSE INTERVAL '60 hours'
    END) - NOW()) <= INTERVAL '120 minutes'

ORDER BY time_to_deadline_minutes ASC
LIMIT 50;
`

/**
 * Query 2: Kiểm tra can thiệp gần đây
 */
export const QUERY_RECENT_INTERVENTION = (
  orderId: string,
  minutesThreshold: number = 30,
) => `
SELECT * FROM sla_alerts
WHERE
  order_id = '${orderId}'
  AND status = 'open'
  AND detected_at >= NOW() - INTERVAL '${minutesThreshold} minutes'
ORDER BY detected_at DESC
LIMIT 1;
`

/**
 * Query 3: Tạo SLA Alert
 */
export const QUERY_CREATE_SLA_ALERT = (
  orderId: string,
  type: 'alert' | 'warning' | 'info',
  severity: 'high' | 'medium' | 'low',
  message: string,
  metadata: object,
) => `
INSERT INTO sla_alerts (order_id, type, status, severity, message, metadata, detected_at, created_at, updated_at)
VALUES (
  '${orderId}',
  '${type}',
  'open',
  '${severity}',
  '${message.replace(/'/g, "''") /* Escape quotes */}',
  '${JSON.stringify(metadata).replace(/'/g, "''")}',
  NOW(),
  NOW(),
  NOW()
)
RETURNING *;
`

/**
 * Query 4: Log Action
 */
export const QUERY_LOG_ACTION = (
  actionType: string,
  entityId: string,
  metadata: object,
) => `
INSERT INTO action_logs (action_type, entity_type, entity_id, metadata, mode, created_at)
VALUES (
  '${actionType}',
  'Order',
  '${entityId}',
  '${JSON.stringify(metadata).replace(/'/g, "''")}',
  'automated',
  NOW()
)
RETURNING *;
`

/**
 * Query 5: Phân nhóm orders theo risk level
 */
export const QUERY_GROUP_BY_RISK = `
SELECT
  o.id,
  o.order_code,
  o.origin,
  o.destination,
  o.service_type,
  o.estimated_delivery,
  o.created_at,
  o.updated_at,
  CASE
    WHEN NOW() > (o.estimated_delivery + INTERVAL '1 day' + 
      (CASE WHEN o.service_type = 'ftl' THEN INTERVAL '48 hours'
            WHEN o.service_type = 'ltl' THEN INTERVAL '72 hours'
            ELSE INTERVAL '60 hours' END)) 
    THEN 'CRITICAL'
    WHEN (o.estimated_delivery + INTERVAL '1 day' + 
      (CASE WHEN o.service_type = 'ftl' THEN INTERVAL '48 hours'
            WHEN o.service_type = 'ltl' THEN INTERVAL '72 hours'
            ELSE INTERVAL '60 hours' END) - NOW()) < INTERVAL '30 minutes'
    THEN 'CRITICAL'
    WHEN (o.estimated_delivery + INTERVAL '1 day' + 
      (CASE WHEN o.service_type = 'ftl' THEN INTERVAL '48 hours'
            WHEN o.service_type = 'ltl' THEN INTERVAL '72 hours'
            ELSE INTERVAL '60 hours' END) - NOW()) < INTERVAL '120 minutes'
    THEN 'HIGH'
    WHEN (o.estimated_delivery + INTERVAL '1 day' + 
      (CASE WHEN o.service_type = 'ftl' THEN INTERVAL '48 hours'
            WHEN o.service_type = 'ltl' THEN INTERVAL '72 hours'
            ELSE INTERVAL '60 hours' END) - NOW()) < INTERVAL '240 minutes'
    THEN 'MEDIUM'
    ELSE 'LOW'
  END as risk_level
FROM orders o
WHERE
  o.status IN ('picked_up', 'in_transit', 'delivering')
  AND o.estimated_delivery IS NOT NULL
ORDER BY risk_level DESC, o.estimated_delivery ASC;
`

/**
 * Query 6: Tạo index để optimize queries
 */
export const CREATE_INDEXES = [
  // Index cho lấy at-risk orders
  `CREATE INDEX IF NOT EXISTS idx_orders_status_estimated_delivery
   ON orders(status, estimated_delivery)
   WHERE status IN ('picked_up', 'in_transit', 'delivering');`,

  // Index cho SLA alerts lookup
  `CREATE INDEX IF NOT EXISTS idx_sla_alerts_order_status
   ON sla_alerts(order_id, status, detected_at DESC);`,

  // Index cho action logs
  `CREATE INDEX IF NOT EXISTS idx_action_logs_entity
   ON action_logs(entity_type, entity_id, created_at DESC);`,

  // Index cho tracking events
  `CREATE INDEX IF NOT EXISTS idx_tracking_events_order_time
   ON tracking_events(order_id, event_time DESC);`,
]

/**
 * Query 7: Dashboard - Tổng hợp SLA metrics
 */
export const QUERY_SLA_DASHBOARD = `
SELECT
  DATE(o.created_at) as date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN o.status = 'delivering' THEN 1 ELSE 0 END) as delivering,
  SUM(CASE WHEN o.status IN ('picked_up', 'in_transit') THEN 1 ELSE 0 END) as in_progress,
  COUNT(DISTINCT sa.order_id) as orders_with_alerts,
  SUM(CASE WHEN sa.severity = 'high' THEN 1 ELSE 0 END) as high_severity_count,
  SUM(CASE WHEN sa.severity = 'medium' THEN 1 ELSE 0 END) as medium_severity_count,
  AVG(CASE 
    WHEN NOW() <= (o.estimated_delivery + INTERVAL '1 day' + INTERVAL '48 hours')
    THEN EXTRACT(EPOCH FROM (o.estimated_delivery - o.created_at)) / 3600
    ELSE NULL 
  END) as avg_sla_hours

FROM orders o
LEFT JOIN sla_alerts sa ON o.id = sa.order_id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(o.created_at)
ORDER BY date DESC;
`

/**
 * Connection setup notes:
 *
 * Environment variables cần trong .env.local:
 * DATABASE_URL=postgresql://...supabase...
 * DIRECT_URL=postgresql://...supabase...(nếu dùng prisma migrate/seed)
 *
 * Chạy migrations:
 * npx prisma migrate deploy
 *
 * Seed SLA config (tuỳ chọn):
 * Thêm vào prisma/seed.js
 *
 * Example API call:
 * POST /api/sla-monitoring/workflow
 * {
 *   "bufferMinutes": 120,
 *   "autoExecute": false
 * }
 */
