"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
const generateTokens = (userId) => {
    const access = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refresh = jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
    return { access, refresh };
};
// Register
router.post('/registration/', async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        const trimmedEmail = email?.trim();
        const trimmedPassword = password?.trim();
        if (!trimmedEmail || !trimmedPassword) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const existingUser = await prisma_1.default.user.findUnique({ where: { email: trimmedEmail } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email is already in use' });
        }
        const passwordHash = await bcryptjs_1.default.hash(trimmedPassword, 10);
        const user = await prisma_1.default.user.create({
            data: { email: trimmedEmail, passwordHash, firstName, lastName }
        });
        const tokens = generateTokens(user.id);
        res.status(201).json({
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
        console.error(error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// Login
router.post('/login/', async (req, res) => {
    try {
        const { email, password } = req.body;
        const trimmedEmail = email?.trim();
        const trimmedPassword = password?.trim();
        const user = await prisma_1.default.user.findUnique({ where: { email: trimmedEmail } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcryptjs_1.default.compare(trimmedPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const tokens = generateTokens(user.id);
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
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// Refresh Token
router.post('/token/refresh/', async (req, res) => {
    try {
        const { refresh } = req.body;
        if (!refresh)
            return res.status(400).json({ error: 'Refresh token required' });
        const decoded = jsonwebtoken_1.default.verify(refresh, process.env.JWT_SECRET);
        const access = jsonwebtoken_1.default.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
        res.json({ access });
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid refresh token' });
    }
});
exports.default = router;
