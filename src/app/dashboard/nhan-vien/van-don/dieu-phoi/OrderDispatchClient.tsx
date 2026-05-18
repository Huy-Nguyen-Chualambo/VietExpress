'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  MapPin,
  Truck,
  User,
  Route,
  Activity,
  CheckCircle2,
  ChevronRight,
  Play,
  Cpu,
  RefreshCw,
  AlertCircle,
  Clock,
  Coins,
  ShieldCheck,
  Zap
} from 'lucide-react'
import { formatCurrencyVnd } from '@/lib/customer-portal'

type PendingOrder = {
  id: string
  orderCode: string
  origin: string
  destination: string
  serviceType: string
  status: string
  weightKg: number | null
  totalAmount: number | null
  createdAt: Date
  user: {
    name: string | null
    profile: {
      fullName: string | null
      company: string | null
    } | null
  }
}

type DispatchStep = {
  id: 'intake' | 'classification' | 'vehicle' | 'staff' | 'route' | 'dispatch'
  title: string
  desc: string
  status: 'idle' | 'running' | 'success' | 'failed'
  result?: string
  data?: any
}

export default function OrderDispatchClient({ initialOrders }: { initialOrders: PendingOrder[] }) {
  const router = useRouter()
  const [orders, setOrders] = useState<PendingOrder[]>(initialOrders)
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null)
  
  // Dispatch state
  const [isDispatching, setIsDispatching] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [steps, setSteps] = useState<DispatchStep[]>([
    { id: 'intake', title: '1. Order Intake & Verification', desc: 'Kiểm tra & xác minh tính toàn vẹn dữ liệu đơn hàng.', status: 'idle' },
    { id: 'classification', title: '2. Cargo Classification', desc: 'Phân nhóm hàng hóa (Thường, Dễ vỡ, Hàng lạnh, Độc hại) bằng AI.', status: 'idle' },
    { id: 'vehicle', title: '3. Vehicle Matching', desc: 'Phối bộ phương tiện tối ưu theo trọng tải & yêu cầu lưu kho.', status: 'idle' },
    { id: 'staff', title: '4. Dynamic Staff Assignment', desc: 'Chỉ định nhân viên giao nhận theo điểm khu vực, workload & rating.', status: 'idle' },
    { id: 'route', title: '5. Route & ETA Optimization', desc: 'Tính toán phân lộ trình và dự báo thời gian giao nhận tối ưu.', status: 'idle' },
    { id: 'dispatch', title: '6. Dispatch & Logging', desc: 'Cập nhật hệ thống, kích hoạt SMS/Zalo và ghi chép audit trail.', status: 'idle' }
  ])
  
  const [dispatchResult, setDispatchResult] = useState<{
    dispatchedDriver: string
    dispatchedVehicle: string
    route: {
      path: string
      distanceKm: number
      drivingTimeHours: number
      etaHours: number
      routeBand: string
    }
  } | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Fleet monitor stats
  const fleet = [
    { type: 'Xe máy', count: 14, active: 8, color: 'bg-brand text-white border-brand' },
    { type: 'Xe Van bán tải', count: 6, active: 4, color: 'bg-blue-600 text-white border-blue-600' },
    { type: 'Xe tải trung', count: 8, active: 3, color: 'bg-indigo-600 text-white border-indigo-600' },
    { type: 'Xe đông lạnh', count: 4, active: 1, color: 'bg-cyan-600 text-white border-cyan-600' }
  ]

  const handleSelectOrder = (order: PendingOrder) => {
    if (isDispatching) return
    setSelectedOrder(order)
    setDispatchResult(null)
    setErrorMessage(null)
    setCurrentStepIndex(-1)
    setSteps(prev => prev.map(s => ({ ...s, status: 'idle', result: undefined, data: undefined })))
  }

  // Simulate and execute the actual API
  const handleStartDispatch = async () => {
    if (!selectedOrder || isDispatching) return
    
    setIsDispatching(true)
    setErrorMessage(null)
    setDispatchResult(null)
    
    // Set first step running
    let currentIdx = 0
    setCurrentStepIndex(0)
    updateStepStatus('intake', 'running')

    try {
      // Start the workflow simulation with steps
      const delay = (ms: number) => new Promise(res => setTimeout(res, ms))
      
      // Step 1: Intake simulation
      await delay(700)
      updateStepStatus('intake', 'success', `Đơn hàng ${selectedOrder.orderCode} hợp lệ.`)

      // Step 2: Classification simulation
      currentIdx = 1
      setCurrentStepIndex(1)
      updateStepStatus('classification', 'running')
      await delay(900)

      // Make API Call in parallel to get the actual results
      const res = await fetch('/api/order-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: selectedOrder.id })
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Có lỗi xảy ra trong quá trình điều phối')
      }

      // Extract results from API
      const stepsResponse = data.steps as any[]
      
      // Step 2 success
      const step2Info = stepsResponse.find(s => s.step === 'classification')
      updateStepStatus('classification', 'success', step2Info?.details, step2Info?.data)

      // Step 3: Vehicle selection
      currentIdx = 2
      setCurrentStepIndex(2)
      updateStepStatus('vehicle', 'running')
      await delay(800)
      const step3Info = stepsResponse.find(s => s.step === 'vehicle')
      updateStepStatus('vehicle', 'success', step3Info?.details, step3Info?.data)

      // Step 4: Staff assignment
      currentIdx = 3
      setCurrentStepIndex(3)
      updateStepStatus('staff', 'running')
      await delay(900)
      const step4Info = stepsResponse.find(s => s.step === 'staff')
      updateStepStatus('staff', 'success', step4Info?.details, step4Info?.data)

      // Step 5: Route optimization
      currentIdx = 4
      setCurrentStepIndex(4)
      updateStepStatus('route', 'running')
      await delay(800)
      const step5Info = stepsResponse.find(s => s.step === 'route')
      updateStepStatus('route', 'success', step5Info?.details, step5Info?.data)

      // Step 6: Dispatch
      currentIdx = 5
      setCurrentStepIndex(5)
      updateStepStatus('dispatch', 'running')
      await delay(700)
      const step6Info = stepsResponse.find(s => s.step === 'dispatch')
      updateStepStatus('dispatch', 'success', step6Info?.details)

      // Complete
      setDispatchResult({
        dispatchedDriver: data.dispatchedDriver,
        dispatchedVehicle: data.dispatchedVehicle,
        route: data.route
      })

      // Update local orders list by removing the dispatched one
      setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
      setSelectedOrder(null)
      setIsDispatching(false)
      
      // Trigger Next.js revalidation
      router.refresh()

    } catch (err: any) {
      console.error(err)
      setIsDispatching(false)
      setErrorMessage(err.message || 'Lỗi xử lý luồng vận hành.')
      
      // Mark current running step as failed, and others idle
      setSteps(prev => prev.map((s, idx) => {
        if (idx === currentIdx) return { ...s, status: 'failed', result: err.message }
        if (idx > currentIdx) return { ...s, status: 'idle' }
        return s
      }))
    }
  }

  const updateStepStatus = (id: string, status: 'idle' | 'running' | 'success' | 'failed', result?: string, data?: any) => {
    setSteps(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status, result, data }
      }
      return s
    }))
  }

  return (
    <div className="space-y-6">
      {/* Dynamic Header */}
      <section className="bg-[hsl(215,25%,12%)] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-brand opacity-15 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-brand animate-pulse" />
            <span className="text-xs text-white/60 uppercase tracking-widest font-semibold">
              Hệ thống Điều phối & Gom hàng tự động (Automation Mode)
            </span>
          </div>
          <h1 className="text-2xl font-bold font-display">Intelligent Dispatch Console</h1>
          <p className="text-white/60 text-sm mt-1 max-w-2xl">
            Vận hành quy trình tự động hóa gom hàng, phân loại hàng hóa bằng AI, điều phối phương tiện và chỉ định nhân viên lấy hàng dựa trên cự ly và tải trọng.
          </p>
        </div>
      </section>

      {/* Fleet & Workload Monitor */}
      <section className="bg-white rounded-2xl border border-border/50 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-brand" />
          <h3 className="text-sm font-semibold font-display">Giám sát Đội xe & Phân tải</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fleet.map((v) => (
            <div key={v.type} className="border border-border/70 rounded-xl p-4 bg-muted/20">
              <div className="text-xs text-muted-foreground mb-1">{v.type}</div>
              <div className="flex items-end justify-between">
                <span className="text-xl font-bold font-display text-slate-800">{v.count} xe</span>
                <span className="text-xs text-green-600 font-medium">Sẵn sàng: {v.count - v.active}</span>
              </div>
              <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-brand h-full rounded-full" 
                  style={{ width: `${(v.active / v.count) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Split Screen */}
      <div className="grid lg:grid-cols-5 gap-6 items-start">
        {/* Left Side: Pending Orders List */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-border/50 overflow-hidden flex flex-col h-[620px]">
          <div className="px-6 py-4 border-b border-border bg-slate-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold font-display text-slate-800">Đơn hàng Chờ điều phối</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Quét thời gian thực các đơn hàng chưa chia ca</p>
            </div>
            <span className="bg-brand-soft border border-brand/20 text-brand text-xs font-semibold px-2.5 py-1 rounded-full">
              {orders.length} đơn hàng
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-border/60">
            {orders.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center h-full">
                <Package className="w-10 h-10 text-slate-300 mb-3" />
                Không còn đơn hàng nào chờ xử lý. Tất cả đã được điều phối!
              </div>
            ) : (
              orders.map((order) => {
                const isSelected = selectedOrder?.id === order.id
                return (
                  <button
                    key={order.id}
                    onClick={() => handleSelectOrder(order)}
                    disabled={isDispatching}
                    className={`w-full text-left p-5 transition-all flex flex-col gap-2 relative ${
                      isSelected 
                        ? 'bg-slate-50 border-l-4 border-brand' 
                        : 'hover:bg-muted/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-800">{order.orderCode}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                        {order.serviceType}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                        <span className="truncate">Gửi: {order.origin}</span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-green-600 shrink-0" />
                        <span className="truncate">Nhận: {order.destination}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded">
                        Tải trọng: {order.weightKg ?? 0} kg
                      </span>
                      {order.totalAmount && (
                        <span className="bg-amber-50 border border-amber-200 text-amber-700 text-[10px] px-2 py-0.5 rounded font-semibold">
                          Giá trị: {formatCurrencyVnd(order.totalAmount)}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </section>

        {/* Right Side: Interactive Dispatch Control Panel */}
        <section className="lg:col-span-3 bg-white rounded-2xl border border-border/50 overflow-hidden h-[620px] flex flex-col">
          {/* Dispatch Panel Header */}
          <div className="px-6 py-4 border-b border-border bg-slate-50/50 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-brand" />
            <h2 className="text-base font-semibold font-display text-slate-800">Trạm Tự Động Hóa Vận Hành</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-6 flex flex-col">
            <AnimatePresence mode="wait">
              {/* State 1: No selected order */}
              {!selectedOrder && !dispatchResult && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex-1 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4"
                >
                  <div className="w-16 h-16 rounded-full bg-brand-soft border border-brand/20 flex items-center justify-center text-brand mb-2 animate-bounce">
                    <Zap className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold font-display text-slate-800">Sẵn sàng Điều phối thông minh</h3>
                  <p className="text-sm text-muted-foreground">
                    Vui lòng chọn một vận đơn chờ xử lý ở danh sách bên trái để chạy quy trình điều phối tự động gồm 6 bước chuẩn hóa AI & Luật tối ưu.
                  </p>
                </motion.div>
              )}

              {/* State 2: Dispatch result completed */}
              {dispatchResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    {/* Success card */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-emerald-800 font-display">Điều Phối Vận Đơn Thành Công</h3>
                      <p className="text-xs text-emerald-700 max-w-sm mx-auto">
                        Quy trình tự động kết thúc. Đơn hàng đã chuyển sang trạng thái <strong>Đã lấy hàng (Picked Up)</strong> và lưu dấu kiểm toán.
                      </p>
                    </div>

                    {/* Dispatch Breakdown */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <User className="w-3.5 h-3.5 text-brand" /> Nhân sự chỉ định
                        </div>
                        <div className="text-sm font-bold text-slate-800">{dispatchResult.dispatchedDriver}</div>
                        <div className="text-xs text-muted-foreground">Tài xế có điểm số năng lực tối ưu nhất khu vực</div>
                      </div>

                      <div className="border border-border rounded-xl p-4 bg-muted/10 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          <Truck className="w-3.5 h-3.5 text-brand" /> Phương tiện điều phối
                        </div>
                        <div className="text-sm font-bold text-slate-800">{dispatchResult.dispatchedVehicle.toUpperCase()}</div>
                        <div className="text-xs text-muted-foreground">Phân bổ xe theo trọng tải hàng hóa gom</div>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div className="border border-border rounded-xl p-4 space-y-3 bg-slate-50/50">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <Route className="w-3.5 h-3.5 text-brand" /> Tuyến đường tối ưu
                      </div>
                      <div className="text-sm font-bold text-slate-800">{dispatchResult.route.path}</div>
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-center">
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Cự ly</div>
                          <div className="text-sm font-bold text-slate-800">{dispatchResult.route.distanceKm} km</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Phân tuyến</div>
                          <div className="text-sm font-bold text-brand">{dispatchResult.route.routeBand}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase">Hạn SLA</div>
                          <div className="text-sm font-bold text-slate-800">{dispatchResult.route.etaHours} giờ</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDispatchResult(null)
                    }}
                    className="w-full h-11 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors mt-6"
                  >
                    Quay lại bảng điều khiển
                  </button>
                </motion.div>
              )}

              {/* State 3: Selected order, executing or ready to run */}
              {selectedOrder && !dispatchResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-6">
                    {/* Order summary bar */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 border border-border/80 rounded-xl">
                      <div>
                        <div className="text-xs text-muted-foreground">Vận đơn đang chọn</div>
                        <div className="text-sm font-bold text-slate-800">{selectedOrder.orderCode}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Khu vực gom</div>
                        <div className="text-xs font-semibold text-slate-700">{selectedOrder.origin}</div>
                      </div>
                    </div>

                    {/* Steps Simulation Timeline */}
                    <div className="space-y-4">
                      {steps.map((step, idx) => {
                        const isIdle = step.status === 'idle'
                        const isRunning = step.status === 'running'
                        const isSuccess = step.status === 'success'
                        const isFailed = step.status === 'failed'

                        return (
                          <div 
                            key={step.id} 
                            className={`flex items-start gap-3 transition-opacity duration-300 ${
                              isIdle ? 'opacity-40' : 'opacity-100'
                            }`}
                          >
                            {/* Status Icon */}
                            <div className="mt-0.5 shrink-0">
                              {isIdle && (
                                <div className="w-5 h-5 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center text-xs text-slate-400">
                                  {idx + 1}
                                </div>
                              )}
                              {isRunning && (
                                <div className="w-5 h-5 rounded-full border-2 border-brand border-t-transparent bg-white flex items-center justify-center animate-spin" />
                              )}
                              {isSuccess && (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50 bg-white" />
                              )}
                              {isFailed && (
                                <AlertCircle className="w-5 h-5 text-red-500 fill-red-50 bg-white" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                                {step.title}
                                {isRunning && <span className="text-[10px] text-brand font-medium animate-pulse">Running...</span>}
                              </h4>
                              {isIdle && <p className="text-[11px] text-muted-foreground">{step.desc}</p>}
                              
                              {/* Success Details */}
                              {isSuccess && (
                                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed bg-slate-50 border border-slate-100 rounded p-2">
                                  {step.result}
                                </p>
                              )}

                              {/* Error Details */}
                              {isFailed && (
                                <p className="text-[11px] text-red-600 font-medium mt-0.5 leading-relaxed bg-red-50 border border-red-100 rounded p-2">
                                  Lỗi: {step.result}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="space-y-3 mt-6">
                    {errorMessage && (
                      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                        {errorMessage}
                      </div>
                    )}

                    {!isDispatching ? (
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setSelectedOrder(null)}
                          className="h-11 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                        >
                          Hủy chọn
                        </button>
                        <button
                          onClick={handleStartDispatch}
                          className="col-span-2 h-11 bg-gradient-brand hover:opacity-90 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 transition-all"
                        >
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Bắt đầu Điều phối tự động
                        </button>
                      </div>
                    ) : (
                      <div className="h-11 bg-slate-100 border border-slate-200 text-slate-500 text-xs font-semibold rounded-xl flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />
                        Hệ thống đang chạy điều phối thông minh...
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </div>
  )
}
