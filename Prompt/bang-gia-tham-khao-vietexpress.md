# BẢNG GIÁ THAM KHẢO CHI TIẾT - VIETEXPRESS (ÁP DỤNG NỘI BỘ DỰ ÁN)

Cập nhật: 26/04/2026  
Phạm vi: Vận tải nội địa Việt Nam, mục đích mô phỏng vận hành cho hệ thống VietExpress.  
Trạng thái: THAM KHẢO NỘI BỘ (không thay thế hợp đồng thương mại)

## 1. Nguyên tắc sử dụng

- Đơn vị tiền tệ: VND.  
- Mức giá dưới đây chưa bao gồm VAT 8% (hoặc mức VAT theo quy định hiện hành).  
- Giá mang tính tham khảo để sử dụng trong dashboard, báo giá nhanh, và demo workflow automation.  
- Báo giá cuối cùng cần được nhân viên xác nhận lại theo điều kiện thực tế (địa bàn khó giao, giới hạn tải, loại hàng đặc thù).  

## 2. Quy ước tính cước

### 2.1 Quy ước trọng lượng tính cước

- Trọng lượng tính cước = max(trọng lượng thực tế, trọng lượng quy đổi thể tích)  
- Trọng lượng quy đổi thể tích (kg):

$$
W_{quydoi} = \frac{D(cm) \times R(cm) \times C(cm)}{5000}
$$

- Làm tròn trọng lượng:  
- Express/LTL: làm tròn lên 0.5 kg.  
- FTL/Cold: làm tròn lên 1 kg.  

### 2.2 Phân vùng tuyến cơ bản

- Nội tỉnh: cùng thành phố/tỉnh.  
- Nội miền: cùng miền (Bắc-Bắc, Trung-Trung, Nam-Nam).  
- Liên miền: Bắc-Trung, Trung-Nam, Bắc-Nam.  

## 3. Bảng giá theo nhóm dịch vụ (mapping với serviceType trong dự án)

## 3.1 LTL - Vận chuyển dưới 20kg (serviceType = ltl)

| Bậc trọng lượng | Nội tỉnh | Nội miền | Liên miền |
|---|---:|---:|---:|
| 0 - 2 kg | 28,000 | 36,000 | 52,000 |
| >2 - 5 kg | 40,000 | 55,000 | 78,000 |
| >5 - 10 kg | 62,000 | 84,000 | 118,000 |
| >10 - 20 kg | 95,000 | 130,000 | 180,000 |

Phụ trội LTL:
- Mỗi 1 kg vượt mốc 20 kg: +7,500/kg (nội tỉnh), +9,500/kg (nội miền), +12,500/kg (liên miền).

SLA tham khảo:
- Nội tỉnh: 4-12h.  
- Nội miền: 1-2 ngày.  
- Liên miền: 2-4 ngày.  

## 3.2 EXPRESS - Chuyển phát nhanh (serviceType = express)

| Bậc trọng lượng | Nội tỉnh hỏa tốc | Nội miền nhanh | Liên miền nhanh |
|---|---:|---:|---:|
| 0 - 2 kg | 45,000 | 65,000 | 95,000 |
| >2 - 5 kg | 65,000 | 95,000 | 138,000 |
| >5 - 10 kg | 95,000 | 140,000 | 205,000 |
| >10 - 20 kg | 145,000 | 210,000 | 310,000 |

Phụ trội Express:
- Mỗi 1 kg vượt mốc 20 kg: +12,000/kg (nội tỉnh), +15,000/kg (nội miền), +20,000/kg (liên miền).

SLA tham khảo:
- Nội tỉnh: 2-6h.  
- Nội miền: trong ngày hoặc sáng ngày hôm sau.  
- Liên miền: 24-48h.  

## 3.3 FTL - Vận chuyển trên 20kg / theo lô lớn (serviceType = ftl)

Định giá theo 2 thành phần: cước cơ bản + cước theo km.

| Loại xe | Tải trọng tham chiếu | Cước mở chuyến | Đơn giá/km |
|---|---:|---:|---:|
| Xe 500kg - 1 tấn | đến 1,000 kg | 350,000 | 11,000 |
| Xe 1.5 tấn | đến 1,500 kg | 500,000 | 14,000 |
| Xe 2.5 tấn | đến 2,500 kg | 700,000 | 17,000 |
| Xe 5 tấn | đến 5,000 kg | 1,150,000 | 22,000 |

Công thức tham khảo FTL:

$$
Cuoc\_FTL = Cuoc\_mo\_chuyen + (So\_km \times Don\_gia/km) + Phu\_phi
$$

Ghi chú:
- Quãng đường tối thiểu tính cước: 15 km/chuyến nội đô, 30 km/chuyến liên tỉnh.  
- Chờ tải > 2 giờ: 120,000 VND/giờ.  

## 3.4 COLD - Vận tải lạnh (serviceType = cold)

Áp dụng hệ số điều chỉnh từ bảng FTL:
- Nhiệt độ 2-8°C: hệ số x1.30  
- Nhiệt độ -18°C đến -5°C: hệ số x1.55  

Công thức tham khảo:

$$
Cuoc\_Cold = Cuoc\_FTL \times He\_so\_nhiet\_do + Phu\_phi\_kiem\_soat\_lanh
$$

Phụ phí kiểm soát lạnh:
- 180,000 VND/chuyến (dưới 150 km)  
- 350,000 VND/chuyến (từ 150 km trở lên)  

## 3.5 3PL - Kho, vận, phân phối (serviceType = 3pl)

### A. Lưu kho

| Hạng mục | Đơn giá tham khảo |
|---|---:|
| Nhập kho | 3,000 VND/kg/lần |
| Lưu kho kho thường | 55,000 VND/pallet/ngày |
| Lưu kho lạnh | 120,000 VND/pallet/ngày |
| Xuất kho | 3,500 VND/kg/lần |

### B. Xử lý đơn

| Hạng mục | Đơn giá tham khảo |
|---|---:|
| Picking | 2,500 VND/dòng hàng |
| Packing cơ bản | 8,000 VND/đơn |
| Đối soát COD | 1.2% giá trị thu hộ |

### C. Vận chuyển last-mile

- Có thể áp dụng bảng EXPRESS hoặc LTL tùy mức SLA.

## 3.6 DOC - Chứng từ và thủ tục (serviceType = doc)

| Loại hồ sơ | Đơn giá tham khảo |
|---|---:|
| Tư vấn bộ chứng từ cơ bản | 120,000/bộ |
| Kiểm tra và hoàn thiện hồ sơ | 250,000/bộ |
| Đại diện nộp/chạy hồ sơ nội tỉnh | 450,000/lần |
| Xử lý hồ sơ liên tỉnh | 900,000/lần |

## 4. Bảng phụ phí chung

| Loại phụ phí | Mức thu tham khảo |
|---|---:|
| Khu vực khó giao (xa/trung tâm hạn chế) | +10% đến +20% cước cơ bản |
| Hàng dễ vỡ/yêu cầu đóng gói đặc biệt | +35,000 đến +120,000/đơn |
| Giao hàng ngoài giờ (sau 20:00) | +80,000/chuyến |
| Giao cuối tuần/ngày lễ | +15% cước |
| Thu hộ COD | 0.8% giá trị COD (tối thiểu 15,000) |
| Nâng/hạ bằng xe nâng | 250,000/giờ |

## 5. Chính sách chiết khấu tham khảo

| Sản lượng tháng (đơn) | Chiết khấu |
|---|---:|
| 50 - 199 đơn | 3% |
| 200 - 499 đơn | 6% |
| 500+ đơn | 10% |

- Chiết khấu ưu tiên áp dụng cho cước cơ bản (không áp dụng cho một số phụ phí đặc thù).

## 6. Mẫu tính báo giá nhanh

### Ví dụ 1 - LTL

Thông tin:
- Tuyến: nội miền  
- Trọng lượng tính cước: 12 kg  
- Dịch vụ: ltl  

Tính:
- Giá mốc >10-20 kg nội miền: 130,000 VND  
- Phụ phí: 0  

Tổng tạm tính: 130,000 VND (chưa VAT)

### Ví dụ 2 - Express có COD

Thông tin:
- Tuyến: liên miền  
- Trọng lượng tính cước: 6 kg  
- Giá trị COD: 2,500,000 VND  

Tính:
- Giá mốc >5-10 kg liên miền: 205,000 VND  
- Phí COD: max(2,500,000 x 0.8%, 15,000) = 20,000 VND  

Tổng tạm tính: 225,000 VND (chưa VAT)

### Ví dụ 3 - FTL

Thông tin:
- Xe 2.5 tấn  
- Quãng đường 95 km  
- Không phụ phí khác  

Tính:
- Cước mở chuyến: 700,000  
- Cước km: 95 x 17,000 = 1,615,000  

Tổng tạm tính: 2,315,000 VND (chưa VAT)

## 7. Gợi ý tích hợp vào dự án

- Mapping serviceType trong DB:
- ltl -> bảng 3.1  
- express -> bảng 3.2  
- ftl -> bảng 3.3  
- cold -> bảng 3.4  
- 3pl -> bảng 3.5  
- doc -> bảng 3.6  

- Quy trình đề xuất cho màn hình báo giá nhân viên:
1. Nhân viên nhập thông số: tuyến, trọng lượng tính cước, km (nếu ftl/cold), phụ phí.  
2. Hệ thống trả giá tham chiếu từ bảng này.  
3. Nhân viên có thể điều chỉnh +/- theo thỏa thuận và lưu vào quote_requests.quoted_price.  
4. Ghi action log để phục vụ đánh giá baseline và automation.  

## 8. Điều khoản bảo lưu

- Bảng giá này phục vụ mô phỏng, đào tạo và vận hành thử nghiệm trong đề tài.  
- Giá thực tế có thể thay đổi theo:
- Biến động nhiên liệu  
- Tính sẵn sàng xe theo mùa cao điểm  
- Điều kiện giao nhận đặc thù của từng khách hàng  
- Đề xuất cập nhật bảng giá 1 lần/tháng trong giai đoạn thực nghiệm.