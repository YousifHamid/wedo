import { Request, Response } from 'express';
import Zone from '../models/Zone';
import Pricing from '../models/Pricing';

// GET /api/zones - List all active zones
export const getZones = async (req: Request, res: Response) => {
  try {
    const zones = await Zone.find({ isActive: true }).sort({ order: 1 });
    res.json(zones);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching zones', error });
  }
};

// GET /api/zones/pricing?from=zoneId&to=zoneId
export const getZonePricing = async (req: Request, res: Response) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ message: 'Both from and to zone IDs are required' });
    }

    const pricing = await Pricing.findOne({
      fromZone: from,
      toZone: to,
      isActive: true,
    }).populate('fromZone toZone');

    if (!pricing) {
      return res.status(404).json({ message: 'No pricing found for this zone pair' });
    }

    res.json(pricing);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pricing', error });
  }
};

// GET /api/zones/pricing/all - Get full pricing matrix (for admin)
export const getAllPricing = async (req: Request, res: Response) => {
  try {
    const pricing = await Pricing.find().populate('fromZone toZone');
    res.json(pricing);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching pricing', error });
  }
};

// POST /api/zones - Create zone (admin)
export const createZone = async (req: Request, res: Response) => {
  try {
    const { name, nameAr, description, descriptionAr, order } = req.body;
    const zone = await Zone.create({ name, nameAr, description, descriptionAr, order });
    res.status(201).json(zone);
  } catch (error) {
    res.status(500).json({ message: 'Error creating zone', error });
  }
};

// PUT /api/zones/:id - Update zone (admin)
export const updateZone = async (req: Request, res: Response) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!zone) return res.status(404).json({ message: 'Zone not found' });
    res.json(zone);
  } catch (error) {
    res.status(500).json({ message: 'Error updating zone', error });
  }
};

// POST /api/zones/pricing - Set pricing for zone pair (admin)
export const setPricing = async (req: Request, res: Response) => {
  try {
    const { fromZone, toZone, baseFare, premiumFare, commissionRate } = req.body;

    const pricing = await Pricing.findOneAndUpdate(
      { fromZone, toZone },
      { baseFare, premiumFare, commissionRate, isActive: true },
      { new: true, upsert: true }
    );

    res.json(pricing);
  } catch (error) {
    res.status(500).json({ message: 'Error setting pricing', error });
  }
};
