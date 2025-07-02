const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const createNewOrder = async (req) => {
    const userId = req.user._id;
    const { items, customerInfo, shippingAddress, paymentMethod, notes, totalAmount: reqTotalAmount } = req.body;

    if (!shippingAddress || !items || items.length === 0) {
        throw new Error('Thông tin đặt hàng không đầy đủ');
    }

    let calculatedTotalAmount = 0;
    const orderItems = [];

    for (const item of items) {
        const product = await Product.findById(item.product)
            .populate('shopId', 'shopName');
        if (!product) {
            throw new Error(`Sản phẩm với ID "${item.product}" không tồn tại.`);
        }
        if (product.stockQuantity < item.quantity) {
            throw new Error(`Sản phẩm "${product.name}" không đủ hàng.`);
        }

        const price = product.promotionPrice > 0 ? product.promotionPrice : product.price;
        const totalPrice = price * item.quantity;

        orderItems.push({
            product: product._id,
            productName: product.name,
            productImage: product.images[0] || null,
            shop: product.shopId._id,
            shopName: product.shopId.shopName || item.shopName || 'Unknown Shop',
            quantity: item.quantity,
            price: price,
            totalPrice: totalPrice
        });
        calculatedTotalAmount += totalPrice;
    }

    // Basic validation
    if (Math.abs(calculatedTotalAmount - reqTotalAmount) > 1) { // Allow for small floating point discrepancies
        console.warn(`Total amount mismatch. Calculated: ${calculatedTotalAmount}, Provided: ${reqTotalAmount}`);
        // Decide if you want to throw an error or use the calculated amount
        // For now, we'll use the calculated amount for security.
    }

    const orderData = {
        orderNumber: `ORD${Date.now()}`,
        customer: userId,
        customerInfo: {
            name: customerInfo.name,
            email: req.user.email,
            phone: customerInfo.phone
        },
        items: orderItems,
        shippingAddress: shippingAddress,
        paymentMethod: paymentMethod,
        subtotal: calculatedTotalAmount,
        shippingFee: 0, // Placeholder
        totalAmount: calculatedTotalAmount,
        notes: notes,
        paymentStatus: 'pending',
    };

    const newOrder = await Order.create(orderData);

    // After order creation, decrease stock
    for (const item of newOrder.items) {
        await Product.findByIdAndUpdate(item.product, {
            $inc: { stockQuantity: -item.quantity }
        });
    }

    // Clear user's cart
    await Cart.deleteOne({ userId: userId });

    return newOrder;
};

module.exports = { createNewOrder }; 