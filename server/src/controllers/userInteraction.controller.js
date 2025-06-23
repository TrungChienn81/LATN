const UserInteraction = require('../models/UserInteraction');
const catchAsync = require('../utils/catchAsync');

// @desc    Log user behavior (view, click, add_to_cart, purchase, search)
// @route   POST /api/user-behaviors
// @access  Private (Authenticated users) / Public (Guest sessions)
exports.logUserBehavior = catchAsync(async (req, res) => {
    try {
        const { action, productId, metadata = {} } = req.body;
        const userId = req.user ? req.user._id : null;
        const sessionId = req.sessionID || req.headers['x-session-id'] || null;

        // Validate required fields
        if (!action) {
            return res.status(400).json({
                success: false,
                message: 'Action is required'
            });
        }

        // Map actions to eventType enum
        const eventTypeMap = {
            'view': 'view_product',
            'click': 'view_product',
            'add_to_cart': 'add_to_cart',
            'remove_from_cart': 'remove_from_cart',
            'purchase': 'purchase',
            'search': 'search'
        };

        const eventType = eventTypeMap[action] || action;

        // Create interaction data
        const interactionData = {
            userId,
            sessionId,
            eventType,
            productId: productId || null,
            searchQuery: metadata.searchQuery || null,
            context: {
                device: req.headers['user-agent'] ? 'web' : 'unknown',
                ipAddress: req.ip || req.connection.remoteAddress,
                userAgent: req.headers['user-agent'],
                ...metadata.context
            },
            timestamp: new Date()
        };

        // Save interaction
        const interaction = await UserInteraction.create(interactionData);

        // Don't send full interaction data back for performance
        res.status(201).json({
            success: true,
            message: 'User behavior logged successfully',
            data: {
                id: interaction._id,
                eventType: interaction.eventType,
                timestamp: interaction.timestamp
            }
        });

    } catch (error) {
        console.error('Error logging user behavior:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging user behavior: ' + error.message
        });
    }
});

// @desc    Get user interaction history (for analysis)
// @route   GET /api/user-behaviors/my-history
// @access  Private
exports.getUserInteractionHistory = catchAsync(async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 50, page = 1, eventType } = req.query;

        const query = { userId };
        if (eventType) {
            query.eventType = eventType;
        }

        const interactions = await UserInteraction.find(query)
            .populate('productId', 'name images price category')
            .sort({ timestamp: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await UserInteraction.countDocuments(query);

        res.status(200).json({
            success: true,
            data: interactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching user interaction history:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching interaction history: ' + error.message
        });
    }
});

// @desc    Get aggregated user behavior stats (for admin dashboard)
// @route   GET /api/user-behaviors/stats
// @access  Private (Admin)
exports.getUserBehaviorStats = catchAsync(async (req, res) => {
    try {
        const { startDate, endDate, timeframe = 'day' } = req.query;

        let matchStage = {};
        if (startDate || endDate) {
            matchStage.timestamp = {};
            if (startDate) matchStage.timestamp.$gte = new Date(startDate);
            if (endDate) matchStage.timestamp.$lte = new Date(endDate);
        }

        // Aggregate by event type
        const eventTypeStats = await UserInteraction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$eventType',
                    count: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' },
                    uniqueSessions: { $addToSet: '$sessionId' }
                }
            },
            {
                $project: {
                    eventType: '$_id',
                    count: 1,
                    uniqueUsers: { $size: '$uniqueUsers' },
                    uniqueSessions: { $size: '$uniqueSessions' }
                }
            }
        ]);

        // Top products by interactions
        const topProducts = await UserInteraction.aggregate([
            { $match: { ...matchStage, productId: { $ne: null } } },
            {
                $group: {
                    _id: '$productId',
                    totalInteractions: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$userId' },
                    viewCount: {
                        $sum: {
                            $cond: [{ $eq: ['$eventType', 'view_product'] }, 1, 0]
                        }
                    },
                    cartAddCount: {
                        $sum: {
                            $cond: [{ $eq: ['$eventType', 'add_to_cart'] }, 1, 0]
                        }
                    },
                    purchaseCount: {
                        $sum: {
                            $cond: [{ $eq: ['$eventType', 'purchase'] }, 1, 0]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    productId: '$_id',
                    productName: '$product.name',
                    totalInteractions: 1,
                    uniqueUsers: { $size: '$uniqueUsers' },
                    viewCount: 1,
                    cartAddCount: 1,
                    purchaseCount: 1,
                    conversionRate: {
                        $cond: [
                            { $gt: ['$viewCount', 0] },
                            { $divide: ['$purchaseCount', '$viewCount'] },
                            0
                        ]
                    }
                }
            },
            { $sort: { totalInteractions: -1 } },
            { $limit: 10 }
        ]);

        res.status(200).json({
            success: true,
            data: {
                eventTypeStats,
                topProducts,
                summary: {
                    totalInteractions: eventTypeStats.reduce((sum, stat) => sum + stat.count, 0),
                    totalUniqueUsers: new Set(eventTypeStats.flatMap(stat => stat.uniqueUsers)).size
                }
            }
        });

    } catch (error) {
        console.error('Error fetching user behavior stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching behavior stats: ' + error.message
        });
    }
});

// @desc    Generate user embedding based on interactions (for AI model)
// @route   POST /api/user-behaviors/generate-embedding/:userId
// @access  Private (Admin)
exports.generateUserEmbedding = catchAsync(async (req, res) => {
    try {
        const { userId } = req.params;

        // Get user interactions
        const interactions = await UserInteraction.find({ userId })
            .populate('productId', 'category brand price')
            .sort({ timestamp: -1 })
            .limit(100); // Last 100 interactions

        if (interactions.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No interactions found for this user'
            });
        }

        // Simple embedding generation (can be enhanced with ML models)
        const embedding = generateSimpleUserEmbedding(interactions);

        // Update user embedding in User model
        const User = require('../models/User');
        await User.findByIdAndUpdate(userId, { userEmbedding: embedding });

        res.status(200).json({
            success: true,
            message: 'User embedding generated successfully',
            data: {
                userId,
                embedding,
                interactionCount: interactions.length
            }
        });

    } catch (error) {
        console.error('Error generating user embedding:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating user embedding: ' + error.message
        });
    }
});

// Helper function to generate simple user embedding
function generateSimpleUserEmbedding(interactions) {
    // Simple feature extraction for demonstration
    // In production, this would be replaced with proper ML embedding
    
    const features = {
        viewCount: 0,
        cartAddCount: 0,
        purchaseCount: 0,
        categoryPreferences: {},
        brandPreferences: {},
        priceRange: { min: Infinity, max: 0 },
        sessionFrequency: 0
    };

    interactions.forEach(interaction => {
        switch (interaction.eventType) {
            case 'view_product':
                features.viewCount++;
                break;
            case 'add_to_cart':
                features.cartAddCount++;
                break;
            case 'purchase':
                features.purchaseCount++;
                break;
        }

        if (interaction.productId) {
            // Category preferences
            const category = interaction.productId.category;
            if (category) {
                features.categoryPreferences[category] = (features.categoryPreferences[category] || 0) + 1;
            }

            // Brand preferences
            const brand = interaction.productId.brand;
            if (brand) {
                features.brandPreferences[brand] = (features.brandPreferences[brand] || 0) + 1;
            }

            // Price range
            const price = interaction.productId.price;
            if (price) {
                features.priceRange.min = Math.min(features.priceRange.min, price);
                features.priceRange.max = Math.max(features.priceRange.max, price);
            }
        }
    });

    // Convert to normalized embedding vector (64 dimensions)
    const embedding = [
        features.viewCount / interactions.length,
        features.cartAddCount / interactions.length,
        features.purchaseCount / interactions.length,
        features.purchaseCount / Math.max(features.viewCount, 1), // Conversion rate
        ...Object.values(features.categoryPreferences).slice(0, 20).map(count => count / interactions.length),
        ...Object.values(features.brandPreferences).slice(0, 20).map(count => count / interactions.length),
        features.priceRange.min / 100, // Normalized price
        features.priceRange.max / 100,
        ...Array(20 - Object.keys(features.categoryPreferences).length).fill(0),
        ...Array(20 - Object.keys(features.brandPreferences).length).fill(0)
    ].slice(0, 64); // Ensure exactly 64 dimensions

    // Pad with zeros if needed
    while (embedding.length < 64) {
        embedding.push(0);
    }

    return embedding;
} 