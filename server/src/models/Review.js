// models/Review.js
const mongoose = require('mongoose');
const { Schema, Types } = mongoose;

const reviewSchema = new Schema({
      // Product being reviewed
  productId: {
    type: Types.ObjectId,
    ref: 'Product',
    required: true
  },
  
  // User who wrote the review
  userId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Shop that owns the product
  shopId: {
    type: Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  
  // Order that contains this product (to verify purchase)
  orderId: {
    type: Types.ObjectId,
    ref: 'Order',
    required: false // Có thể review mà không cần order (guest reviews)
  },
    
    // Rating (1-5 stars)
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    
    // Review title
    title: {
        type: String,
        required: false,
        maxlength: 100,
        trim: true
    },
    
    // Review content
    content: {
        type: String,
        required: true,
        maxlength: 1000,
        trim: true
    },
    
    // Review images (optional)
    images: [{
        type: String,
        validate: {
            validator: function(v) {
                return /^(https?:\/\/)|(\/uploads\/)/.test(v);
            },
            message: 'Invalid image URL'
        }
    }],
    
    // Verified purchase flag
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    
    // Review status
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'hidden'],
        default: 'approved' // Auto-approve by default
    },
    
      // Helpful votes
  helpfulVotes: [{
    userId: {
      type: Types.ObjectId,
      ref: 'User'
    },
        isHelpful: {
            type: Boolean,
            default: true
        }
    }],
    
    // Reply from shop owner
    shopReply: {
        content: {
            type: String,
            maxlength: 500,
            trim: true
        },
        repliedAt: {
            type: Date
        },
            repliedBy: {
      type: Types.ObjectId,
      ref: 'User'
    }
    },
    
    // Admin notes (for moderation)
    adminNotes: {
        type: String,
        maxlength: 500
    }
}, {
    timestamps: true,
    collection: 'reviews'
});

// Indexes for performance
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ shopId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ status: 1 });

// Compound index for unique review per user per product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Virtual for helpful votes count
reviewSchema.virtual('helpfulCount').get(function() {
    return this.helpfulVotes.filter(vote => vote.isHelpful).length;
});

// Virtual for unhelpful votes count  
reviewSchema.virtual('unhelpfulCount').get(function() {
    return this.helpfulVotes.filter(vote => !vote.isHelpful).length;
});

// Pre-save middleware to set verified purchase flag and update product rating
reviewSchema.pre('save', async function(next) {
  if (this.isNew && this.orderId) {
    try {
      const Order = require('./Order');
      const order = await Order.findOne({
        _id: this.orderId,
        userId: this.userId,
        status: 'delivered',
        'items.productId': this.productId
      });
      
      if (order) {
        this.isVerifiedPurchase = true;
      }
    } catch (error) {
      console.error('Error verifying purchase:', error);
    }
  }
  next();
});

// Post-save middleware to update product rating stats
reviewSchema.post('save', async function() {
  await updateProductRating(this.productId);
});

// Post-remove middleware to update product rating stats
reviewSchema.post('findOneAndDelete', async function() {
  if (this.productId) {
    await updateProductRating(this.productId);
  }
});

// Helper function to update product rating stats
async function updateProductRating(productId) {
  try {
    const Product = require('./Product');
    const stats = await Review.getProductRatingStats(productId);
    
    await Product.findByIdAndUpdate(productId, {
      averageRating: stats.averageRating,
      reviewCount: stats.totalReviews
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

// Static method to calculate average rating for a product
reviewSchema.statics.getProductRatingStats = async function(productId) {
    try {
        const stats = await this.aggregate([
            { $match: { productId: new Types.ObjectId(productId), status: 'approved' } },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    ratingDistribution: {
                        $push: '$rating'
                    }
                }
            }
        ]);
        
        if (stats.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
            };
        }
        
        const result = stats[0];
        
        // Calculate rating distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        result.ratingDistribution.forEach(rating => {
            distribution[rating]++;
        });
        
        return {
            averageRating: Math.round(result.averageRating * 10) / 10, // Round to 1 decimal
            totalReviews: result.totalReviews,
            ratingDistribution: distribution
        };
    } catch (error) {
        console.error('Error calculating product rating stats:', error);
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
    }
};

// Instance method to check if user found review helpful
reviewSchema.methods.isHelpfulForUser = function(userId) {
    const vote = this.helpfulVotes.find(vote => 
        vote.userId.toString() === userId.toString()
    );
    return vote ? vote.isHelpful : null;
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;