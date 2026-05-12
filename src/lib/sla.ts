function normalizeProvince(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .normalize('NFC')
}

const regionNorth = new Set([
  'hà nội',
  'hanoi',
  'hải phòng',
  'hai phong',
  'quảng ninh',
  'quang ninh',
  'bắc ninh',
  'bac ninh',
  'hưng yên',
  'hung yen',
  'hải dương',
  'hai duong',
  'thái bình',
  'thai binh',
  'nam định',
  'nam dinh',
  'ninh bình',
  'ninh binh',
  'hà nam',
  'ha nam',
  'hòa bình',
  'hoa binh',
  'sơn la',
  'son la',
  'điện biên',
  'dien bien',
  'lào cai',
  'lao cai',
  'yên bái',
  'yen bai',
  'tuyên quang',
  'tuyen quang',
  'phú thọ',
  'phu tho',
  'vĩnh phúc',
  'vinh phuc',
  'bắc giang',
  'bac giang',
  'lạng sơn',
  'lang son',
  'cao bằng',
  'cao bang',
  'bắc kạn',
  'bac kan',
  'thái nguyên',
  'thai nguyen',
  'hà tĩnh',
  'ha tinh',
])

const regionCentral = new Set([
  'quảng bình',
  'quang binh',
  'quảng trị',
  'quang tri',
  'thừa thiên huế',
  'thua thien hue',
  'huế',
  'hue',
  'đà nẵng',
  'da nang',
  'quảng nam',
  'quang nam',
  'quảng ngãi',
  'quang ngai',
  'bình định',
  'binh dinh',
  'phú yên',
  'phu yen',
  'khánh hòa',
  'khanh hoa',
  'ninh thuận',
  'ninh thuan',
  'bình thuận',
  'binh thuan',
])

const regionSouth = new Set([
  'gia lai',
  'gialai',
  'kon tum',
  'kontum',
  'đắk lắk',
  'dak lak',
  'đắk nông',
  'dak nong',
  'lâm đồng',
  'lam dong',
  'tp.hcm',
  'tp hcm',
  'tp hồ chí minh',
  'hồ chí minh',
  'ho chi minh',
  'bình dương',
  'binh duong',
  'đồng nai',
  'dong nai',
  'bà rịa vũng tàu',
  'ba ria vung tau',
  'tây ninh',
  'tay ninh',
  'bình phước',
  'binh phuoc',
  'long an',
  'tiền giang',
  'tien giang',
  'bến tre',
  'ben tre',
  'vĩnh long',
  'vinh long',
  'trà vinh',
  'tra vinh',
  'hậu giang',
  'hau giang',
  'sóc trăng',
  'soc trang',
  'cần thơ',
  'can tho',
  'cà mau',
  'ca mau',
  'kiên giang',
  'kien giang',
  'an giang',
  'đồng tháp',
  'dong thap',
])

function getRegion(province: string) {
  const normalized = normalizeProvince(province)

  if (regionNorth.has(normalized)) return 'Bắc'
  if (regionCentral.has(normalized)) return 'Trung'
  if (regionSouth.has(normalized)) return 'Nam'

  if (/^(hải|hà|hưng|thái|nam|ninh|bắc|cao|lạng|tuyên|phú|vĩnh|yên)/i.test(normalized)) {
    return 'Bắc'
  }

  if (/^(quảng|huế|đà|bình|phú|khánh|ninh|thuận)/i.test(normalized)) {
    return 'Trung'
  }

  return 'Nam'
}

export type RouteBand = 'noi_tinh' | 'noi_vung' | 'lien_vung' | 'lien_tinh'

export function classifyRoute(origin: string, destination: string): RouteBand {
  const originNorm = normalizeProvince(origin)
  const destinationNorm = normalizeProvince(destination)

  if (originNorm === destinationNorm) return 'noi_tinh'

  const originRegion = getRegion(origin)
  const destinationRegion = getRegion(destination)

  if (originRegion === destinationRegion) return 'noi_vung'

  const pair = [originRegion, destinationRegion].sort().join('-')
  if (pair === 'Bắc-Trung' || pair === 'Nam-Trung') return 'lien_vung'

  return 'lien_tinh'
}

type TransitWindow = {
  standardHours: number
  maxHours: number
}

const transitMatrix: Record<string, Record<RouteBand, TransitWindow>> = {
  ltl: {
    noi_tinh: { standardHours: 8, maxHours: 12 },
    noi_vung: { standardHours: 24, maxHours: 48 },
    lien_vung: { standardHours: 48, maxHours: 96 },
    lien_tinh: { standardHours: 72, maxHours: 96 },
  },
  express: {
    noi_tinh: { standardHours: 4, maxHours: 6 },
    noi_vung: { standardHours: 18, maxHours: 24 },
    lien_vung: { standardHours: 24, maxHours: 48 },
    lien_tinh: { standardHours: 36, maxHours: 48 },
  },
  ftl: {
    noi_tinh: { standardHours: 24, maxHours: 48 },
    noi_vung: { standardHours: 48, maxHours: 72 },
    lien_vung: { standardHours: 72, maxHours: 96 },
    lien_tinh: { standardHours: 96, maxHours: 120 },
  },
  cold: {
    noi_tinh: { standardHours: 30, maxHours: 54 },
    noi_vung: { standardHours: 54, maxHours: 78 },
    lien_vung: { standardHours: 84, maxHours: 108 },
    lien_tinh: { standardHours: 108, maxHours: 132 },
  },
  '3pl': {
    noi_tinh: { standardHours: 24, maxHours: 48 },
    noi_vung: { standardHours: 48, maxHours: 72 },
    lien_vung: { standardHours: 72, maxHours: 96 },
    lien_tinh: { standardHours: 96, maxHours: 120 },
  },
  doc: {
    noi_tinh: { standardHours: 24, maxHours: 48 },
    noi_vung: { standardHours: 48, maxHours: 72 },
    lien_vung: { standardHours: 72, maxHours: 96 },
    lien_tinh: { standardHours: 96, maxHours: 120 },
  },
}

export const SLA_BUFFER_HOURS = 24

function addHours(baseDate: Date, hours: number) {
  return new Date(baseDate.getTime() + hours * 60 * 60 * 1000)
}

export function getTransitWindow(serviceType: string, origin: string, destination: string) {
  const routeBand = classifyRoute(origin, destination)
  const serviceKey = serviceType.toLowerCase()
  const serviceWindows = transitMatrix[serviceKey] ?? transitMatrix.ftl
  return {
    routeBand,
    ...serviceWindows[routeBand],
  }
}

export function getEstimatedDelivery(serviceType: string, origin: string, destination: string, baseDate = new Date()) {
  const { standardHours } = getTransitWindow(serviceType, origin, destination)
  return addHours(baseDate, standardHours)
}

export function getSlaDeadline(
  serviceType: string,
  origin: string,
  destination: string,
  baseDate: Date,
  estimatedDelivery?: Date | null,
) {
  const { standardHours, maxHours } = getTransitWindow(serviceType, origin, destination)
  const standardDelivery = estimatedDelivery ?? addHours(baseDate, standardHours)
  const extraHoursBeyondStandard = Math.max(0, maxHours - standardHours)

  return {
    routeBand: classifyRoute(origin, destination),
    standardDelivery,
    maxDelivery: addHours(standardDelivery, extraHoursBeyondStandard),
    deadline: addHours(standardDelivery, extraHoursBeyondStandard + SLA_BUFFER_HOURS),
  }
}
