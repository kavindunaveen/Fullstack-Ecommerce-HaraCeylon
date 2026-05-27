"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = exports.invalidateUserCache = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
// ── In-memory user cache ────────────────────────────────────────
// Avoids a DB lookup on every authenticated request.
// Users are cached for 5 minutes; cache is invalidated on logout.
const userCache = new Map();
const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const getCachedUser = (userId) => {
    const cached = userCache.get(userId);
    if (!cached)
        return null;
    if (Date.now() > cached.expiresAt) {
        userCache.delete(userId);
        return null;
    }
    return cached.user;
};
const setCachedUser = (userId, user) => {
    userCache.set(userId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
};
const invalidateUserCache = (userId) => {
    userCache.delete(userId);
};
exports.invalidateUserCache = invalidateUserCache;
// ── Authenticate (required) ──────────────────────────────────────
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        // Check cache first — avoids DB roundtrip on every authenticated request
        let user = getCachedUser(decoded.userId);
        if (!user) {
            user = await prisma_1.default.user.findUnique({ where: { id: decoded.userId } });
            if (user)
                setCachedUser(decoded.userId, user);
        }
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
    }
};
exports.authenticate = authenticate;
// ── Optional Authenticate (for guest-compatible routes) ──────────
const optionalAuthenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_ACCESS_SECRET);
        // Check cache first
        let user = getCachedUser(decoded.userId);
        if (!user) {
            user = await prisma_1.default.user.findUnique({ where: { id: decoded.userId } });
            if (user)
                setCachedUser(decoded.userId, user);
        }
        if (user) {
            req.user = user;
        }
        next();
    }
    catch (error) {
        // If token is invalid, treat as guest
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
