const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting seeding mock data for interventions...");

  // 1. Fetch some mock orders that start with 'VEX-MOCK-'
  const mockOrders = await prisma.order.findMany({
    where: {
      orderCode: { startsWith: 'VEX-MOCK-' }
    },
    take: 5,
    orderBy: { createdAt: 'desc' }
  });

  if (mockOrders.length === 0) {
    // If no mock orders found, try to fetch any orders in the system
    console.log("⚠️ No VEX-MOCK- orders found, fetching any available orders...");
    const anyOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' }
    });
    
    if (anyOrders.length === 0) {
      console.error("❌ No orders found in the database. Please run npm run prisma:seed first to generate orders!");
      return;
    }
    mockOrders.push(...anyOrders);
  }

  console.log(`📋 Found ${mockOrders.length} orders to associate with mockup interventions.`);

  // 2. Clear existing records in 'interventions' table to have a fresh state
  const deleteResult = await prisma.intervention.deleteMany({});
  console.log(`🧹 Cleared ${deleteResult.count} existing records from 'interventions' table.`);

  // 3. Define mockup interventions
  const now = new Date();
  const mockData = [];

  // Order 1: Has a VERY RECENT intervention (15 minutes ago)
  // This will trigger 'Has Recent Intervention? = False' in n8n (stops execution to prevent spam)
  mockData.push({
    orderId: mockOrders[0].id,
    actionType: 'CALL_CUSTOMER',
    reason: 'Đơn hàng Express bị quá hạn do thời tiết xấu tại Hải Phòng. AI đề xuất liên hệ gửi email xin lỗi khách hàng và tặng coupon giảm giá.',
    status: 'CUSTOMER_EMAILED',
    notifiedAt: new Date(now.getTime() - 15 * 60 * 1000) // 15 mins ago
  });

  // Order 2: Has an OLD intervention (45 minutes ago)
  // This is outside the 30-minute window, so n8n will proceed to run the AI agent and notify again if needed
  if (mockOrders[1]) {
    mockData.push({
      orderId: mockOrders[1].id,
      actionType: 'CALL_CARRIER',
      reason: 'Xe tải biển số 29C-456.78 bị hỏng xốp cách nhiệt tại Bắc Ninh. AI đề xuất liên hệ điều phối viên để điều động phương tiện thay thế khẩn cấp.',
      status: 'CARRIER_OPS_NOTIFIED',
      notifiedAt: new Date(now.getTime() - 45 * 60 * 1000) // 45 mins ago
    });
  }

  // Order 3: Has a mixture of old interventions
  if (mockOrders[2]) {
    mockData.push(
      {
        orderId: mockOrders[2].id,
        actionType: 'CALL_CUSTOMER',
        reason: 'Sai lệch địa chỉ nhận hàng tại Quận 1, TP.HCM. Đã gửi email cập nhật biểu mẫu sửa đổi địa chỉ.',
        status: 'CUSTOMER_EMAILED',
        notifiedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000) // 3 hours ago
      },
      {
        orderId: mockOrders[2].id,
        actionType: 'CALL_CARRIER',
        reason: 'Đơn hàng LTL chưa được bốc xếp tại kho tổng Sài Gòn sau 6 giờ chờ đợi. Đã cảnh báo bộ phận kho bãi thúc giục xếp dỡ hàng.',
        status: 'CARRIER_OPS_NOTIFIED',
        notifiedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    );
  }

  // Order 4: Multiple historical notifications to simulate tracking history
  if (mockOrders[3]) {
    mockData.push({
      orderId: mockOrders[3].id,
      actionType: 'CALL_CUSTOMER',
      reason: 'Điều chỉnh thời gian giao hàng do đối tác vận chuyển thứ ba chuyển tuyến chậm. Đã thông báo người dùng.',
      status: 'CUSTOMER_EMAILED',
      notifiedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000) // 1 day ago
    });
  }

  // 4. Insert into database
  for (const item of mockData) {
    const created = await prisma.intervention.create({
      data: item
    });
    console.log(`✅ Seeded Intervention:
      ID: ${created.id}
      Order ID: ${created.orderId}
      Action: ${created.actionType}
      Status: ${created.status}
      Notified At: ${created.notifiedAt.toISOString()}
    `);
  }

  console.log("🎉 Seeding mock interventions completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding interventions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
