import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

export interface AuthRequest extends Request {
  user?: any;
}

// ── In-memory user cache ────────────────────────────────────────
// Avoids a DB lookup on every authenticated request.
// Users are cached for 5 minutes; cache is invalidated on logout.
const userCache = new Map<string, { user: any; expiresAt: number }>();
const USER_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getCachedUser = (userId: string) => {
  const cached = userCache.get(userId);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    userCache.delete(userId);
    return null;
  }
  return cached.user;
};

const setCachedUser = (userId: string, user: any) => {
  userCache.set(userId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
};

export const invalidateUserCache = (userId: string) => {
  userCache.delete(userId);
};

// ── Authenticate (required) ──────────────────────────────────────
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as { userId: string };

    // Check cache first — avoids DB roundtrip on every authenticated request
    let user = getCachedUser(decoded.userId);
    if (!user) {
      user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user) setCachedUser(decoded.userId, user);
    }

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
};

// ── Optional Authenticate (for guest-compatible routes) ──────────
export const optionalAuthenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET as string) as { userId: string };

    // Check cache first
    let user = getCachedUser(decoded.userId);
    if (!user) {
      user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (user) setCachedUser(decoded.userId, user);
    }

    if (user) {
      req.user = user;
    }
    next();
  } catch (error) {
    // If token is invalid, treat as guest
    next();
  }
};
