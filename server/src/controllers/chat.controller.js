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

// Initialize OpenAI Chat Model
const chatModel = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY || 'your-openai-api-key',
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 500
});

// RAG Prompt Template
const RAG_PROMPT = PromptTemplate.fromTemplate(`
Bạn là một AI assistant chuyên về laptop và PC, hỗ trợ khách hàng trên website thương mại điện tử.

THÔNG TIN SẢN PHẨM LIÊN QUAN:
{context}

LỊCH SỬ CHAT:
{chat_history}

CÂU HỎI CỦA KHÁCH HÀNG: {question}

HƯỚNG DẪN:
- Trả lời bằng tiếng Việt, thân thiện và chuyên nghiệp
- Sử dụng thông tin sản phẩm được cung cấp để đưa ra lời khuyên chính xác
- Nếu khách hàng hỏi về sản phẩm cụ thể, hãy đề xuất sản phẩm phù hợp từ danh sách
- Nếu không có thông tin liên quan, hãy hỏi thêm để hiểu rõ nhu cầu
- Luôn kết thúc bằng câu hỏi để tiếp tục cuộc trò chuyện

TRẢ LỜI:
`);

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

        // Generate AI response using RAG
        const aiResponse = await generateRAGResponse(message, context, chatHistory);

        // Add AI response to session
        chatSession.messages.push({
            sender: 'bot',
            text: aiResponse,
            timestamp: new Date(),
            metadata: { context_used: context.length > 0 }
        });

        await chatSession.save();

        res.status(200).json({
            success: true,
            data: {
                message: aiResponse,
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
        // Simple keyword-based search (can be enhanced with vector similarity)
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
        'laptop', 'máy tính', 'pc', 'gaming', 'văn phòng', 'học tập',
        'intel', 'amd', 'nvidia', 'rtx', 'gtx', 'core i3', 'core i5', 'core i7',
        'ryzen', 'ram', 'ssd', 'hdd', 'màn hình', 'keyboard', 'chuột',
        'asus', 'dell', 'hp', 'lenovo', 'acer', 'msi', 'gigabyte',
        'giá rẻ', 'tốt nhất', 'khuyến mãi', 'mới nhất'
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

function formatChatHistory(messages) {
    return messages
        .slice(-6) // Last 6 messages for context
        .map(msg => `${msg.sender === 'user' ? 'Khách hàng' : 'AI'}: ${msg.text}`)
        .join('\n');
}

async function generateRAGResponse(question, context, chatHistory) {
    try {
        // Format context from products
        const contextText = context.map(product => 
            `- ${product.name} (${product.brand?.name || 'N/A'}) - ${product.category?.name || 'N/A'} - ${product.price?.toLocaleString('vi-VN')}đ - ${product.description?.substring(0, 100) || 'Không có mô tả'}...`
        ).join('\n');

        // Create the RAG chain
        const ragChain = RunnableSequence.from([
            RAG_PROMPT,
            chatModel,
            new StringOutputParser()
        ]);

        // Generate response
        const response = await ragChain.invoke({
            context: contextText || 'Không có sản phẩm liên quan được tìm thấy.',
            chat_history: chatHistory || 'Đây là tin nhắn đầu tiên.',
            question: question
        });

        return response;

    } catch (error) {
        console.error('Error generating RAG response:', error);
        
        // Fallback response
        if (context.length > 0) {
            return `Tôi tìm thấy ${context.length} sản phẩm có thể phù hợp với bạn. Bạn có muốn tôi giới thiệu chi tiết về sản phẩm nào không?`;
        } else {
            return 'Xin lỗi, tôi cần thêm thông tin để có thể hỗ trợ bạn tốt hơn. Bạn đang tìm kiếm loại laptop hay PC nào? Mục đích sử dụng là gì?';
        }
    }
}

module.exports = {
    createChatSession: exports.createChatSession,
    sendMessage: exports.sendMessage,
    getChatHistory: exports.getChatHistory,
    endChatSession: exports.endChatSession
}; 