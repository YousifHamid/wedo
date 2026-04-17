import { Request, Response } from 'express';
import User, { UserRole } from '../models/User';
import Trip, { TripStatus, VehicleType } from '../models/Trip';
import Zone from '../models/Zone';

// Meta verification endpoint
export const verifyWebhook = (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
  }
  return res.sendStatus(403);
};

// Process WhatsApp Text
export const handleWhatsAppMessage = async (req: Request, res: Response) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message || message.type !== 'text') {
      return res.sendStatus(200); // Acknowledge non-text messages
    }

    const phone = contact?.wa_id || message.from; // Phone number of sender
    const text = message.text.body.trim().toLowerCase();

    // 1. Check if user is registered in Database
    let user = await User.findOne({ phone });
    if (!user) {
      console.log('[WhatsApp Bot] Unregistered User:', phone);
      // In production, trigger a WhatsApp API call sending: "مرحباً! نرجو التسجيل في تطبيق Wedo أولاً لطلب رحلة."
      return res.sendStatus(200);
    }

    // 2. Simple NLP / Rule Engine
    if (text.includes('مشوار') || text.includes('رحلة') || text.includes('محتاج عربية')) {
      // Find a default pickup zone (or parse from text)
      const defaultZone = await Zone.findOne({ status: 'active' });
      
      if (!defaultZone) {
         return res.sendStatus(200);
      }

      // Create an instant Trip request for the user
      const trip = new Trip({
        rider: user._id,
        pickupZone: defaultZone._id,
        dropoffZone: defaultZone._id, // Assume within same zone for lite request
        vehicleType: VehicleType.STANDARD,
        status: TripStatus.PENDING,
        fareEstimate: 3000,
        paymentMethod: 'cash',
        pickupAddress: 'Request via WhatsApp PWA Bot',
      });
      await trip.save();

      // Trigger Dispatch Logic (could import matchingService and execute here)
      console.log('[WhatsApp Bot] Trip created automatically for:', user.name);

      // Reply back to user via WhatsApp API: "تم استلام طلبك! جاري البحث عن أقرب كابتن إليك..."
      return res.sendStatus(200);
    }

    return res.sendStatus(200);
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return res.sendStatus(500);
  }
};
