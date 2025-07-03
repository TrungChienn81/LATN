const { BadRequestError } = require('../core/error.response');
const { Created, OK } = require('../core/success.response');
const querystring = require('querystring');
const crypto = require('crypto');
const moment = require('moment');

// Import models nếu cần
const modelCart = require('../models/cart.model');
const modelPayments = require('../models/payments.model');
const modelProduct = require('../models/products.model');
const modelOrder = require('../models/order.model');

// Cấu hình VNPay từ thông tin merchant trong ảnh
const vnpayConfig = {
    tmnCode: process.env.VNP_TMN_CODE || 'KPBTHJK1',
    hashSecret: process.env.VNP_HASH_SECRET || 'F4RWAZLGSFCLOR1UWMNHJ4SEDR.KJ', 
    url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3001/api/orders/vnpay_return',
    frontendReturnUrl: process.env.FRONTEND_RETURN_URL || 'http://localhost:5173/user/orders',
    hashAlgorithm: 'SHA512', // Thuật toán băm rõ ràng
    version: '2.1.0'
};

// Các hằng số hữu ích
const ProductCode = {
    TopUp: 'topup',
    Billpayment: 'billpayment',
    Fashion: 'fashion',
    Other: 'other'
};

const VnpLocale = {
    VN: 'vn',
    EN: 'en'
};

// Hàm hỗ trợ định dạng ngày tháng
function dateFormat(date) {
    return moment(date).format('YYYYMMDDHHmmss');
}

// Hàm sắp xếp tham số theo bảng chữ cái (quan trọng cho việc tạo chữ ký)
function sortObject(obj) {
    const sorted = {};
    const keys = Object.keys(obj).sort();
    
    for (const key of keys) {
        sorted[key] = obj[key];
    }
    
    return sorted;
}

class VNPayController {
    /**
     * Tạo URL thanh toán VNPay
     * @param {Object} req - Request
     * @param {Object} res - Response
     */
    async createPaymentUrl(req, res) {
        try {
            const { orderId, amount, orderInfo, ipAddr } = req.body;
            
            if (!orderId || !amount || !orderInfo) {
                throw new BadRequestError('Thiếu thông tin thanh toán cần thiết');
            }
            
            // Lấy IP địa chỉ nếu không được cung cấp
            let clientIp = ipAddr || req.headers['x-forwarded-for'] || 
                           req.connection.remoteAddress || 
                           req.socket.remoteAddress || 
                           req.connection.socket.remoteAddress;
                           
            if (clientIp === '::1') clientIp = '127.0.0.1';
            
            // Tạo tham số cho VNPay
            const createDate = dateFormat(new Date());
            const orderDate = createDate;
            
            const vnp_Params = {
                'vnp_Version': vnpayConfig.version,
                'vnp_Command': 'pay',
                'vnp_TmnCode': vnpayConfig.tmnCode,
                'vnp_Locale': VnpLocale.VN,
                'vnp_CurrCode': 'VND',
                'vnp_TxnRef': orderId,
                'vnp_OrderInfo': orderInfo,
                'vnp_OrderType': ProductCode.Other,
                'vnp_Amount': amount * 100, // VNPay yêu cầu số tiền * 100
                'vnp_ReturnUrl': vnpayConfig.returnUrl,
                'vnp_IpAddr': clientIp,
                'vnp_CreateDate': createDate
            };
            
            // Sắp xếp tham số theo thứ tự bảng chữ cái
            const sortedParams = sortObject(vnp_Params);
            
            // Tạo chuỗi ký
            const signData = querystring.stringify(sortedParams, { encode: false });
            console.log('Sign data (querystring):', signData);
            
            // Tạo chữ ký
            const signature = crypto
                .createHmac('sha512', vnpayConfig.hashSecret)
                .update(signData)
                .digest('hex');
            
            console.log('Generated signature:', signature);
            
            // Thêm chữ ký vào tham số
            sortedParams['vnp_SecureHash'] = signature;
            
            // Xây dựng URL thanh toán
            const finalUrl = vnpayConfig.url + '?' + querystring.stringify(sortedParams, { encode: true });
            console.log('✅ Payment URL created successfully');
            
            return new Created({
                message: 'Tạo URL thanh toán thành công',
                metadata: finalUrl
            }).send(res);
            
        } catch (error) {
            console.error('Error creating VNPay payment URL:', error);
            throw new BadRequestError('Lỗi khi tạo URL thanh toán: ' + error.message);
        }
    }
    
    /**
     * Xử lý kết quả trả về từ VNPay
     * @param {Object} req - Request
     * @param {Object} res - Response
     */
    async vnpayReturn(req, res) {
        try {
            const vnp_Params = req.query;
            
            // Lấy chữ ký từ VNPay
            const secureHash = vnp_Params['vnp_SecureHash'];
            
            // Xóa các tham số thừa
            delete vnp_Params['vnp_SecureHash'];
            delete vnp_Params['vnp_SecureHashType'];
            
            // Sắp xếp tham số
            const sortedParams = sortObject(vnp_Params);
            
            // Tạo chuỗi ký để xác minh
            const signData = querystring.stringify(sortedParams, { encode: false });
            
            // Tạo chữ ký để so sánh
            const checkSignature = crypto
                .createHmac('sha512', vnpayConfig.hashSecret)
                .update(signData)
                .digest('hex');
                
            console.log("Received signature:", secureHash);
            console.log("Calculated signature:", checkSignature);
                
            // Kiểm tra chữ ký hợp lệ
            if (secureHash !== checkSignature) {
                console.error('Chữ ký không hợp lệ');
                return res.redirect(`${vnpayConfig.frontendReturnUrl}?status=failed&message=Chữ ký không hợp lệ`);
            }
            
            // Kiểm tra kết quả giao dịch
            const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
            const vnp_TransactionStatus = vnp_Params['vnp_TransactionStatus'];
            const vnp_TxnRef = vnp_Params['vnp_TxnRef']; // Mã đơn hàng
            
            // Kiểm tra đơn hàng trong cơ sở dữ liệu
            // const order = await modelOrder.findOne({ orderNumber: vnp_TxnRef });
            // if (!order) {
            //     console.error('Không tìm thấy đơn hàng:', vnp_TxnRef);
            //     return res.redirect(`${vnpayConfig.frontendReturnUrl}?status=failed&message=Không tìm thấy đơn hàng`);
            // }
            
            // Nếu đã thanh toán trước đó, tránh xử lý trùng lặp
            // if (order.paymentStatus === 'Completed') {
            //     console.log('Đơn hàng đã được thanh toán trước đó');
            //     return res.redirect(`${vnpayConfig.frontendReturnUrl}?status=success&orderId=${order._id}`);
            // }
            
            if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
                // Cập nhật trạng thái đơn hàng thành công
                // order.paymentStatus = 'Completed';
                // order.paymentInfo = {
                //     paymentMethod: 'VNPay',
                //     transactionId: vnp_Params['vnp_TransactionNo'] || '',
                //     paymentDate: new Date(),
                //     paymentDetails: vnp_Params
                // };
                // await order.save();
                
                console.log('Thanh toán thành công:', vnp_TxnRef);
                // Chuyển hướng người dùng đến trang thành công
                return res.redirect(`${vnpayConfig.frontendReturnUrl}?status=success&orderId=${vnp_TxnRef}`);
            } else {
                // Thanh toán thất bại
                // order.paymentStatus = 'Failed';
                // order.paymentInfo = {
                //     paymentMethod: 'VNPay',
                //     failureReason: `Mã lỗi: ${vnp_ResponseCode}`,
                //     paymentDate: new Date(),
                //     paymentDetails: vnp_Params
                // };
                // await order.save();
                
                console.error('Thanh toán thất bại:', vnp_ResponseCode);
                // Chuyển hướng người dùng đến trang thất bại
                return res.redirect(`${vnpayConfig.frontendReturnUrl}?status=failed&message=Giao dịch thất bại&orderId=${vnp_TxnRef}`);
            }
        } catch (error) {
            console.error('Error processing VNPay return:', error);
            return res.redirect(`${vnpayConfig.frontendReturnUrl}?status=error&message=Lỗi xử lý thanh toán`);
        }
    }
    
    /**
     * Tích hợp với controller thanh toán hiện tại để hỗ trợ VNPay
     * @param {Object} req - Request
     * @param {Object} res - Response
     */
    async createPayment(req, res) {
        const { id } = req.user;
        const { typePayment } = req.body;
        
        // Tìm giỏ hàng
        const cart = await modelCart.findOne({ userId: id });
        if (!cart) {
            throw new BadRequestError('Giỏ hàng không tồn tại');
        }
        
        if (!cart.fullName || !cart.phone || !cart.address) {
            throw new BadRequestError('Vui lòng cập nhật thông tin thuê');
        }
        
        // Xử lý thanh toán VNPay
        if (typePayment === 'vnpay') {
            try {
                // Tạo mã đơn hàng duy nhất
                const orderNumber = 'ORD' + Date.now();
                
                // Lấy IP người dùng
                let ipAddr = req.headers['x-forwarded-for'] || 
                            req.connection.remoteAddress || 
                            req.socket.remoteAddress || 
                            req.connection.socket.remoteAddress;
                            
                if (ipAddr === '::1') ipAddr = '127.0.0.1';
                
                // Tạo URL thanh toán
                const vnp_Params = {
                    'vnp_Version': vnpayConfig.version,
                    'vnp_Command': 'pay',
                    'vnp_TmnCode': vnpayConfig.tmnCode,
                    'vnp_Locale': VnpLocale.VN,
                    'vnp_CurrCode': 'VND',
                    'vnp_TxnRef': orderNumber,
                    'vnp_OrderInfo': `Thanh toan cho don hang ${orderNumber}`,
                    'vnp_OrderType': ProductCode.Other,
                    'vnp_Amount': cart.totalPrice * 100, // Nhân 100 vì VNPay yêu cầu
                    'vnp_ReturnUrl': vnpayConfig.returnUrl,
                    'vnp_IpAddr': ipAddr,
                    'vnp_CreateDate': dateFormat(new Date())
                };
                
                // Sắp xếp tham số
                const sortedParams = sortObject(vnp_Params);
                
                // Tạo chữ ký
                const signData = querystring.stringify(sortedParams, { encode: false });
                const signature = crypto
                    .createHmac('sha512', vnpayConfig.hashSecret)
                    .update(signData)
                    .digest('hex');
                    
                // Thêm chữ ký
                sortedParams['vnp_SecureHash'] = signature;
                
                // Tạo URL thanh toán
                const paymentUrl = vnpayConfig.url + '?' + querystring.stringify(sortedParams, { encode: true });
                
                return new Created({
                    message: 'Tạo đơn hàng thành công',
                    metadata: { orderId: orderNumber, paymentUrl }
                }).send(res);
                
            } catch (error) {
                console.error('Error creating VNPay payment:', error);
                throw new BadRequestError('Lỗi khi tạo thanh toán VNPay: ' + error.message);
            }
        }
    }
}

module.exports = new VNPayController();
