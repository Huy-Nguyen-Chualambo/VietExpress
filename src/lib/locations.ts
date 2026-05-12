// Minimal locations dataset for quote form selects
export const provinces = [
  'Hà Nội',
  'Hồ Chí Minh',
  'Bình Dương',
]

export const districtsByProvince: Record<string, string[]> = {
  'Hà Nội': ['Quận Nam Từ Liêm', 'Quận Hoàn Kiếm', 'Quận Đống Đa'],
  'Hồ Chí Minh': ['Quận 1', 'Quận 3', 'Quận 10'],
  'Bình Dương': ['Thành phố Thủ Dầu Một', 'Thị xã Bến Cát'],
}

export const wardsByDistrict: Record<string, string[]> = {
  'Quận Nam Từ Liêm': ['Phường Xuân Phương', 'Phường Mễ Trì'],
  'Quận Hoàn Kiếm': ['Phường Hàng Bài', 'Phường Hàng Trống'],
  'Quận Đống Đa': ['Phường Ô Chợ Dừa', 'Phường Văn Chương'],
  'Quận 1': ['Phường Bến Nghé', 'Phường Tân Định'],
  'Quận 3': ['Phường Võ Thị Sáu', 'Phường 6'],
  'Quận 10': ['Phường 14', 'Phường 15'],
  'Thành phố Thủ Dầu Một': ['Phường Chánh Nghĩa', 'Phường Phú Cường'],
  'Thị xã Bến Cát': ['Phường Mỹ Phước', 'Phường Thới Hòa'],
}

export function getDistricts(province?: string) {
  if (!province) return []
  return districtsByProvince[province] || []
}

export function getWards(district?: string) {
  if (!district) return []
  return wardsByDistrict[district] || []
}
