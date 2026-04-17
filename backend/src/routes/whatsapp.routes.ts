import express from 'express';
import { handleWhatsAppMessage, verifyWebhook } from '../controllers/whatsapp.controller';

const router = express.Router();

// Webhook validation for Meta APIs
router.get('/webhook', verifyWebhook);

// Receive incoming messages
router.post('/webhook', handleWhatsAppMessage);

export default router;
