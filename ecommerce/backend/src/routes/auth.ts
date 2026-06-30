import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../prisma';
import rateLimit from 'express-rate-limit';

const router = Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Rate limiter for authentication routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const generateTokens = async (userId: string) => {
  const access = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });
  const refresh = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
  
  // Store refresh token in database for server-side invalidation
  await prisma.refreshToken.create({
    data: {
      token: refresh,
      userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });

  return { access, refresh };
};

// Google SSO Login/Registration
router.post('/google/', authLimiter, async (req, res): Promise<any> => {
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
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
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
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(500).json({ error: 'Google authentication failed', details: error.message, stack: error.stack });
  }
});

// Refresh Token
router.post('/token/refresh/', authLimiter, async (req, res): Promise<any> => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ error: 'Refresh token required' });

    // Verify refresh token exists in database (has not been invalidated)
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refresh }
    });

    if (!storedToken) {
      return res.status(401).json({ error: 'Refresh token is invalid or has been revoked' });
    }

    const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET as string) as { userId: string };
    const access = jwt.sign({ userId: decoded.userId }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '15m' });
    
    res.json({ access });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout — invalidates the refresh token on the server
router.post('/logout/', async (req, res): Promise<any> => {
  try {
    const { refresh } = req.body;
    if (refresh) {
      // Remove the refresh token from the database to invalidate it
      await prisma.refreshToken.deleteMany({
        where: { token: refresh }
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ── Email / Password Registration ────────────────────────────
router.post('/registration/', authLimiter, async (req, res): Promise<any> => {
  try {
    const { email, password, first_name = '', last_name = '' } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName: first_name,
        lastName: last_name,
        role: 'CUSTOMER',
      }
    });

    const tokens = await generateTokens(user.id);
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        is_staff: false,
      },
      ...tokens
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// ── Email / Password Login ─────────────────────────────────
router.post('/login/', authLimiter, async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      // Don't reveal whether email exists; generic message
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const tokens = await generateTokens(user.id);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        is_staff: user.role === 'ADMIN',
      },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export default router;
