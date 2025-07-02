const moment = require('moment');
const querystring = require('qs');
const crypto = require('crypto');
const sortObject = require('../utils/sortObject');
const { createMoMoPaymentUrl } = require('../utils/momo');

const createVnPayUrl = (req, order) => {
    process.env.TZ = 'Asia/Ho_Chi_Minh';

    const tmnCode = process.env.VNP_TMNCODE;
    const secretKey = process.env.VNP_HASHSECRET;
    let vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;

    if (!tmnCode || !secretKey || !vnpUrl || !returnUrl) {
        throw new Error('Vui lòng cấu hình đầy đủ biến môi trường cho VNPay');
    }

    const date = new Date();
    const createDate = moment(date).format('YYYYMMDDHHmmss');
    const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');

    let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress ||
        req.socket.remoteAddress ||
        req.connection.socket.remoteAddress;

    // Convert IPv6 localhost to IPv4
    if (ipAddr === '::1') {
        ipAddr = '127.0.0.1';
    }

    const orderId = order.orderNumber;
    const amount = order.totalAmount;
    const orderInfo = `Thanh toan don hang ${orderId}`;
    const orderType = 'other';
    const locale = 'vn';
    const currCode = 'VND';

    let vnp_Params = {
        'vnp_Version': '2.1.0',
        'vnp_Command': 'pay',
        'vnp_TmnCode': tmnCode,
        'vnp_Locale': locale,
        'vnp_CurrCode': currCode,
        'vnp_TxnRef': orderId,
        'vnp_OrderInfo': orderInfo,
        'vnp_OrderType': orderType,
        'vnp_Amount': amount * 100,
        'vnp_ReturnUrl': returnUrl,
        'vnp_IpAddr': ipAddr,
        'vnp_CreateDate': createDate,
        'vnp_ExpireDate': expireDate
    };

    vnp_Params = sortObject(vnp_Params);

    const signData = querystring.stringify(vnp_Params, { encode: false });
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    return vnpUrl;
};

const createMoMoUrl = async (req, order) => {
    const orderInfo = `Thanh toan don hang ${order.orderNumber}`;
    const amount = order.totalAmount; // Amount in millions VND
    const orderNumber = order.orderNumber;

    // Validate amount before calling MoMo
    const amountInVND = Math.round(amount * 1000000);
    if (amountInVND < 1000) {
        throw new Error(`Số tiền thanh toán quá nhỏ. Tối thiểu 1,000 VND, hiện tại: ${amountInVND} VND`);
    }
    if (amountInVND > 50000000) {
        throw new Error(`Số tiền thanh toán quá lớn. Tối đa 50,000,000 VND, hiện tại: ${amountInVND} VND`);
    }

    try {
        const result = await createMoMoPaymentUrl(orderInfo, amount, orderNumber);
        return result.paymentUrl;
    } catch (error) {
        throw new Error(`Không thể tạo URL thanh toán MoMo: ${error.message}`);
    }
};

module.exports = { createVnPayUrl, createMoMoUrl }; 