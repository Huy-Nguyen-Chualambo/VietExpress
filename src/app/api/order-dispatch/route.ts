import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTransitWindow, classifyRoute } from '@/lib/sla'
import { safeCreateActionLog } from '@/lib/action-log'

// Standard region checker from sla.ts
function normalizeProvince(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .normalize('NFC')
}

const regionNorth = new Set([
  'hà nội', 'hanoi', 'hải phòng', 'hai phong', 'quảng ninh', 'quang ninh',
  'bắc ninh', 'bac ninh', 'hưng yên', 'hung yen', 'hải dương', 'hai duong',
  'thái bình', 'thai binh', 'nam định', 'nam dinh', 'ninh bình', 'ninh binh',
  'hà nam', 'ha nam', 'hòa bình', 'hoa binh', 'sơn la', 'son la', 'điện biên',
  'dien bien', 'lào cai', 'lao cai', 'yên bái', 'yen bai', 'tuyên quang',
  'tuyen quang', 'phú thọ', 'phu tho', 'vĩnh phúc', 'vinh phuc', 'bắc giang',
  'bac giang', 'lạng sơn', 'lang son', 'cao bằng', 'cao bang', 'bắc kạn',
  'bac kan', 'thái nguyên', 'thai nguyen', 'hà tĩnh', 'ha tinh'
])

const regionCentral = new Set([
  'quảng bình', 'quang binh', 'quảng trị', 'quang tri', 'thừa thiên huế',
  'thua thien hue', 'huế', 'hue', 'đà nẵng', 'da nang', 'quảng nam',
  'quang nam', 'quảng ngãi', 'quang ngai', 'bình định', 'binh dinh',
  'phú yên', 'phu yen', 'khánh hòa', 'khanh hoa', 'ninh thuận', 'ninh thuan',
  'bình thuận', 'binh thuan'
])

function getRegion(province: string) {
  const normalized = normalizeProvince(province)
  if (regionNorth.has(normalized)) return 'Bắc'
  if (regionCentral.has(normalized)) return 'Trung'
  return 'Nam'
}

/**
 * POST /api/order-dispatch
 * Dispatches an order using rule-based + simulated AI orchestration
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'employee') {
      return NextResponse.json({ error: 'Unauthorized. Staff role required.' }, { status: 401 })
    }

    const { orderId } = await req.json()
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Retrieve order with client details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          include: { profile: true }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Order is already dispatched or processed' }, { status: 400 })
    }

    const stepsLog: Array<{
      step: string
      title: string
      status: 'success' | 'failed'
      details: string
      data?: any
    }> = []

    // ------------------------------------------------------------------------
    // STEP 1: Order Intake & Validation
    // ------------------------------------------------------------------------
    const missingFields: string[] = []
    if (!order.origin) missingFields.push('origin')
    if (!order.destination) missingFields.push('destination')
    if (order.weightKg === null || order.weightKg === undefined) missingFields.push('weightKg')
    if (!order.serviceType) missingFields.push('serviceType')

    if (missingFields.length > 0) {
      const errorMsg = `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`
      stepsLog.push({
        step: 'intake',
        title: 'Nhận Đơn hàng & Validate',
        status: 'failed',
        details: errorMsg
      })
      return NextResponse.json({
        success: false,
        error: errorMsg,
        steps: stepsLog
      }, { status: 400 })
    }

    stepsLog.push({
      step: 'intake',
      title: 'Nhận Đơn hàng & Validate',
      status: 'success',
      details: `Đơn hàng ${order.orderCode} hợp lệ. Trọng lượng: ${order.weightKg} kg, Dịch vụ: ${order.serviceType.toUpperCase()}`
    })

    // ------------------------------------------------------------------------
    // STEP 2: Classification (Rule-based)
    // ------------------------------------------------------------------------
    let cargoType = 'standard'
    let handlingRequirements = 'Xếp dỡ tiêu chuẩn, bảo quản khô ráo.'

    // Classify based on serviceType first, then scan address and name (placeholder for notes/notes check)
    const lowerService = order.serviceType.toLowerCase()
    
    if (lowerService === 'cold') {
      cargoType = 'cold'
      handlingRequirements = 'Yêu cầu bảo quản lạnh liên tục từ 2-8°C. Không ngắt xích lạnh.'
    } else {
      // Look at the order fields for potential fragile/hazardous notes
      const notes = `${order.origin} ${order.destination}`.toLowerCase()
      if (/fragile|dễ vỡ|thuỷ tinh|gốm/i.test(notes)) {
        cargoType = 'fragile'
        handlingRequirements = 'Hàng dễ vỡ. Xếp ở tầng trên cùng, cố định chống va đập.'
      } else if (/danger|hazard|nguy hiểm|hóa chất|pin/i.test(notes)) {
        cargoType = 'hazard'
        handlingRequirements = 'Chứa chất dễ cháy nổ/hóa chất. Vận chuyển riêng biệt, tránh nguồn nhiệt.'
      } else if (order.totalAmount && order.totalAmount > 5000000) {
        cargoType = 'cod'
        handlingRequirements = 'Hàng giá trị cao (COD). Cần ký nhận biên bản bàn giao kèm đối chiếu CMTND.'
      }
    }

    stepsLog.push({
      step: 'classification',
      title: 'Phân loại hàng hóa (Cargo Classification)',
      status: 'success',
      details: `Đã phân loại thành hàng: ${cargoType.toUpperCase()}. Yêu cầu xử lý: ${handlingRequirements}`,
      data: { cargoType, handlingRequirements }
    })

    // ------------------------------------------------------------------------
    // STEP 3: Vehicle Selection
    // ------------------------------------------------------------------------
    let vehicleType = 'motorbike'
    let capacityFit = 'Tải trọng xe máy (< 20 kg)'
    const weight = order.weightKg ?? 0

    if (cargoType === 'cold') {
      vehicleType = 'refrigerated_truck'
      capacityFit = 'Xe tải đông lạnh chuyên dụng'
    } else {
      if (weight > 200) {
        vehicleType = 'truck'
        capacityFit = 'Xe tải trung/lớn tải trọng lớn (> 200 kg)'
      } else if (weight > 20) {
        vehicleType = 'van'
        capacityFit = 'Xe tải Van bán tải trung chuyển (20 - 200 kg)'
      } else {
        vehicleType = 'motorbike'
        capacityFit = 'Xe máy gom hàng nhanh (< 20 kg)'
      }
    }

    stepsLog.push({
      step: 'vehicle',
      title: 'Lựa chọn phương tiện (Vehicle Matching)',
      status: 'success',
      details: `Phù hợp phương tiện: ${vehicleType.toUpperCase()} (${capacityFit})`,
      data: { vehicleType, capacityFit }
    })

    // ------------------------------------------------------------------------
    // STEP 4: Staff Assignment (Heuristic Scoring)
    // ------------------------------------------------------------------------
    // Region of the order origin
    const originRegion = getRegion(order.origin)
    
    // Core driver pool (dynamic mock matching)
    const drivers = [
      { id: 'DRV-001', name: 'Nguyễn Văn Bắc', region: 'Bắc', workload: 2, rating: 4.8 },
      { id: 'DRV-002', name: 'Trần Minh Nam', region: 'Nam', workload: 1, rating: 4.9 },
      { id: 'DRV-003', name: 'Lê Hoàng Trung', region: 'Trung', workload: 4, rating: 4.5 },
      { id: 'DRV-004', name: 'Phạm Thu Bắc', region: 'Bắc', workload: 5, rating: 4.7 },
      { id: 'DRV-005', name: 'Đỗ Văn Nam', region: 'Nam', workload: 0, rating: 4.6 }
    ]

    // Score: availability_score (10 - workload*2) + region_match (10 if same region, 0 otherwise) + rating*2
    const scoredDrivers = drivers.map(drv => {
      const regionMatch = drv.region === originRegion ? 10 : 0
      const workloadScore = Math.max(0, 10 - drv.workload * 2)
      const ratingScore = drv.rating * 2
      const totalScore = regionMatch + workloadScore + ratingScore
      
      return {
        ...drv,
        scoreBreakdown: { regionMatch, workloadScore, ratingScore },
        totalScore: Math.round(totalScore * 10) / 10
      }
    })

    // Sort by score descending
    scoredDrivers.sort((a, b) => b.totalScore - a.totalScore)
    const selectedDriver = scoredDrivers[0]

    stepsLog.push({
      step: 'staff',
      title: 'Chỉ định nhân sự (Staff Assignment)',
      status: 'success',
      details: `Đã chỉ định tài xế: ${selectedDriver.name} (${selectedDriver.region}) với điểm năng lực điều phối cao nhất: ${selectedDriver.totalScore}/25`,
      data: {
        assignedDriver: selectedDriver,
        candidates: scoredDrivers
      }
    })

    // ------------------------------------------------------------------------
    // STEP 5: Route Optimization
    // ------------------------------------------------------------------------
    const routeBand = classifyRoute(order.origin, order.destination)
    const transitDetails = getTransitWindow(order.serviceType, order.origin, order.destination)
    
    // Heuristic distance/duration calculations
    let distanceKm = 15
    if (routeBand === 'noi_vung') distanceKm = 95
    else if (routeBand === 'lien_vung') distanceKm = 350
    else if (routeBand === 'lien_tinh') distanceKm = 980

    const averageSpeedKmh = vehicleType === 'motorbike' ? 40 : 60
    const drivingTimeHours = Math.round((distanceKm / averageSpeedKmh) * 10) / 10
    const etaHours = transitDetails.standardHours

    const optimizedRoute = {
      path: `${order.origin} ➔ Kho trung chuyển ➔ ${order.destination}`,
      distanceKm,
      drivingTimeHours,
      etaHours,
      routeBand: routeBand.toUpperCase()
    }

    stepsLog.push({
      step: 'route',
      title: 'Tối ưu hóa tuyến đường (Route Optimization)',
      status: 'success',
      details: `Tuyến đường: ${optimizedRoute.path}. Cự ly: ${distanceKm} km. Phân tuyến: ${optimizedRoute.routeBand}. Thời gian dự kiến (ETA): ${etaHours} giờ.`,
      data: optimizedRoute
    })

    // ------------------------------------------------------------------------
    // STEP 6: Dispatch & Log Execution
    // ------------------------------------------------------------------------
    const dispatchDetails = `Đơn hàng đã được điều phối tự động sang trạng thái Đang lấy hàng. Phương tiện: ${vehicleType.toUpperCase()}. Nhân sự: ${selectedDriver.name}. ETA: ${etaHours}h.`

    // Update order status to 'picked_up' in database, set estimated delivery
    const baseDate = new Date()
    const estimatedDelivery = new Date(baseDate.getTime() + etaHours * 60 * 60 * 1000)

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'picked_up',
          currentLocation: order.origin,
          estimatedDelivery
        }
      }),
      prisma.trackingEvent.create({
        data: {
          orderId: order.id,
          status: 'picked_up',
          location: order.origin,
          description: dispatchDetails
        }
      }),
      prisma.notification.create({
        data: {
          userId: order.userId,
          type: 'info',
          title: `Đơn hàng ${order.orderCode} đã sẵn sàng vận chuyển`,
          message: `Đơn hàng của bạn đã được sắp xếp vận chuyển bằng xe ${vehicleType} cùng tài xế ${selectedDriver.name}. Dự kiến giao hàng: ${estimatedDelivery.toLocaleDateString('vi-VN')}.`
        }
      })
    ])

    // Log the automated action
    await safeCreateActionLog({
      actor: { connect: { id: session.user.id } },
      mode: 'automation',
      actionType: 'AUTOMATED_ORDER_DISPATCH',
      entityType: 'order',
      entityId: order.id,
      metadata: {
        orderCode: order.orderCode,
        cargoType,
        handlingRequirements,
        vehicleType,
        capacityFit,
        assignedDriver: selectedDriver.name,
        driverId: selectedDriver.id,
        routePlan: optimizedRoute,
        executedAt: new Date().toISOString()
      }
    })

    stepsLog.push({
      step: 'dispatch',
      title: 'Điều phối & Lưu lịch sử (Dispatch & Log)',
      status: 'success',
      details: 'Đã cập nhật trạng thái đơn hàng trên hệ thống, thêm lịch sử Tracking, gửi thông báo khách hàng và ghi nhận nhật ký điều phối tự động (Automation Mode).'
    })

    return NextResponse.json({
      success: true,
      orderCode: order.orderCode,
      dispatchedDriver: selectedDriver.name,
      dispatchedVehicle: vehicleType,
      route: optimizedRoute,
      steps: stepsLog
    })

  } catch (error) {
    console.error('[Order Dispatch API Error]', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}
