const UserInteraction = require('../models/UserInteraction');
const Product = require('../models/Product');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');

// @desc    Get personalized recommendations for user
// @route   GET /api/ai/recommendations
// @access  Private
exports.getPersonalizedRecommendations = catchAsync(async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 8 } = req.query;

        // Get user's interaction history
        const userInteractions = await UserInteraction.find({ userId })
            .populate('productId', 'category brand')
            .sort({ timestamp: -1 })
            .limit(50);

        if (userInteractions.length === 0) {
            // New user - return trending products
            return exports.getTrendingProducts(req, res);
        }

        // Analyze user preferences
        const preferences = analyzeUserPreferences(userInteractions);
        
        // Find similar products based on preferences
        const recommendations = await findRecommendedProducts(preferences, userId, limit);

        res.status(200).json({
            success: true,
            data: {
                recommendations,
                based_on: 'user_preferences',
                preference_analysis: preferences
            }
        });

    } catch (error) {
        console.error('Error getting personalized recommendations:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting recommendations: ' + error.message
        });
    }
});

// @desc    Get similar products based on a product
// @route   GET /api/ai/similar-products/:productId
// @access  Public
exports.getSimilarProducts = catchAsync(async (req, res) => {
    try {
        const { productId } = req.params;
        const { limit = 4 } = req.query;

        const product = await Product.findById(productId)
            .populate('category', 'name')
            .populate('brand', 'name');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Find similar products
        const similarProducts = await findSimilarProducts(product, limit);

        res.status(200).json({
            success: true,
            data: {
                similar_products: similarProducts,
                based_on: {
                    category: product.category?.name,
                    brand: product.brand?.name,
                    price_range: product.price
                }
            }
        });

    } catch (error) {
        console.error('Error getting similar products:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting similar products: ' + error.message
        });
    }
});

// @desc    Get trending products based on user interactions
// @route   GET /api/ai/trending-products
// @access  Public
exports.getTrendingProducts = catchAsync(async (req, res) => {
    try {
        const { limit = 8, timeframe = 7 } = req.query; // Default: last 7 days

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeframe);

        // Aggregate trending products based on interactions
        const trendingData = await UserInteraction.aggregate([
            {
                $match: {
                    timestamp: { $gte: cutoffDate },
                    productId: { $ne: null }
                }
            },
            {
                $group: {
                    _id: '$productId',
                    totalInteractions: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' },
                    viewCount: {
                        $sum: { $cond: [{ $eq: ['$eventType', 'view_product'] }, 1, 0] }
                    },
                    cartAddCount: {
                        $sum: { $cond: [{ $eq: ['$eventType', 'add_to_cart'] }, 1, 0] }
                    },
                    purchaseCount: {
                        $sum: { $cond: [{ $eq: ['$eventType', 'purchase'] }, 1, 0] }
                    }
                }
            },
            {
                $addFields: {
                    uniqueUserCount: { $size: '$uniqueUsers' },
                    trendScore: {
                        $add: [
                            { $multiply: ['$viewCount', 1] },
                            { $multiply: ['$cartAddCount', 3] },
                            { $multiply: ['$purchaseCount', 5] }
                        ]
                    }
                }
            },
            { $sort: { trendScore: -1, uniqueUserCount: -1 } },
            { $limit: parseInt(limit) * 2 } // Get more to filter available products
        ]);

        // Get product details
        const productIds = trendingData.map(item => item._id);
        const products = await Product.find({
            _id: { $in: productIds },
            isActive: true
        })
        .populate('category', 'name')
        .populate('brand', 'name')
        .populate('shopId', 'shopName')
        .limit(parseInt(limit));

        // Combine with trending data
        const trendingProducts = products.map(product => {
            const trendData = trendingData.find(item => 
                item._id.toString() === product._id.toString()
            );
            
            return {
                ...product.toObject(),
                trending_stats: {
                    total_interactions: trendData?.totalInteractions || 0,
                    unique_users: trendData?.uniqueUserCount || 0,
                    trend_score: trendData?.trendScore || 0,
                    view_count: trendData?.viewCount || 0,
                    cart_add_count: trendData?.cartAddCount || 0,
                    purchase_count: trendData?.purchaseCount || 0
                }
            };
        });

        res.status(200).json({
            success: true,
            data: {
                trending_products: trendingProducts,
                timeframe_days: timeframe,
                total_found: trendingProducts.length
            }
        });

    } catch (error) {
        console.error('Error getting trending products:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting trending products: ' + error.message
        });
    }
});

// @desc    Get AI-powered search suggestions
// @route   GET /api/ai/search-suggestions
// @access  Public
exports.getSearchSuggestions = catchAsync(async (req, res) => {
    try {
        const { query, limit = 5 } = req.query;

        if (!query || query.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Query must be at least 2 characters long'
            });
        }

        // Get popular search terms from user interactions
        const popularSearches = await UserInteraction.aggregate([
            {
                $match: {
                    eventType: 'search',
                    searchQuery: { $regex: query, $options: 'i' }
                }
            },
            {
                $group: {
                    _id: '$searchQuery',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: parseInt(limit) }
        ]);

        // Get product name suggestions
        const productSuggestions = await Product.find({
            name: { $regex: query, $options: 'i' },
            isActive: true
        })
        .select('name category')
        .populate('category', 'name')
        .limit(parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                search_suggestions: popularSearches.map(item => item._id),
                product_suggestions: productSuggestions.map(p => ({
                    name: p.name,
                    category: p.category?.name
                }))
            }
        });

    } catch (error) {
        console.error('Error getting search suggestions:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting search suggestions: ' + error.message
        });
    }
});

// Helper Functions

function analyzeUserPreferences(interactions) {
    const preferences = {
        categories: {},
        brands: {},
        priceRange: { min: Infinity, max: 0 },
        eventWeights: { view_product: 1, add_to_cart: 3, purchase: 5 }
    };

    interactions.forEach(interaction => {
        const weight = preferences.eventWeights[interaction.eventType] || 1;
        
        if (interaction.productId) {
            // Category preferences
            const categoryId = interaction.productId.category;
            if (categoryId) {
                preferences.categories[categoryId] = (preferences.categories[categoryId] || 0) + weight;
            }

            // Brand preferences
            const brandId = interaction.productId.brand;
            if (brandId) {
                preferences.brands[brandId] = (preferences.brands[brandId] || 0) + weight;
            }
        }
    });

    return preferences;
}

async function findRecommendedProducts(preferences, userId, limit) {
    // Build query based on preferences
    let query = { isActive: true };
    
    const topCategories = Object.keys(preferences.categories)
        .sort((a, b) => preferences.categories[b] - preferences.categories[a])
        .slice(0, 3);
    
    const topBrands = Object.keys(preferences.brands)
        .sort((a, b) => preferences.brands[b] - preferences.brands[a])
        .slice(0, 3);

    if (topCategories.length > 0 || topBrands.length > 0) {
        query.$or = [];
        
        if (topCategories.length > 0) {
            query.$or.push({ category: { $in: topCategories } });
        }
        
        if (topBrands.length > 0) {
            query.$or.push({ brand: { $in: topBrands } });
        }
    }

    // Exclude products user has already interacted with recently
    const recentInteractions = await UserInteraction.find({ userId })
        .sort({ timestamp: -1 })
        .limit(20)
        .select('productId');
    
    const excludeProducts = recentInteractions.map(i => i.productId).filter(Boolean);
    if (excludeProducts.length > 0) {
        query._id = { $nin: excludeProducts };
    }

    const products = await Product.find(query)
        .populate('category', 'name')
        .populate('brand', 'name')
        .populate('shopId', 'shopName')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit) * 2);

    // Simple scoring algorithm
    return products.slice(0, limit).map(product => ({
        ...product.toObject(),
        recommendation_score: calculateRecommendationScore(product, preferences)
    }));
}

async function findSimilarProducts(targetProduct, limit) {
    const query = {
        _id: { $ne: targetProduct._id },
        isActive: true,
        $or: [
            { category: targetProduct.category },
            { brand: targetProduct.brand },
            { 
                price: {
                    $gte: targetProduct.price * 0.7,
                    $lte: targetProduct.price * 1.3
                }
            }
        ]
    };

    const similarProducts = await Product.find(query)
        .populate('category', 'name')
        .populate('brand', 'name')
        .populate('shopId', 'shopName')
        .limit(parseInt(limit) * 2);

    // Score and sort by similarity
    return similarProducts
        .map(product => ({
            ...product.toObject(),
            similarity_score: calculateSimilarityScore(targetProduct, product)
        }))
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, limit);
}

function calculateRecommendationScore(product, preferences) {
    let score = 0;
    
    // Category match
    if (preferences.categories[product.category]) {
        score += preferences.categories[product.category] * 0.4;
    }
    
    // Brand match
    if (preferences.brands[product.brand]) {
        score += preferences.brands[product.brand] * 0.3;
    }
    
    // Recency boost
    const daysSinceCreated = (Date.now() - product.createdAt) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - daysSinceCreated) * 0.1;
    
    return Math.round(score * 100) / 100;
}

function calculateSimilarityScore(productA, productB) {
    let score = 0;
    
    // Same category
    if (productA.category?.toString() === productB.category?.toString()) {
        score += 40;
    }
    
    // Same brand
    if (productA.brand?.toString() === productB.brand?.toString()) {
        score += 30;
    }
    
    // Price similarity
    const priceDiff = Math.abs(productA.price - productB.price);
    const priceAvg = (productA.price + productB.price) / 2;
    const priceScore = Math.max(0, 30 - (priceDiff / priceAvg) * 100);
    score += priceScore;
    
    return Math.round(score * 100) / 100;
}

module.exports = {
    getPersonalizedRecommendations: exports.getPersonalizedRecommendations,
    getSimilarProducts: exports.getSimilarProducts,
    getTrendingProducts: exports.getTrendingProducts,
    getSearchSuggestions: exports.getSearchSuggestions
}; 