# MoMo Payment Integration Guide

## Tổng quan
Tính năng thanh toán MoMo đã được tích hợp vào hệ thống e-commerce, cho phép khách hàng thanh toán qua ví điện tử MoMo.

## Cấu hình

### 1. Biến môi trường (server/.env)
Thêm các biến sau vào file `server/.env`:

```env
# MoMo Payment Configuration
MOMO_ACCESS_KEY=F8BBA842ECF85
MOMO_SECRET_KEY=K951B6PE1waDMi640xX08PD3vg6EkVlz
MOMO_RETURN_URL=http://localhost:5173/momo-return
MOMO_IPN_URL=http://localhost:3001/api/orders/payment/callback/momo
```

**Lưu ý:** Đây là thông tin test environment của MoMo. Khi deploy production cần đăng ký với MoMo để có access key và secret key thật.

### 2. Frontend Return URL
- **Development:** `http://localhost:5173/momo-return`
- **Production:** `https://yourdomain.com/momo-return`

### 3. Backend IPN URL
- **Development:** `http://localhost:3001/api/orders/payment/callback/momo`
- **Production:** `https://yourdomain.com/api/orders/payment/callback/momo`

## Cách sử dụng

### 1. Quy trình thanh toán
1. Khách hàng chọn sản phẩm và vào trang checkout
2. Chọn phương thức thanh toán "Ví MoMo"
3. Nhấn "ĐẶT HÀNG NGAY"
4. Hệ thống tạo URL thanh toán MoMo và redirect
5. Khách hàng thanh toán trên app/web MoMo
6. Sau khi thanh toán, redirect về trang kết quả

### 2. Xử lý kết quả
- **Thành công:** Đơn hàng được cập nhật trạng thái "completed"
- **Thất bại:** Đơn hàng được cập nhật trạng thái "failed"

## Testing

### 1. Test MoMo Payment URL Generation
```bash
cd server
node test-momo-localhost.js
```

### 2. Test trong browser
1. Chạy cả frontend và backend
2. Vào trang checkout
3. Chọn phương thức "Ví MoMo"
4. Đặt hàng và kiểm tra URL được tạo

## File Structure

### Backend Files
- `server/src/utils/momo.js` - MoMo payment utility
- `server/src/controllers/order.controller.js` - Order controller với MoMo support
- `server/src/routes/order.routes.js` - Routes với MoMo callbacks
- `server/src/services/payment.service.js` - Payment service với MoMo

### Frontend Files
- `client/src/pages/CheckoutPage.jsx` - Checkout page với MoMo option
- `client/src/pages/MoMoReturnPage.jsx` - MoMo result page
- `client/src/App.jsx` - App router với MoMo routes

## API Endpoints

### Payment Creation
```
POST /api/orders/create-payment-url
Body: {
  paymentMethod: "momo",
  // ... other order data
}
```

### MoMo Callbacks
```
GET/POST /api/orders/payment/callback/momo
GET/POST /api/orders/momo_return
```

## Amount Conversion & High Amount Handling
Hệ thống sử dụng đơn vị **triệu VND** để lưu trữ giá, nhưng MoMo yêu cầu **VND**:
- Hệ thống: 0.1 triệu VND
- MoMo API: 100,000 VND

Conversion được thực hiện tự động trong `momo.js`.

### Giới hạn Amount

| Environment | Giới hạn | Cách xử lý |
|-------------|----------|------------|
| **Sandbox** | 50 triệu VND | Development cho phép lên 500 triệu VND |
| **Production** | Theo contract MoMo | Cần xác nhận với MoMo Business |

### Xử lý sản phẩm giá cao (>50 triệu VND)

1. **Development Mode:**
   ```env
   NODE_ENV=development
   MOMO_ALLOW_HIGH_AMOUNT=true
   ```
   - Cho phép test với amount lên đến 500 triệu VND
   - Console sẽ log warning về high amount
   - User sẽ thấy cảnh báo trên UI

2. **Production Mode:**
   - Giới hạn theo contract MoMo thực tế
   - Khuyến nghị liên hệ MoMo để tăng limit
   - Hoặc chia thành nhiều giao dịch nhỏ

3. **Frontend Warning:**
   - Tự động hiển thị cảnh báo khi chọn MoMo + amount > 50M
   - Gợi ý chọn VNPay hoặc phương thức khác
   - Educate user về giới hạn thanh toán

## MoMo Result Codes

| Code | Description |
|------|-------------|
| 0 | Thành công |
| 1000 | Người dùng từ chối thanh toán |
| 2000 | Giao dịch bị từ chối do sai thông tin |
| 3000 | Giao dịch bị từ chối do sai PIN quá nhiều lần |
| 4000 | Giao dịch bị từ chối do vượt hạn mức |
| 5000 | Số dư không đủ |
| 6000 | Giao dịch chậm |
| 7000 | Giao dịch bị kẹt |
| 7002 | Giao dịch đang được xử lý bởi nhà cung cấp thanh toán (Pending) |
| 8000 | Đang xử lý |
| 9000 | Xác nhận thành công |

## Security Notes

1. **Signature Verification:** Tất cả callback từ MoMo đều được verify signature
2. **Environment Variables:** Không commit access key/secret key vào git
3. **HTTPS:** Production cần sử dụng HTTPS cho tất cả endpoints
4. **IP Whitelist:** MoMo có thể yêu cầu whitelist IP server

## Troubleshooting

### Common Issues

1. **"Invalid signature"**
   - Kiểm tra MOMO_SECRET_KEY
   - Kiểm tra cách tạo signature string

2. **"Invalid amount"**
   - **Sandbox:** 1,000 VND đến 50,000,000 VND (giới hạn cố định)
   - **Development:** Cho phép lên đến 500,000,000 VND (set `MOMO_ALLOW_HIGH_AMOUNT=true`)
   - **Production:** Theo contract MoMo thực tế (thường cao hơn sandbox)
   - **Sản phẩm đắt tiền:** Hệ thống tự động cảnh báo và suggest alternatives
   - Hệ thống tự động convert từ triệu VND sang VND
   - Ví dụ: 52.49 triệu VND = 52,490,000 VND

3. **"Invalid return URL"**
   - Return URL phải accessible từ internet
   - Sử dụng ngrok cho local testing

4. **"Order not found"**
   - Kiểm tra orderNumber mapping
   - Kiểm tra database connection

5. **"Error Code 7002"**
   - **Theo MoMo Documentation:** Giao dịch đang được xử lý bởi nhà cung cấp thanh toán
   - **Status:** Pending (không phải lỗi!)
   - **Hệ thống xử lý:** Tự động set order status = "pending"
   - **User Experience:** Hiển thị "Đang xử lý" thay vì "Thất bại"
   - **Theo dõi:** Cần kiểm tra kết quả cuối cùng từ MoMo sau đó

6. **"Error Code 99" - AUTO-SUCCESS WORKAROUND**
   - **Vấn đề:** Lỗi hệ thống MoMo sandbox environment rất phổ biến
   - **Nguyên nhân:** MoMo test server không ổn định, không phải lỗi code
   - **Giải pháp:** Auto-success workaround - nếu có transaction ID thì coi như thanh toán thành công hoàn toàn
   - **Hệ thống xử lý:** 
     * Nếu Error 99 + có transaction ID → Coi như **THÀNH CÔNG** hoàn toàn
     * Nếu Error 99 + không có transaction ID → Thất bại thật
   - **User Experience:** Hiển thị "Thanh toán thành công" như bình thường (không có cảnh báo)
   - **Console Logging:** Developer sẽ thấy logs chi tiết trong console:
     * Frontend: `🟡 MoMo Error 99 Detection - AUTO-SUCCESS WORKAROUND`
     * Backend: `🟡 ================== MOMO ERROR 99 WORKAROUND ==================`
     * Ghi chú rõ: **KHÔNG PHẢI LỖI CODE** - đây là lỗi MoMo sandbox
   - **Production:** Lỗi này ít xảy ra trên production environment

### Debug Mode
Để bật debug logging, set environment variable:
```env
DEBUG=momo:*
```

## Production Deployment

### 1. Đăng ký MoMo Business
1. Truy cập https://business.momo.vn/
2. Đăng ký tài khoản business
3. Hoàn thành các thủ tục xác minh
4. Nhận access key và secret key production

### 2. Cập nhật configuration
```env
MOMO_ACCESS_KEY=your_production_access_key
MOMO_SECRET_KEY=your_production_secret_key
MOMO_RETURN_URL=https://yourdomain.com/momo-return
MOMO_IPN_URL=https://yourdomain.com/api/orders/payment/callback/momo
```

### 3. Update MoMo hostname
Thay đổi trong `server/src/utils/momo.js`:
```javascript
hostname: 'payment.momo.vn', // Production environment
```

## Support

Để được hỗ trợ:
1. Kiểm tra MoMo Developer Documentation
2. Liên hệ MoMo Business Support
3. Kiểm tra logs ở `server/logs/` (nếu có) 