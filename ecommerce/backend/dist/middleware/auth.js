"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuthenticate = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma_1.default.user.findUnique({ where: { id: decoded.userId } });
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
const optionalAuthenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        const user = await prisma_1.default.user.findUnique({ where: { id: decoded.userId } });
        if (user) {
            req.user = user;
        }
        next();
    }
    catch (error) {
        // If token is invalid, we just treat them as guest
        next();
    }
};
exports.optionalAuthenticate = optionalAuthenticate;
