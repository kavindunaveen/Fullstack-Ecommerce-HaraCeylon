"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOMESTIC_RATES = exports.DEFAULT_RATES = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.DEFAULT_RATES = [
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
exports.DOMESTIC_RATES = [
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
const shippingRatesHandler = (req, res) => {
    const { country } = req.query;
    if (!country) {
        return res.status(400).json({ error: 'Country is required' });
    }
    if (country === 'LK') {
        return res.json(exports.DOMESTIC_RATES);
    }
    res.json(exports.DEFAULT_RATES);
};
// Accept both /rates and /rates/ (trailing slash)
router.get('/rates', shippingRatesHandler);
router.get('/rates/', shippingRatesHandler);
exports.default = router;
