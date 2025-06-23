import api from './api';

class ChatService {
    constructor() {
        this.sessionId = null;
    }

    // Create new chat session
    async createSession(userId = null) {
        try {
            const response = await api.post('/chat/session', { userId });
            if (response.data.success) {
                this.sessionId = response.data.data.sessionId;
                return {
                    success: true,
                    sessionId: this.sessionId,
                    welcomeMessage: response.data.data.message
                };
            }
            return { success: false, message: 'Failed to create chat session' };
        } catch (error) {
            console.error('Error creating chat session:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Network error' 
            };
        }
    }

    // Send message to chatbot
    async sendMessage(message, userId = null) {
        if (!this.sessionId) {
            const sessionResult = await this.createSession(userId);
            if (!sessionResult.success) {
                return sessionResult;
            }
        }

        try {
            const response = await api.post('/chat/message', {
                sessionId: this.sessionId,
                message,
                userId
            });

            if (response.data.success) {
                return {
                    success: true,
                    message: response.data.data.message,
                    contextProducts: response.data.data.context_products || []
                };
            }
            return { success: false, message: 'Failed to send message' };
        } catch (error) {
            console.error('Error sending message:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Network error' 
            };
        }
    }

    // Get chat history
    async getChatHistory(limit = 50) {
        if (!this.sessionId) {
            return { success: false, message: 'No active session' };
        }

        try {
            const response = await api.get(`/chat/history/${this.sessionId}?limit=${limit}`);
            if (response.data.success) {
                return {
                    success: true,
                    messages: response.data.data.messages,
                    status: response.data.data.status
                };
            }
            return { success: false, message: 'Failed to get chat history' };
        } catch (error) {
            console.error('Error getting chat history:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Network error' 
            };
        }
    }

    // End chat session
    async endSession() {
        if (!this.sessionId) {
            return { success: true, message: 'No active session' };
        }

        try {
            const response = await api.put(`/chat/session/${this.sessionId}/end`);
            if (response.data.success) {
                this.sessionId = null;
                return { success: true, message: 'Chat session ended' };
            }
            return { success: false, message: 'Failed to end session' };
        } catch (error) {
            console.error('Error ending chat session:', error);
            return { 
                success: false, 
                message: error.response?.data?.message || 'Network error' 
            };
        }
    }

    // Get current session ID
    getSessionId() {
        return this.sessionId;
    }

    // Set session ID (for resuming existing sessions)
    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }
}

// Export singleton instance
const chatService = new ChatService();
export default chatService; 