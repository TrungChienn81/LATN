const ChatSession = require('../models/ChatSession');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const catchAsync = require('../utils/catchAsync');
const { v4: uuidv4 } = require('uuid');

// Mock AI Responses Database
const mockResponses = {
  greetings: [
    "Xin chào! Tôi là AI assistant chuyên tư vấn laptop và PC. Tôi có thể giúp bạn tìm sản phẩm phù hợp với nhu cầu và ngân sách. Bạn đang tìm kiếm gì?",
    "Chào bạn! Tôi sẵn sàng hỗ trợ bạn tìm laptop hoặc PC tốt nhất. Hãy cho tôi biết mục đích sử dụng và ngân sách của bạn nhé!"
  ],
  
  laptop_gaming: [
    "Tuyệt vời! Laptop gaming là lựa chọn tuyệt vời. Với ngân sách {budget}, tôi khuyên bạn nên xem xét các dòng laptop có card đồ họa mạnh như RTX 4060 trở lên. Bạn thường chơi game gì và có cần laptop di động không?",
    "Laptop gaming trong tầm giá {budget} có rất nhiều lựa chọn tốt! Tôi thấy có một số sản phẩm phù hợp trong cơ sở dữ liệu. Bạn có ưu tiên thương hiệu nào như ASUS ROG, MSI Gaming, hay Dell Alienware không?"
  ],
  
  laptop_office: [
    "Laptop văn phòng cần ưu tiên hiệu suất ổn định và thời lượng pin tốt. Với nhu cầu của bạn, tôi khuyên các dòng laptop business như ThinkPad, Dell Latitude hoặc HP EliteBook. Bạn có cần màn hình lớn không?",
    "Tuyệt! Laptop văn phòng thì Dell, HP và Lenovo có nhiều lựa chọn tốt trong tầm giá này. Bạn có làm việc với phần mềm nặng như AutoCAD hay chỉ Office thôi?"
  ],
  
  laptop_student: [
    "Laptop cho sinh viên cần cân bằng giữa hiệu suất và giá cả. Tôi khuyên bạn nên xem các dòng như Acer Aspire, ASUS VivoBook hoặc HP Pavilion. Bạn học ngành gì để tôi tư vấn cấu hình phù hợp?",
    "Sinh viên thì laptop nhẹ, pin trâu và giá hợp lý là quan trọng nhất! Có một số sản phẩm tốt trong kho. Bạn có cần chạy phần mềm chuyên ngành không?"
  ],
  
  pc_gaming: [
    "PC gaming cho phép nâng cấp linh hoạt và hiệu suất cao hơn laptop! Với ngân sách {budget}, bạn có thể build một bộ PC mạnh với CPU Intel i5/i7 hoặc AMD Ryzen 5/7. Bạn đã có màn hình và phụ kiện chưa?",
    "PC gaming là lựa chọn tuyệt vời cho hiệu suất tối đa! Tôi có thể tư vấn cấu hình phù hợp. Bạn chơi game nặng như AAA titles hay chỉ esports thôi?"
  ],
  
  comparison: [
    "So sánh {brand1} và {brand2} à? Cả hai thương hiệu đều có ưu điểm riêng. {brand1} thường mạnh về {strength1}, còn {brand2} nổi bật ở {strength2}. Bạn ưu tiên yếu tố nào nhất?",
    "Đây là câu hỏi hay! {brand1} và {brand2} đều là thương hiệu uy tín. Tùy vào nhu cầu cụ thể mà mỗi hãng có điểm mạnh khác nhau. Bạn có sản phẩm cụ thể nào muốn so sánh không?"
  ],
  
  price_inquiry: [
    "Với ngân sách {budget}, bạn có khá nhiều lựa chọn tốt! Tôi đã tìm thấy {count} sản phẩm phù hợp trong cơ sở dữ liệu. Bạn có muốn tôi giới thiệu top 3 sản phẩm tốt nhất không?",
    "Ngân sách {budget} là mức hợp lý! Có nhiều sản phẩm chất lượng trong tầm giá này. Bạn có ưu tiên gì đặc biệt như thương hiệu, kích thước màn hình hay hiệu suất không?"
  ],
  
  default: [
    "Tôi hiểu bạn đang quan tâm đến {topic}. Để tư vấn chính xác nhất, bạn có thể cho tôi biết thêm về ngân sách và mục đích sử dụng không?",
    "Đây là câu hỏi thú vị! Tôi có thể hỗ trợ bạn tốt hơn nếu biết thêm chi tiết về nhu cầu. Bạn đang tìm laptop hay PC? Ngân sách khoảng bao nhiêu?"
  ]
};

// Brand information for comparisons
const brandInfo = {
  'dell': { strength1: 'độ bền và hỗ trợ khách hàng', strength2: 'thiết kế business chuyên nghiệp' },
  'hp': { strength1: 'đa dạng sản phẩm', strength2: 'tính năng bảo mật cao' },
  'asus': { strength1: 'gaming và hiệu suất', strength2: 'thiết kế đẹp mắt' },
  'lenovo': { strength1: 'bàn phím tốt và độ bền', strength2: 'giá cả hợp lý' },
  'acer': { strength1: 'giá cả cạnh tranh', strength2: 'đa dạng phân khúc' },
  'msi': { strength1: 'gaming chuyên nghiệp', strength2: 'tản nhiệt tốt' }
};

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

        const welcomeMessage = mockResponses.greetings[Math.floor(Math.random() * mockResponses.greetings.length)];

        res.status(201).json({
            success: true,
            data: {
                sessionId,
                message: welcomeMessage
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

        // Get relevant context using search
        const context = await getRelevantContext(message);
        
        // Generate mock AI response
        const aiResponse = await generateMockResponse(message, context, chatSession.messages);

        // Add AI response to session
        chatSession.messages.push({
            sender: 'bot',
            text: aiResponse.text,
            timestamp: new Date(),
            metadata: { context_used: context.length > 0, mock_response: true }
        });

        await chatSession.save();

        res.status(200).json({
            success: true,
            data: {
                message: aiResponse.text,
                sessionId,
                context_products: context.slice(0, 3) // Return top 3 relevant products
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

// Helper Functions

async function getRelevantContext(query) {
    try {
        // Simple keyword-based search
        const keywords = extractKeywords(query);
        
        let searchQuery = {
            isActive: true,
            $or: []
        };

        // Search in product name and description
        if (keywords.length > 0) {
            const keywordRegex = keywords.map(k => new RegExp(k, 'i'));
            searchQuery.$or.push(
                { name: { $in: keywordRegex } },
                { description: { $in: keywordRegex } }
            );
        }

        // Search by category keywords
        const categories = await Category.find({
            name: { $in: keywords.map(k => new RegExp(k, 'i')) }
        });
        if (categories.length > 0) {
            searchQuery.$or.push({ category: { $in: categories.map(c => c._id) } });
        }

        // Search by brand keywords
        const brands = await Brand.find({
            name: { $in: keywords.map(k => new RegExp(k, 'i')) }
        });
        if (brands.length > 0) {
            searchQuery.$or.push({ brand: { $in: brands.map(b => b._id) } });
        }

        if (searchQuery.$or.length === 0) {
            // If no specific keywords, return trending products
            return await Product.find({ isActive: true })
                .populate('category', 'name')
                .populate('brand', 'name')
                .populate('shopId', 'shopName')
                .sort({ createdAt: -1 })
                .limit(5);
        }

        const products = await Product.find(searchQuery)
            .populate('category', 'name')
            .populate('brand', 'name')
            .populate('shopId', 'shopName')
            .limit(5);

        return products;

    } catch (error) {
        console.error('Error getting relevant context:', error);
        return [];
    }
}

function extractKeywords(text) {
    // Vietnamese laptop/PC related keywords
    const techKeywords = [
        'laptop', 'máy tính', 'pc', 'gaming', 'văn phòng', 'học tập', 'sinh viên',
        'intel', 'amd', 'nvidia', 'rtx', 'gtx', 'core i3', 'core i5', 'core i7',
        'ryzen', 'ram', 'ssd', 'hdd', 'màn hình', 'keyboard', 'chuột',
        'asus', 'dell', 'hp', 'lenovo', 'acer', 'msi', 'gigabyte',
        'giá rẻ', 'tốt nhất', 'khuyến mãi', 'mới nhất', 'so sánh'
    ];

    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2);

    return words.filter(word => 
        techKeywords.some(keyword => 
            keyword.includes(word) || word.includes(keyword)
        )
    );
}

function extractBudget(text) {
    // Extract budget from text (triệu, tr, million, k, etc.)
    const budgetRegex = /(\d+(?:\.\d+)?)\s*(triệu|tr|million|k|nghìn)/gi;
    const matches = text.match(budgetRegex);
    
    if (matches && matches.length > 0) {
        const match = matches[0];
        const number = parseFloat(match.match(/\d+(?:\.\d+)?/)[0]);
        
        if (match.includes('triệu') || match.includes('tr') || match.includes('million')) {
            return `${number} triệu`;
        } else if (match.includes('k') || match.includes('nghìn')) {
            return `${number}k`;
        }
    }
    
    return null;
}

function detectIntent(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('gaming') || msg.includes('game') || msg.includes('chơi game')) {
        return msg.includes('pc') ? 'pc_gaming' : 'laptop_gaming';
    }
    
    if (msg.includes('văn phòng') || msg.includes('office') || msg.includes('làm việc')) {
        return 'laptop_office';
    }
    
    if (msg.includes('sinh viên') || msg.includes('học') || msg.includes('student')) {
        return 'laptop_student';
    }
    
    if (msg.includes('so sánh') || msg.includes('compare')) {
        return 'comparison';
    }
    
    if (msg.includes('giá') || msg.includes('triệu') || msg.includes('budget')) {
        return 'price_inquiry';
    }
    
    return 'default';
}

async function generateMockResponse(message, context, chatHistory) {
    try {
        const intent = detectIntent(message);
        const budget = extractBudget(message);
        const keywords = extractKeywords(message);
        
        let responseTemplate = mockResponses[intent] || mockResponses.default;
        let response = responseTemplate[Math.floor(Math.random() * responseTemplate.length)];
        
        // Replace placeholders
        if (budget) {
            response = response.replace('{budget}', budget);
        }
        
        if (context.length > 0) {
            response = response.replace('{count}', context.length);
        }
        
        // Handle brand comparisons
        if (intent === 'comparison') {
            const brands = keywords.filter(k => brandInfo[k.toLowerCase()]);
            if (brands.length >= 2) {
                const brand1 = brands[0].toLowerCase();
                const brand2 = brands[1].toLowerCase();
                
                response = response
                    .replace('{brand1}', brands[0].toUpperCase())
                    .replace('{brand2}', brands[1].toUpperCase())
                    .replace('{strength1}', brandInfo[brand1]?.strength1 || 'hiệu suất')
                    .replace('{strength2}', brandInfo[brand2]?.strength1 || 'thiết kế');
            }
        }
        
        // Add product recommendations if available
        if (context.length > 0) {
            const productList = context.slice(0, 3).map(p => 
                `• ${p.name} - ${p.price?.toLocaleString('vi-VN')}đ (${p.brand?.name || 'N/A'})`
            ).join('\n');
            
            response += `\n\nMột số sản phẩm phù hợp tôi tìm được:\n${productList}\n\nBạn có muốn tôi giải thích chi tiết về sản phẩm nào không?`;
        }
        
        // Replace topic placeholder
        if (keywords.length > 0) {
            response = response.replace('{topic}', keywords.slice(0, 2).join(' và '));
        }
        
        return { text: response };
        
    } catch (error) {
        console.error('Error generating mock response:', error);
        return { 
            text: 'Tôi hiểu bạn đang tìm kiếm thông tin về laptop/PC. Để tư vấn tốt nhất, bạn có thể cho tôi biết mục đích sử dụng và ngân sách không?' 
        };
    }
}

module.exports = {
    createChatSession: exports.createChatSession,
    sendMessage: exports.sendMessage,
    getChatHistory: exports.getChatHistory,
    endChatSession: exports.endChatSession
}; 