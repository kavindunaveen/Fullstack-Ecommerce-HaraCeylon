import { Router } from 'express';

const router = Router();

interface ShippingRate {
  id: number;
  name: string;
  price: string;
  delivery_estimate: string | null;
}

const DEFAULT_RATES: ShippingRate[] = [
  {
    id: 1,
    name: 'Standard International Shipping',
    price: '10.00',
    delivery_estimate: '7-14 business days',
  },
  {
    id: 2,
    name: 'Express International Shipping',
    price: '25.00',
    delivery_estimate: '3-5 business days',
  },
];

const DOMESTIC_RATES: ShippingRate[] = [
  {
    id: 3,
    name: 'Standard Local Delivery',
    price: '2.00',
    delivery_estimate: '2-3 business days',
  },
  {
    id: 4,
    name: 'Next Day Delivery',
    price: '5.00',
    delivery_estimate: '1 business day',
  },
];

router.get('/rates', (req, res) => {
  const { country } = req.query;

  if (!country) {
    return res.status(400).json({ error: 'Country is required' });
  }

  // If country is Sri Lanka (LK), return domestic rates, else international
  // You can expand this logic as needed
  if (country === 'LK') {
    return res.json(DOMESTIC_RATES);
  }

  res.json(DEFAULT_RATES);
});

export default router;
