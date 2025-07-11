const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const ChatSession = require('../models/ChatSession');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const catchAsync = require('../utils/catchAsync');
const { v4: uuidv4 } = require('uuid');
const productInfoPatterns = require('../prompts/product_info_patterns');

// Token counting for cost monitoring
let totalTokensUsed = 0;
let totalCost = 0;
const TOKEN_COSTS = {
    'gpt-4o-mini': {
        input: 0.00000015,  // $0.150 per 1M tokens
        output: 0.0000006   // $0.600 per 1M tokens
    }
};

// Initialize OpenAI Chat Model - OPTIMIZED FOR COST EFFICIENCY
const chatModel = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
    modelName: 'gpt-4o-mini', // Cheapest model! $0.150/1M input, $0.600/1M output tokens
    temperature: 0.3, // Lower temperature = more focused, less tokens
    maxTokens: 150, // Reduced from 500 to save costs
    streaming: false // Disable streaming to control token usage
});

// RAG Prompt Template - OPTIMIZED FOR ACCURATE PRODUCT INFO
const RAG_PROMPT = PromptTemplate.fromTemplate(`
Bạn là AI assistant chuyên tư vấn laptop/PC. Trả lời dựa trên dữ liệu sản phẩm thật.

DANH SÁCH SẢN PHẨM CÓ SẴN:
{context}

LỊCH SỬ CHAT: {chat_history}
CÂU HỎI: {question}

HƯỚNG DẪN:
- Nếu hỏi về giá, trả lời chính xác theo dữ liệu (VD: "32.490.000đ")
- Nếu hỏi sản phẩm cụ thể, tìm trong danh sách và mô tả chi tiết
- Nếu không tìm thấy, thông báo "Không có sản phẩm này" và đề xuất sản phẩm tương tự
- Trả lời ngắn gọn, chính xác, có giá cụ thể

TRẢ LỜI:
`);

// Function to count tokens and calculate cost
function countTokensAndCost(inputText, outputText) {
    // Rough estimation: 1 token ≈ 4 characters for Vietnamese
    const inputTokens = Math.ceil(inputText.length / 4);
    const outputTokens = Math.ceil(outputText.length / 4);
    
    const costs = TOKEN_COSTS['gpt-4o-mini'];
    const inputCost = inputTokens * costs.input;
    const outputCost = outputTokens * costs.output;
    const totalCostForRequest = inputCost + outputCost;
    
    totalTokensUsed += (inputTokens + outputTokens);
    totalCost += totalCostForRequest;
    
    return {
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        inputCost,
        outputCost,
        requestCost: totalCostForRequest,
        totalCostSoFar: totalCost,
        remainingBudget: 5.0 - totalCost
    };
}

// Get cost statistics
function getCostStats() {
    return {
        totalTokensUsed,
        totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimal places
        remainingBudget: Math.round((5.0 - totalCost) * 10000) / 10000,
        estimatedQueriesLeft: Math.round((5.0 - totalCost) / (totalCost / (totalTokensUsed > 0 ? 1 : 1)))
    };
}

// @desc    Create or get chat session
// @route   POST /api/chat/session
// @access  Public
exports.createChatSession = catchAsync(async (req, res) => {
    try {
        const { userId } = req.body;
        const sessionId = uuidv4();

        const chatSession = new ChatSession({
            userId: userId || null,
            sessionId,
            status: 'active'
        });

        await chatSession.save();

        res.status(201).json({
            success: true,
            data: {
                sessionId,
                message: 'Xin chào! Tôi là AI assistant. Tôi có thể giúp bạn tìm laptop hoặc PC phù hợp. Bạn đang tìm kiếm gì?'
            }
        });

    } catch (error) {
        console.error('Error creating chat session:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo phiên chat: ' + error.message
        });
    }
});

// @desc    Send message and get AI response
// @route   POST /api/chat/message
// @access  Public
exports.sendMessage = catchAsync(async (req, res) => {
    try {
        const { sessionId, message, userId } = req.body;
        const openAIApiKey = req.headers['x-openai-api-key'] || process.env.OPENAI_API_KEY;
        if (!sessionId || !message) {
            return res.status(400).json({
                success: false,
                message: 'SessionId và message là bắt buộc'
            });
        }

        // Find chat session
        let chatSession = await ChatSession.findOne({ sessionId });
        if (!chatSession) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiên chat'
            });
        }

        // Add user message to session
        chatSession.messages.push({
            sender: 'user',
            text: message,
            timestamp: new Date()
        });

        // Get relevant context using RAG
        const context = await getRelevantContext(message);
        
        // Get chat history for context
        const chatHistory = formatChatHistory(chatSession.messages.slice(-6)); // Last 6 messages

        // Check budget before making API call
        const currentStats = getCostStats();
        if (currentStats.remainingBudget <= 0.10) { // Stop if less than $0.10 remaining
            return res.status(429).json({
                success: false,
                message: 'Ngân sách OpenAI đã hết! Vui lòng nạp thêm tiền.',
                costInfo: currentStats
            });
        }

        // Generate AI response using RAG, truyền key động
        const aiResponse = await generateRAGResponse(message, context, chatHistory, openAIApiKey);

        // Calculate cost for this request
        const fullInputText = `${JSON.stringify(context)}${chatHistory}${message}`;
        const costInfo = countTokensAndCost(fullInputText, aiResponse);

        // Add AI response to session
        chatSession.messages.push({
            sender: 'bot',
            text: aiResponse,
            timestamp: new Date(),
            metadata: { 
                context_used: context.length > 0,
                cost_info: costInfo
            }
        });

        await chatSession.save();

        // Log cost information
        console.log(`💰 Cost Info - Request: $${costInfo.requestCost.toFixed(6)}, Total: $${costInfo.totalCostSoFar.toFixed(4)}, Remaining: $${costInfo.remainingBudget.toFixed(4)}`);

        res.status(200).json({
            success: true,
            data: {
                message: aiResponse,
                sessionId,
                context_products: context.slice(0, 3), // Return top 3 relevant products
                costInfo: {
                    requestCost: Math.round(costInfo.requestCost * 1000000) / 1000000, // Round to 6 decimals
                    totalCost: Math.round(costInfo.totalCostSoFar * 10000) / 10000,
                    remainingBudget: Math.round(costInfo.remainingBudget * 10000) / 10000,
                    tokensUsed: costInfo.totalTokens
                }
            }
        });

    } catch (error) {
        console.error('Error processing message:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi xử lý tin nhắn: ' + error.message
        });
    }
});

// @desc    Get chat history
// @route   GET /api/chat/history/:sessionId
// @access  Public
exports.getChatHistory = catchAsync(async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { limit = 50 } = req.query;

        const chatSession = await ChatSession.findOne({ sessionId });
        if (!chatSession) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiên chat'
            });
        }

        const messages = chatSession.messages
            .slice(-parseInt(limit))
            .map(msg => ({
                sender: msg.sender,
                text: msg.text,
                timestamp: msg.timestamp
            }));

        res.status(200).json({
            success: true,
            data: {
                sessionId,
                messages,
                status: chatSession.status
            }
        });

    } catch (error) {
        console.error('Error getting chat history:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi lấy lịch sử chat: ' + error.message
        });
    }
});

// @desc    End chat session
// @route   PUT /api/chat/session/:sessionId/end
// @access  Public
exports.endChatSession = catchAsync(async (req, res) => {
    try {
        const { sessionId } = req.params;

        const chatSession = await ChatSession.findOneAndUpdate(
            { sessionId },
            { 
                status: 'closed',
                endTime: new Date()
            },
            { new: true }
        );

        if (!chatSession) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy phiên chat'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Đã kết thúc phiên chat'
        });

    } catch (error) {
        console.error('Error ending chat session:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi kết thúc phiên chat: ' + error.message
        });
    }
});

// @desc    Get cost statistics
// @route   GET /api/chat/cost-stats
// @access  Public
exports.getCostStatistics = catchAsync(async (req, res) => {
    const stats = getCostStats();
    
    res.status(200).json({
        success: true,
        data: {
            ...stats,
            budget: 5.0,
            warningThreshold: 4.0, // Alert when $4 spent
            stopThreshold: 4.9,   // Stop when $4.90 spent
            costBreakdown: {
                perRequest: stats.totalCost / Math.max(1, totalTokensUsed / 100), // Rough estimate
                perToken: TOKEN_COSTS['gpt-4o-mini']
            },
            tips: [
                "Sử dụng câu hỏi ngắn gọn để tiết kiệm token",
                "Tránh hỏi lại những thông tin đã có",
                "Model GPT-4o-mini rẻ nhất hiện tại",
                "Mỗi tin nhắn khoảng $0.001-0.005"
            ]
        }
    });
});

// @desc    Reset cost counter (for testing)
// @route   POST /api/chat/reset-costs
// @access  Public
exports.resetCosts = catchAsync(async (req, res) => {
    totalTokensUsed = 0;
    totalCost = 0;
    
    res.status(200).json({
        success: true,
        message: 'Đã reset bộ đếm chi phí'
    });
});

// Helper Functions

async function getRelevantContext(query) {
    try {
        console.log('🔍 RAG Search Query:', query);
        
        // Enhanced keyword extraction
        const keywords = extractKeywords(query);
        const queryLower = query.toLowerCase();
        
        // Extract specific product names, models, and codes
        const productIdentifiers = extractProductIdentifiers(query);
        
        console.log('🎯 Extracted keywords:', keywords);
        console.log('🏷️ Product identifiers:', productIdentifiers);
        
        let allProducts = [];
        
        // PRIORITY 1: Exact model code search (96HG, 99Y8, etc.)
        const modelCodes = productIdentifiers.filter(id => /^[A-Z0-9]{4}$/.test(id));
        for (const code of modelCodes) {
            console.log(`🎯 Searching for exact model code: ${code}`);
            const exactMatches = await Product.find({
                name: new RegExp(`\\b${code}\\b`, 'i') // Word boundary for exact match
            })
            .populate('category', 'name')
            .populate('brand', 'name')
            .populate('shopId', 'shopName');
            
            if (exactMatches.length > 0) {
                console.log(`✅ Found ${exactMatches.length} exact model code matches for: ${code}`);
                // Score exact matches highest
                const scoredMatches = exactMatches.map(p => ({
                    ...p.toObject(),
                    _matchScore: 100, // Highest priority
                    _matchReason: `Exact model code: ${code}`
                }));
                allProducts.push(...scoredMatches);
            }
        }
        
        // PRIORITY 2: Full product name search with model codes
        const fullProductNames = productIdentifiers.filter(id => 
            id.includes('Acer Predator') || id.includes('PHN14')
        );
        for (const productName of fullProductNames) {
            console.log(`🎯 Searching for full product name: ${productName}`);
            const nameMatches = await Product.find({
                name: new RegExp(productName.replace(/\s+/g, '\\s+'), 'i')
            })
            .populate('category', 'name')
            .populate('brand', 'name')
            .populate('shopId', 'shopName');
            
            if (nameMatches.length > 0) {
                console.log(`✅ Found ${nameMatches.length} full name matches`);
                const scoredMatches = nameMatches.map(p => ({
                    ...p.toObject(),
                    _matchScore: 90, // Second highest priority
                    _matchReason: `Full product name: ${productName}`
                }));
                allProducts.push(...scoredMatches);
            }
        }
        
        // PRIORITY 3: General identifier search
        const otherIdentifiers = productIdentifiers.filter(id => 
            !modelCodes.includes(id) && !fullProductNames.includes(id)
        );
        for (const identifier of otherIdentifiers) {
            const generalMatches = await Product.find({
                $or: [
                    { name: new RegExp(identifier, 'i') },
                    { description: new RegExp(identifier, 'i') }
                ]
            })
            .populate('category', 'name')
            .populate('brand', 'name')
            .populate('shopId', 'shopName')
            .limit(5);
            
            if (generalMatches.length > 0) {
                const scoredMatches = generalMatches.map(p => ({
                    ...p.toObject(),
                    _matchScore: 70, // Lower priority
                    _matchReason: `General match: ${identifier}`
                }));
                allProducts.push(...scoredMatches);
            }
        }
        
        // Remove duplicates and sort by match score
        const uniqueProducts = [];
        const seenIds = new Set();
        
        for (const product of allProducts) {
            const productId = product._id.toString();
            if (!seenIds.has(productId)) {
                seenIds.add(productId);
                uniqueProducts.push(product);
            }
        }
        
        // Sort by match score (highest first)
        uniqueProducts.sort((a, b) => (b._matchScore || 0) - (a._matchScore || 0));
            
        if (uniqueProducts.length > 0) {
            console.log(`🎉 RAG found ${uniqueProducts.length} relevant products:`);
            uniqueProducts.slice(0, 3).forEach(p => {
                console.log(`  - ${p.name} (Score: ${p._matchScore}, Reason: ${p._matchReason})`);
            });
            return uniqueProducts.slice(0, 5);
        }
        
        // Nếu query chứa 'giá bao nhiêu', 'giá', 'mua ở đâu', ... thì tách tên sản phẩm phía trước để tìm
        const priceKeywords = ['giá bao nhiêu', 'giá', 'mua ở đâu', 'có tốt không', 'có không', 'ở đâu', 'có hàng không'];
        let productNamePart = query;
        for (const kw of priceKeywords) {
            const idx = queryLower.indexOf(kw);
            if (idx > 0) {
                productNamePart = query.substring(0, idx).trim();
                break;
            }
        }
        if (productNamePart !== query) {
            console.log('🔍 Trying to search by product name part:', productNamePart);
            const nameMatches = await Product.find({
                name: { $regex: productNamePart, $options: 'i' }
            })
            .populate('category', 'name')
            .populate('brand', 'name')
            .populate({
                path: 'shopId',
                select: 'shopName ownerId status rating',
                populate: {
                    path: 'ownerId',
                    select: 'firstName lastName name username email',
                    model: 'User'
                }
            });
            if (nameMatches.length > 0) {
                console.log(`✅ Found ${nameMatches.length} products by product name part`);
                return nameMatches.slice(0, 5);
            }
        }
        // Nếu vẫn không tìm thấy, thử tìm theo tên sản phẩm đầy đủ (không phân biệt hoa thường)
        console.log('🔄 No identifier matches, trying full product name search...');
        const nameMatches = await Product.find({
            name: { $regex: query.trim(), $options: 'i' }
        })
        .populate('category', 'name')
        .populate('brand', 'name')
        .populate({
            path: 'shopId',
            select: 'shopName ownerId status rating',
            populate: {
                path: 'ownerId',
                select: 'firstName lastName name username email',
                model: 'User'
            }
        });
        if (nameMatches.length > 0) {
            console.log(`✅ Found ${nameMatches.length} products by full name search`);
            return nameMatches.slice(0, 5);
        }
        // Fallback: If no specific products found, return trending
            console.log('🔄 No specific matches, returning trending products');
            return await Product.find({})
                .populate('category', 'name')
                .populate('brand', 'name')
                .populate({
                    path: 'shopId',
                    select: 'shopName ownerId status rating',
                    populate: {
                        path: 'ownerId',
                        select: 'firstName lastName name username email',
                        model: 'User'
                    }
                })
                .sort({ createdAt: -1 })
                .limit(5);

        // Check for special info prompt (card, cpu, ram, etc.)
        for (const pattern of productInfoPatterns) {
            if (pattern.keywords.some(kw => queryLower.includes(kw))) {
                // Tìm sản phẩm theo tên như logic cũ
                const nameMatches = await Product.find({
                    name: { $regex: query.trim().replace(/[^\w\s\-]/gi, ''), $options: 'i' }
                })
                .populate('category', 'name')
                .populate('brand', 'name')
                .populate({
                    path: 'shopId',
                    select: 'shopName ownerId status rating',
                    populate: {
                        path: 'ownerId',
                        select: 'firstName lastName name username email',
                        model: 'User'
                    }
                });
                if (nameMatches.length > 0) {
                    // Ưu tiên trả về context chỉ chứa thông số đặc biệt
                    const product = nameMatches[0];
                    let info = '';
                    // Ưu tiên lấy từ description, nếu có specifications thì lấy cả ở đó
                    if (product.description) {
                        const match = product.description.match(pattern.regex);
                        if (match) info = match[0];
                    }
                    if (!info && product.specifications) {
                        const specStr = JSON.stringify(product.specifications);
                        const match = specStr.match(pattern.regex);
                        if (match) info = match[0];
                    }
                    // Nếu tìm thấy thông số, trả về context chỉ chứa thông số đó
                    if (info) {
                        return [{
                            ...product.toObject(),
                            _specialInfo: `${pattern.label}: ${info}`
                        }];
                    }
                    // Nếu không tìm thấy, trả về context đầy đủ như cũ
                    return nameMatches.slice(0, 5);
                }
            }
        }

    } catch (error) {
        console.error('Error getting relevant context:', error);
        return [];
    }
}

// Extract specific product identifiers (model numbers, SKUs, etc.)
function extractProductIdentifiers(query) {
    const identifiers = [];
    
    // Pattern for Acer Predator specific models (PRIORITY)
    const acerPredatorPattern = /(Laptop\s+gaming\s+Acer\s+Predator\s+Helios\s+Neo\s+14\s+PHN14\s+51\s+[A-Z0-9]+)/gi;
    const acerPredator = query.match(acerPredatorPattern);
    if (acerPredator) {
        identifiers.push(...acerPredator);
        console.log('🎯 Found exact Acer Predator model:', acerPredator);
    }
    
    // Pattern for specific end codes (96HG, 99Y8, etc.) - HIGH PRIORITY
    const endCodePattern = /\b([A-Z0-9]{4})\b(?=\s|$)/g;
    const endCodes = query.match(endCodePattern);
    if (endCodes) {
        identifiers.push(...endCodes);
        console.log('🎯 Found specific model codes:', endCodes);
    }
    
    // Pattern for exact product names: "MSI Alpha 15 B5EEK 203VN"
    const fullNamePattern = /(MSI\s+Alpha\s+15\s+B5EEK\s+203VN)/gi;
    const fullName = query.match(fullNamePattern);
    if (fullName) {
        identifiers.push(...fullName);
    }
    
    // Pattern for brand + series: "MSI Alpha 15"
    const brandSeriesPattern = /(MSI\s+Alpha\s+15)|(ASUS\s+TUF\s+Gaming)|(Dell\s+Inspiron)|(Acer\s+Predator\s+Helios\s+Neo\s+14)/gi;
    const brandSeries = query.match(brandSeriesPattern);
    if (brandSeries) {
        identifiers.push(...brandSeries);
    }
    
    // Pattern for PHN14 series specifically
    const phn14Pattern = /(PHN14\s+51\s+[A-Z0-9]+)/gi;
    const phn14 = query.match(phn14Pattern);
    if (phn14) {
        identifiers.push(...phn14);
        console.log('🎯 Found PHN14 series:', phn14);
    }
    
    // Pattern for common laptop names
    const laptopPattern = /(Alpha\s+15|TUF\s+Gaming|Inspiron\s+15|GF63\s+Thin|VivoBook\s+15|Predator\s+Helios\s+Neo)/gi;
    const laptopNames = query.match(laptopPattern);
    if (laptopNames) {
        identifiers.push(...laptopNames);
    }
    
    console.log('🔍 Product identifiers extracted:', identifiers);
    return [...new Set(identifiers)]; // Remove duplicates
}

// Extract brand + model combinations
function extractBrandModelCombos(query) {
    const combos = [];
    const brands = ['MSI', 'ASUS', 'Dell', 'HP', 'Lenovo', 'Acer', 'Apple', 'Gigabyte'];
    
    for (const brand of brands) {
        const brandRegex = new RegExp(`\\b${brand}\\b.*?(?=\\b(?:${brands.join('|')})\\b|$)`, 'i');
        const match = query.match(brandRegex);
        
        if (match) {
            const fullMatch = match[0];
            const modelPart = fullMatch.replace(new RegExp(brand, 'i'), '').trim();
            
            if (modelPart.length > 2) {
                combos.push({
                    brand: brand,
                    model: modelPart
                });
            }
        }
    }
    
    return combos;
}

function extractKeywords(text) {
    // Vietnamese laptop/PC related keywords + brands + models
    const techKeywords = [
        'laptop', 'máy tính', 'pc', 'gaming', 'văn phòng', 'học tập',
        'intel', 'amd', 'nvidia', 'rtx', 'gtx', 'core i3', 'core i5', 'core i7',
        'ryzen', 'ram', 'ssd', 'hdd', 'màn hình', 'keyboard', 'chuột',
        'asus', 'dell', 'hp', 'lenovo', 'acer', 'msi', 'gigabyte', 'apple',
        'giá rẻ', 'tốt nhất', 'khuyến mãi', 'mới nhất',
        'alpha', 'inspiron', 'thinkpad', 'pavilion', 'predator', 'tuf',
        'giá', 'bao nhiêu', 'tiền', 'cost', 'price'
    ];

    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 1); // Reduced from 2 to 1 to catch more keywords

    // Add original case-sensitive words for model numbers
    const originalWords = text.split(/\s+/).filter(word => word.length > 1);
    
    const relevantWords = words.filter(word => 
        techKeywords.some(keyword => 
            keyword.includes(word) || word.includes(keyword)
        )
    );
    
    // Add potential model numbers (alphanumeric combinations)
    const modelNumbers = originalWords.filter(word => 
        /^[A-Z0-9]+$/i.test(word) && word.length >= 3
    );
    
    return [...new Set([...relevantWords, ...modelNumbers])];
}

function formatChatHistory(messages) {
    return messages
        .slice(-6) // Last 6 messages for context
        .map(msg => `${msg.sender === 'user' ? 'Khách hàng' : 'AI'}: ${msg.text}`)
        .join('\n');
}

// Format product context for AI with detailed information
function formatProductContext(products) {
    if (!products || products.length === 0) {
        return "Không có sản phẩm nào phù hợp trong cơ sở dữ liệu.";
    }
    // Nếu có _specialInfo thì trả về thông tin đó ưu tiên
    if (products[0]._specialInfo) {
        return products[0]._specialInfo;
    }
    
    return products.map((product, index) => {
        let brandName = product.brand?.name;
        if (!brandName && product.name) {
            brandName = extractBrandFromProductName(product.name);
        }
        if (!brandName) {
            brandName = 'Chưa xác định thương hiệu';
        }
        const categoryName = product.category?.name || 'Không rõ danh mục';
        const shopName = product.shopId?.shopName || 'Không rõ cửa hàng';
        const shopOwnerName = product.shopId?.ownerId ?
            ((product.shopId.ownerId.firstName || '') + ' ' + (product.shopId.ownerId.lastName || '')).trim() ||
            product.shopId.ownerId.name ||
            product.shopId.ownerId.username ||
            product.shopId.ownerId.email ||
            'Không rõ chủ shop'
            : 'Không rõ chủ shop';
        const price = product.price ? `${(product.price * 1000000).toLocaleString('vi-VN')}đ` : 'Liên hệ';
        const stock = typeof product.stockQuantity === 'number' ? product.stockQuantity : (product.stock || 0);
        const stockStatus = stock > 0 ? `Còn ${stock} sản phẩm` : 'Đã hết hàng';
        const shopDisplay = stock > 0 ? `${shopName} (Còn ${stock} sản phẩm)` : `${shopName} (Đã hết hàng)`;
        return `${index + 1}. TÊN: ${product.name}
   THƯƠNG HIỆU: ${brandName}
   DANH MỤC: ${categoryName}
   GIÁ: ${price}
   SHOP: ${shopDisplay}
   CHỦ SHOP: ${shopOwnerName}
   MÔ TẢ: ${product.description || 'Không có mô tả'}
   ---`;
    }).join('\n');
}

// Extract brand from product name as fallback
function extractBrandFromProductName(productName) {
    if (!productName) return null;
    
    const knownBrands = [
        'MSI', 'ASUS', 'Dell', 'HP', 'Lenovo', 'Acer', 'Apple', 'Samsung', 'LG', 
        'Gigabyte', 'Intel', 'AMD', 'NVIDIA', 'Corsair', 'Kingston', 'Crucial',
        'Western Digital', 'Seagate', 'Logitech', 'Razer', 'SteelSeries', 'HyperX',
        'Cooler Master', 'Thermaltake', 'ASRock', 'EVGA', 'Zotac', 'ViewSonic',
        'BenQ', 'Philips', 'AOC', 'Alienware'
    ];
    
    // Convert to words and check each word
    const words = productName.split(/\s+/);
    
    for (const word of words) {
        // Check for exact brand match (case insensitive)
        const matchedBrand = knownBrands.find(brand => 
            word.toLowerCase() === brand.toLowerCase()
        );
        
        if (matchedBrand) {
            return matchedBrand.toUpperCase();
        }
    }
    
    // Fallback: if first word looks like a brand (capitalized, 2+ chars)
    if (words.length > 0) {
        const firstWord = words[0];
        if (firstWord.length >= 2 && /^[A-Za-z]+$/.test(firstWord)) {
            return firstWord.toUpperCase();
        }
    }
    
    return null;
}

async function generateRAGResponse(question, context, chatHistory, openAIApiKey) {
    try {
        console.log('🤖 Generating AI response for:', question);
        console.log('📦 Context products:', context.length);
        
        // Format detailed context from products
        const contextText = formatProductContext(context);
        
        console.log('📄 Formatted context length:', contextText.length);

        // Tạo ChatOpenAI instance động theo key
        const chatModel = new ChatOpenAI({
            openAIApiKey: openAIApiKey,
            modelName: 'gpt-4o-mini',
            temperature: 0.3,
            maxTokens: 150,
            streaming: false
        });

        // Create the RAG chain
        const ragChain = RunnableSequence.from([
            RAG_PROMPT,
            chatModel,
            new StringOutputParser()
        ]);

        // Generate response
        const response = await ragChain.invoke({
            context: contextText,
            chat_history: chatHistory || 'Đây là tin nhắn đầu tiên.',
            question: question
        });

        console.log('✅ AI response generated successfully');
        return response;

    } catch (error) {
        console.error('❌ Error generating RAG response:', error);
        
        // Enhanced fallback response based on context
        if (context.length > 0) {
            const product = context[0];
            const price = product.price ? `${(product.price * 1000000).toLocaleString('vi-VN')}đ` : 'Liên hệ';
            
            // Smart brand extraction for fallback
            let brandName = product.brand?.name;
            if (!brandName && product.name) {
                brandName = extractBrandFromProductName(product.name);
            }
            const brandText = brandName || 'thương hiệu không rõ';
            
            return `Tôi tìm thấy sản phẩm "${product.name}" của ${brandText} với giá ${price}. ${context.length > 1 ? `Và còn ${context.length - 1} sản phẩm khác.` : ''} Bạn có muốn biết thêm chi tiết không?`;
        } else {
            return 'Xin lỗi, tôi không tìm thấy sản phẩm nào phù hợp trong cơ sở dữ liệu. Bạn có thể thử tìm kiếm với từ khóa khác hoặc cho tôi biết thêm về nhu cầu của bạn?';
        }
    }
}

module.exports = {
    createChatSession: exports.createChatSession,
    sendMessage: exports.sendMessage,
    getChatHistory: exports.getChatHistory,
    endChatSession: exports.endChatSession,
    getCostStatistics: exports.getCostStatistics,
    resetCosts: exports.resetCosts
}; 