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
- Nếu hỏi về giá, trả lời chính xác theo dữ liệu đã được format (VD: "10.000.000đ")
- Nếu hỏi sản phẩm cụ thể, tìm trong danh sách và mô tả chi tiết
- Nếu không tìm thấy, thông báo "Không có sản phẩm này" và đề xuất sản phẩm tương tự
- Trả lời ngắn gọn, chính xác, sử dụng đúng định dạng giá đã được format sẵn trong danh sách

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

        // Generate AI response using RAG
        const aiResponse = await generateRAGResponse(message, context, chatHistory);

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
        
        let searchQueries = [];
        
        // 1. Exact product name/model search (highest priority)
        if (productIdentifiers.length > 0) {
            for (const identifier of productIdentifiers) {
                searchQueries.push({
                    $or: [
                        { name: new RegExp(identifier, 'i') },
                        { description: new RegExp(identifier, 'i') },
                        { sku: new RegExp(identifier, 'i') }
                    ]
                });
            }
        }
        
        // 2. Brand + model combination search
        const brandModelCombos = extractBrandModelCombos(query);
        for (const combo of brandModelCombos) {
            const brand = await Brand.findOne({ 
                name: new RegExp(combo.brand, 'i') 
            });
            
            if (brand) {
                searchQueries.push({
                    brand: brand._id,
                    $or: [
                        { name: new RegExp(combo.model, 'i') },
                        { description: new RegExp(combo.model, 'i') }
                    ]
                });
            }
        }
        
        // 3. General keyword search
        if (keywords.length > 0) {
            const keywordRegex = keywords.map(k => new RegExp(k, 'i'));
            searchQueries.push({
                $or: [
                    { name: { $in: keywordRegex } },
                    { description: { $in: keywordRegex } }
                ]
            });
        }
        
        // 4. Category search
        const categories = await Category.find({
            name: { $in: keywords.map(k => new RegExp(k, 'i')) }
        });
        if (categories.length > 0) {
            searchQueries.push({
                category: { $in: categories.map(c => c._id) }
            });
        }
        
        // Execute searches in priority order
        let products = [];
        for (const searchQuery of searchQueries) {
            const found = await Product.find(searchQuery)
                .populate('category', 'name')
                .populate('brand', 'name')
                .populate('shopId', 'shopName')
                .limit(10);
            
            if (found.length > 0) {
                products = [...products, ...found];
                console.log(`✅ Found ${found.length} products with query:`, JSON.stringify(searchQuery, null, 2));
                break; // Use first successful search
            }
        }
        
        // Remove duplicates
        const uniqueProducts = products.filter((product, index, self) =>
            index === self.findIndex(p => p._id.toString() === product._id.toString())
        );
        
        // If no specific products found, return trending
        if (uniqueProducts.length === 0) {
            console.log('🔄 No specific matches, returning trending products');
            return await Product.find({})
                .populate('category', 'name')
                .populate('brand', 'name')
                .populate('shopId', 'shopName')
                .sort({ createdAt: -1 })
                .limit(5);
        }
        
        console.log(`🎉 RAG found ${uniqueProducts.length} relevant products`);
        return uniqueProducts.slice(0, 5);

    } catch (error) {
        console.error('Error getting relevant context:', error);
        return [];
    }
}

// Extract specific product identifiers (model numbers, SKUs, etc.)
function extractProductIdentifiers(query) {
    const identifiers = [];
    
    // Pattern for exact product names: "MSI Alpha 15 B5EEK 203VN"
    const fullNamePattern = /(MSI\s+Alpha\s+15\s+B5EEK\s+203VN)/gi;
    const fullName = query.match(fullNamePattern);
    if (fullName) {
        identifiers.push(...fullName);
    }
    
    // Pattern for brand + series: "MSI Alpha 15"
    const brandSeriesPattern = /(MSI\s+Alpha\s+15)|(ASUS\s+TUF\s+Gaming)|(Dell\s+Inspiron)/gi;
    const brandSeries = query.match(brandSeriesPattern);
    if (brandSeries) {
        identifiers.push(...brandSeries);
    }
    
    // Pattern for specific model codes: B5EEK, 203VN, etc.
    const modelCodePattern = /\b[A-Z0-9]{4,}\b/g;
    const codes = query.match(modelCodePattern);
    if (codes) {
        identifiers.push(...codes);
    }
    
    // Pattern for common laptop names
    const laptopPattern = /(Alpha\s+15|TUF\s+Gaming|Inspiron\s+15|GF63\s+Thin|VivoBook\s+15)/gi;
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
    
    return products.map((product, index) => {
        const brandName = product.brand?.name || 'Không rõ thương hiệu';
        const categoryName = product.category?.name || 'Không rõ danh mục';
        const shopName = product.shopId?.shopName || 'Không rõ cửa hàng';
        // Convert price from millions to VND and format properly
        const price = product.price ? `${(product.price * 1000000).toLocaleString('vi-VN')}đ` : 'Liên hệ';
        const stock = product.stock || 0;
        
        return `${index + 1}. TÊN: ${product.name}
   THƯƠNG HIỆU: ${brandName}
   DANH MỤC: ${categoryName} 
   GIÁ: ${price}
   TÌNH TRẠNG: ${stock > 0 ? 'Còn hàng' : 'Hết hàng'} (${stock} sản phẩm)
   CỬA HÀNG: ${shopName}
   MÔ TẢ: ${product.description || 'Không có mô tả'}
   ---`;
    }).join('\n');
}

async function generateRAGResponse(question, context, chatHistory) {
    try {
        console.log('🤖 Generating AI response for:', question);
        console.log('📦 Context products:', context.length);
        
        // Format detailed context from products
        const contextText = formatProductContext(context);
        
        console.log('📄 Formatted context length:', contextText.length);

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
            // Convert price from millions to VND and format properly
            const price = product.price ? `${(product.price * 1000000).toLocaleString('vi-VN')}đ` : 'Liên hệ';
            
            return `Tôi tìm thấy sản phẩm "${product.name}" của ${product.brand?.name || 'thương hiệu không rõ'} với giá ${price}. ${context.length > 1 ? `Và còn ${context.length - 1} sản phẩm khác.` : ''} Bạn có muốn biết thêm chi tiết không?`;
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