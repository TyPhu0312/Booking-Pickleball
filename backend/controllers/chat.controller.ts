import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

const loadSystemPrompt = (): string => {
    try {
        const promptPath = path.join(__dirname, '../prompts/chatbot-system-prompt.txt');
        const basePrompt = fs.readFileSync(promptPath, 'utf-8');
        
        const enhancedPrompt = `${basePrompt}

QUAN TRỌNG - XỬ LÝ CÂU HỎI NGOÀI PHẠM VI:
- Nếu câu hỏi KHÔNG liên quan đến: đặt sân, giá cả, địa điểm, giờ hoạt động, chính sách, ưu đãi, Pickleball
- Hãy trả lời: "Xin lỗi, tôi chỉ có thể hỗ trợ các thông tin về sân Pickleball Sao Mai như: đặt sân, giá cả, địa điểm, giờ mở cửa, chính sách hủy, và ưu đãi. Bạn có câu hỏi gì về những vấn đề này không?"
- KHÔNG trả lời các câu hỏi về: chính trị, tôn giáo, tin tức, lập trình, toán học, y tế, luật pháp, hoặc bất kỳ chủ đề nào không liên quan đến sân Pickleball
- Luôn lịch sự và hướng người dùng quay lại các chủ đề bạn có thể hỗ trợ`;
        
        return enhancedPrompt;
    } catch (error) {
        console.error('❌ Không thể đọc file prompt:', error);
        return 'Bạn là trợ lý ảo của Sân Pickleball Sao Mai. Hãy trả lời thân thiện và hữu ích về các dịch vụ của sân.';
    }
};

const SYSTEM_PROMPT = loadSystemPrompt();


export const chat = async (req: Request, res: Response) => {
    try {
        const { message, conversationHistory } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT }
        ];

        if (conversationHistory && Array.isArray(conversationHistory)) {
            conversationHistory.forEach((msg: { role: string; content: string }) => {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            });
        }

        messages.push({
            role: 'user',
            content: message
        });

        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) {
            console.log('⚠️ OPENROUTER_API_KEY chưa được cấu hình, sử dụng fallback response');
            throw new Error('API key not configured');
        }

        console.log('🤖 Đang gọi OpenRouter API...');
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': process.env.BACKEND_URL || 'http://localhost:5000',
                'X-Title': 'Pickleball Sao Mai Chatbot',
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.2-3b-instruct:free',
                messages: messages,
                temperature: 0.7,
                max_tokens: 300,
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('❌ OpenRouter API error:', response.status, errorData);
            throw new Error(`API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        const text = data.choices[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này.';

        res.json({
            success: true,
            message: text,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Chat error:', error);
        
        const fallbackResponses: Record<string, string> = {
            'xin chào': 'Xin chào! Tôi là Mai - trợ lý của sân Pickleball Sao Mai. Tôi có thể giúp bạn về: 🏟️ Đặt sân, 💰 Giá cả, 📍 Địa điểm, ⏰ Giờ hoạt động, 🎁 Ưu đãi. Bạn muốn hỏi về điều gì?',
            'chào': 'Chào bạn! Tôi là trợ lý ảo của sân Pickleball Sao Mai. Bạn cần hỗ trợ gì về sân của chúng tôi?',
            'hello': 'Hello! Tôi là Mai từ Pickleball Sao Mai. Tôi có thể giúp gì cho bạn?',
            'giá': 'Bảng giá thuê sân:\n- 7h-13h: 100.000đ/giờ\n- 13h-19h: 150.000đ/giờ\n- 19h-22h: 200.000đ/giờ\nBạn muốn biết thêm về ưu đãi không?',
            'địa chỉ': 'Sân Pickleball Sao Mai tại: 180 Cao Lỗ Phường Chánh Hưng, TP.Hồ Chí Minh. Hotline: 0767 392 XXX. Bạn cần chỉ đường không?',
            'đặt sân': 'Để đặt sân: vào mục "Đặt sân" trên menu → Chọn ngày & giờ → Thanh toán. Rất đơn giản! Bạn cần hỗ trợ thêm không?',
            'giờ': 'Sân mở cửa từ 7h-22h hàng ngày (cả lễ Tết). Bạn muốn đặt khung giờ nào?',
            'ưu đãi': 'Ưu đãi đặc biệt:\n- Khách mới: Giảm 20% lần đầu\n- Sinh nhật: Miễn phí 1 giờ\n- Giới thiệu bạn: Giảm 10%\nBạn thuộc nhóm nào?',
            'default': 'Tôi là trợ lý ảo của sân Pickleball Sao Mai. Tôi có thể giúp bạn về: đặt sân, giá cả, địa điểm, giờ mở cửa, chính sách & ưu đãi. Bạn muốn hỏi gì?'
        };

        const lowerMessage = (req.body.message || '').toLowerCase().trim();
        let fallback = fallbackResponses.default;
        
        for (const [key, value] of Object.entries(fallbackResponses)) {
            if (lowerMessage.includes(key)) {
                fallback = value;
                break;
            }
        }

        res.json({
            success: true,
            message: fallback,
            timestamp: new Date().toISOString(),
            isFlallback: true 
        });
    }
};

export const chatStream = async (req: Request, res: Response) => {
    return chat(req, res);
};
