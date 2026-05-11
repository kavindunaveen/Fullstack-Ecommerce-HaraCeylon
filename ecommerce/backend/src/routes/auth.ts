import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const router = Router();

const generateTokens = (userId: string) => {
  const access = jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
  const refresh = jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  return { access, refresh };
};

// Register
router.post('/registration/', async (req, res): Promise<any> => {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login/', async (req, res): Promise<any> => {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh Token
router.post('/token/refresh/', async (req, res): Promise<any> => {
  try {
    const { refresh } = req.body;
    if (!refresh) return res.status(400).json({ error: 'Refresh token required' });

    const decoded = jwt.verify(refresh, process.env.JWT_SECRET as string) as { userId: string };
    const access = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
    
    res.json({ access });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
