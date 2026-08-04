"use strict";
/**
 * HARA Ceylon — Shared Backend Utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENCIES = exports.toAbsoluteUrl = void 0;
/**
 * Converts a stored relative image path (e.g. /uploads/img.jpg)
 * into a fully-qualified absolute URL using BACKEND_URL from env.
 */
const toAbsoluteUrl = (url) => {
    if (!url)
        return null;
    if (url.startsWith('http'))
        return url;
    if (!url.startsWith('/uploads'))
        return url;
    const base = process.env.BACKEND_URL || 'http://localhost:8001';
    return `${base}${url}`;
};
exports.toAbsoluteUrl = toAbsoluteUrl;
exports.CURRENCIES = [
    { code: 'GBP', symbol: '£', name: 'British Pound', rate: 1 },
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.27 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 1.17 },
    { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee', rate: 385 },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.95 },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.72 },
];
