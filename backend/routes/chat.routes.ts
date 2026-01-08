import { Router } from 'express';
import { chat, chatStream } from '../controllers/chat.controller';

const router = Router();

// Chat endpoint (response đầy đủ)
router.post('/message', chat);

// Chat streaming endpoint (real-time response)
router.post('/stream', chatStream);

export default router;
