// models/Order.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true // Lưu tên sản phẩm để tránh mất dữ liệu khi sản phẩm bị xóa
  },
  productImage: {
    type: String // Lưu ảnh chính của sản phẩm
  },
  shop: {
    type: Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  shopName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true // Giá tại thời điểm đặt hàng
  },
  totalPrice: {
    type: Number,
    required: true // price * quantity
  }
});

const shippingAddressSchema = new Schema({
  fullName: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String },
    ward: { type: String },
    postalCode: { type: String }
  }
}, { _id: false });

const orderSchema = new Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  customer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerInfo: {
    name: String,
    email: String,
    phone: String
  },
  items: [orderItemSchema],
  
  // Thông tin giao hàng
  shippingAddress: shippingAddressSchema,
  
  // Thông tin thanh toán
  paymentMethod: {
    type: String,
    enum: ['cod', 'bank_transfer', 'momo', 'zalopay', 'vnpay', 'paypal'],
    default: 'cod'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  
  // Trạng thái đơn hàng
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'],
    default: 'pending'
  },
  
  // Giá cả
  subtotal: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Thời gian
  orderDate: {
    type: Date,
    default: Date.now
  },
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Ghi chú
  notes: String,
  cancelReason: String,
  
  // Theo dõi
  trackingNumber: String,
  
  // Shops liên quan (để phân chia đơn hàng theo shop)
  shops: [{
    shop: {
      type: Schema.Types.ObjectId,
      ref: 'Shop'
    },
    items: [String], // Array of item IDs belonging to this shop
    subtotal: Number,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled'],
      default: 'pending'
    }
  }]
}, {
  timestamps: true,
  collection: 'Orders'
});

// Generate order number
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.orderNumber = `ORD${timestamp.slice(-8)}${random}`;
  }
  
  // Calculate totals
  this.subtotal = this.items.reduce((total, item) => total + item.totalPrice, 0);
  this.totalAmount = this.subtotal + this.shippingFee;
  
  next();
});

// Indexes for better query performance
orderSchema.index({ customer: 1, createdAt: -1 });
// orderNumber index already defined with unique: true in schema
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ 'shops.shop': 1 });

// Methods
orderSchema.methods.updateStatus = function(newStatus, shopId = null) {
  if (shopId) {
    // Update status for specific shop
    const shopOrder = this.shops.find(s => s.shop.toString() === shopId.toString());
    if (shopOrder) {
      shopOrder.status = newStatus;
    }
  } else {
    // Update overall order status
    this.orderStatus = newStatus;
    
    // Set timestamps
    const now = new Date();
    switch (newStatus) {
      case 'confirmed':
        this.confirmedAt = now;
        break;
      case 'shipping':
        this.shippedAt = now;
        break;
      case 'delivered':
        this.deliveredAt = now;
        break;
      case 'cancelled':
        this.cancelledAt = now;
        break;
    }
  }
  
  return this.save();
};

orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.orderStatus);
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;