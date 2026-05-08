import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Get User Profile
router.get('/user/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      is_staff: user.role === 'ADMIN',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update User
router.patch('/user/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { first_name, last_name } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName: first_name !== undefined ? first_name : undefined,
        lastName: last_name !== undefined ? last_name : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      }
    });

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      is_staff: user.role === 'ADMIN',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
