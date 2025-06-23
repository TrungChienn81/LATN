const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Get reviews for a specific product
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest', rating } = req.query;
    
    // Build query
    const query = { 
      productId, 
      status: 'approved' 
    };
    
    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }
    
    // Sort options
    let sortOption = { createdAt: -1 }; // Default: newest first
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'rating-high':
        sortOption = { rating: -1, createdAt: -1 };
        break;
      case 'rating-low':
        sortOption = { rating: 1, createdAt: -1 };
        break;
      case 'helpful':
        sortOption = { helpfulVotes: -1, createdAt: -1 };
        break;
    }
    
    // Get reviews with pagination
    const reviews = await Review.find(query)
      .populate('userId', 'name avatar')
      .populate('shopId', 'shopName')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    // Get total count
    const total = await Review.countDocuments(query);
    
    // Get rating statistics
    const ratingStats = await Review.getProductRatingStats(productId);
    
    res.status(200).json({
      success: true,
      data: reviews,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      ratingStats
    });
  } catch (error) {
    console.error('Error getting product reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đánh giá'
    });
  }
};

// Create a new review
const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, rating, title, content, images, orderId } = req.body;
    
    // Validate required fields
    if (!productId || !rating || !content) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ thông tin đánh giá'
      });
    }
    
    // Validate rating
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Đánh giá phải từ 1 đến 5 sao'
      });
    }
    
    // Check if product exists
    const product = await Product.findById(productId).populate('shopId');
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sản phẩm'
      });
    }
    
    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đánh giá sản phẩm này rồi'
      });
    }
    
    // Create review
    const reviewData = {
      productId,
      userId,
      shopId: product.shopId._id,
      rating: parseInt(rating),
      title: title?.trim(),
      content: content.trim(),
      images: images || []
    };
    
    // Add order ID if provided (for verified purchase)
    if (orderId) {
      // Verify the order belongs to user and contains the product
      const order = await Order.findOne({
        _id: orderId,
        userId,
        'items.productId': productId
      });
      
      if (order) {
        reviewData.orderId = orderId;
        reviewData.isVerifiedPurchase = order.status === 'delivered';
      }
    }
    
    const review = await Review.create(reviewData);
    
    // Populate review data for response
    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'name avatar')
      .populate('shopId', 'shopName');
    
    res.status(201).json({
      success: true,
      message: 'Đánh giá đã được tạo thành công',
      data: populatedReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đánh giá'
    });
  }
};

// Update a review
const updateReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { rating, title, content, images } = req.body;
    
    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }
    
    // Check ownership
    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền sửa đánh giá này'
      });
    }
    
    // Update fields
    if (rating) review.rating = parseInt(rating);
    if (title !== undefined) review.title = title.trim();
    if (content) review.content = content.trim();
    if (images !== undefined) review.images = images;
    
    await review.save();
    
    // Populate and return updated review
    const updatedReview = await Review.findById(reviewId)
      .populate('userId', 'name avatar')
      .populate('shopId', 'shopName');
    
    res.status(200).json({
      success: true,
      message: 'Đánh giá đã được cập nhật',
      data: updatedReview
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật đánh giá'
    });
  }
};

// Delete a review
const deleteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    
    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }
    
    // Check ownership (user can delete their own review or admin can delete any)
    if (review.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xóa đánh giá này'
      });
    }
    
    await Review.findByIdAndDelete(reviewId);
    
    res.status(200).json({
      success: true,
      message: 'Đánh giá đã được xóa'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa đánh giá'
    });
  }
};

// Vote helpful/unhelpful on a review
const voteReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { isHelpful } = req.body;
    
    // Find review
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }
    
    // Check if user already voted
    const existingVoteIndex = review.helpfulVotes.findIndex(
      vote => vote.userId.toString() === userId
    );
    
    if (existingVoteIndex !== -1) {
      // Update existing vote
      review.helpfulVotes[existingVoteIndex].isHelpful = isHelpful;
    } else {
      // Add new vote
      review.helpfulVotes.push({ userId, isHelpful });
    }
    
    await review.save();
    
    res.status(200).json({
      success: true,
      message: 'Đã ghi nhận đánh giá của bạn',
      helpfulCount: review.helpfulCount,
      unhelpfulCount: review.unhelpfulCount
    });
  } catch (error) {
    console.error('Error voting review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi vote đánh giá'
    });
  }
};

// Get user's reviews
const getUserReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    
    const reviews = await Review.find({ userId })
      .populate('productId', 'name images price')
      .populate('shopId', 'shopName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments({ userId });
    
    res.status(200).json({
      success: true,
      data: reviews,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error getting user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đánh giá của người dùng'
    });
  }
};

// Get shop's reviews (for shop owner)
const getShopReviews = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, rating, status = 'approved' } = req.query;
    
    // Get user's shop
    const User = require('../models/User');
    const user = await User.findById(userId).populate('shopId');
    
    if (!user.shopId) {
      return res.status(404).json({
        success: false,
        message: 'Bạn chưa có shop'
      });
    }
    
    // Build query
    const query = { shopId: user.shopId._id };
    if (status !== 'all') {
      query.status = status;
    }
    if (rating && rating !== 'all') {
      query.rating = parseInt(rating);
    }
    
    const reviews = await Review.find(query)
      .populate('userId', 'name avatar')
      .populate('productId', 'name images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Review.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: reviews,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error getting shop reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy đánh giá của shop'
    });
  }
};

// Reply to a review (shop owner)
const replyToReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Nội dung phản hồi không được để trống'
      });
    }
    
    // Find review
    const review = await Review.findById(reviewId).populate('shopId');
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đánh giá'
      });
    }
    
    // Check if user owns the shop
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    if (!user.shopId || user.shopId.toString() !== review.shopId._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền phản hồi đánh giá này'
      });
    }
    
    // Add reply
    review.shopReply = {
      content: content.trim(),
      repliedAt: new Date(),
      repliedBy: userId
    };
    
    await review.save();
    
    res.status(200).json({
      success: true,
      message: 'Phản hồi đã được gửi',
      data: review.shopReply
    });
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi phản hồi đánh giá'
    });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  voteReview,
  getUserReviews,
  getShopReviews,
  replyToReview
}; 