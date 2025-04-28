// models/ChatSession.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    sender: {
        type: String,
        enum: ['user', 'bot'],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    metadata: { // Lưu thông tin bổ sung, vd: context từ RAG
        type: Object
    }
}, { _id: false });

const chatSessionSchema = new Schema({
    userId: { // Null nếu là khách vãng lai
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    sessionId: { // ID định danh phiên chat duy nhất
        type: String,
        required: true,
        unique: true,
        index: true
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    messages: [messageSchema], // Mảng các tin nhắn trong phiên
    status: {
        type: String,
        enum: ['active', 'closed', 'archived'],
        default: 'active'
    }
}, {
    timestamps: true, // createdAt và updatedAt cho cả session
    collection: 'ChatSessions'
});

const ChatSession = mongoose.model('ChatSession', chatSessionSchema); // map với 'chatsessions'
module.exports = ChatSession;