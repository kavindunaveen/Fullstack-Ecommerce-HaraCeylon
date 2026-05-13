import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import rateLimit from 'express-rate-limit';

const router = Router();

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

// Register
router.post('/registration/', authLimiter, async (req, res): Promise<any> => {
  try {
    const { email, password, firstName, lastName } = req.body;
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();

    if (!trimmedEmail || !trimmedPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    const passwordHash = await bcrypt.hash(trimmedPassword, 10);
    const user = await prisma.user.create({
      data: { email: trimmedEmail, passwordHash, firstName, lastName }
    });

    const tokens = await generateTokens(user.id);
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login/', authLimiter, async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();

    const user = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(trimmedPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
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

export default router;
