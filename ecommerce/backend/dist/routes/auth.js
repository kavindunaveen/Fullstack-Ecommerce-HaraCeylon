"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const client = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// Rate limiter for authentication routes
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per windowMs
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
const generateTokens = async (userId) => {
    const access = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
    const refresh = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    // Store refresh token in database for server-side invalidation
    await prisma_1.default.refreshToken.create({
        data: {
            token: refresh,
            userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
    });
    return { access, refresh };
};
// Google SSO Login/Registration
router.post('/google/', authLimiter, async (req, res) => {
    try {
        const { credential } = req.body;
        if (!credential) {
            return res.status(400).json({ error: 'Google credential is required' });
        }
        // Verify the JWT token sent from the frontend Google button
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return res.status(400).json({ error: 'Invalid Google token payload' });
        }
        const { email, given_name, family_name } = payload;
        // Find the user, or auto-register them if this is their first time
        let user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            user = await prisma_1.default.user.create({
                data: {
                    email,
                    firstName: given_name || '',
                    lastName: family_name || '',
                    // passwordHash is now optional and omitted for Google users
                }
            });
        }
        // Generate our system's access & refresh tokens
        const tokens = await generateTokens(user.id);
        res.json({
            user: {
                id: user.id,
                email: user.email,
                first_name: user.firstName,
                last_name: user.lastName,
                role: user.role,
                is_staff: user.role === 'ADMIN'
            },
            ...tokens
        });
    }
    catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ error: 'Google authentication failed' });
    }
});
// Refresh Token
router.post('/token/refresh/', authLimiter, async (req, res) => {
    try {
        const { refresh } = req.body;
        if (!refresh)
            return res.status(400).json({ error: 'Refresh token required' });
        // Verify refresh token exists in database (has not been invalidated)
        const storedToken = await prisma_1.default.refreshToken.findUnique({
            where: { token: refresh }
        });
        if (!storedToken) {
            return res.status(401).json({ error: 'Refresh token is invalid or has been revoked' });
        }
        const decoded = jsonwebtoken_1.default.verify(refresh, process.env.JWT_REFRESH_SECRET);
        const access = jsonwebtoken_1.default.sign({ userId: decoded.userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
        res.json({ access });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});
// Logout — invalidates the refresh token on the server
router.post('/logout/', async (req, res) => {
    try {
        const { refresh } = req.body;
        if (refresh) {
            // Remove the refresh token from the database to invalidate it
            await prisma_1.default.refreshToken.deleteMany({
                where: { token: refresh }
            });
        }
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});
exports.default = router;
