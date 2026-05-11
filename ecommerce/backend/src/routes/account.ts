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

// Get User Orders
router.get('/orders/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: { images: true }
            }
          }
        }
      }
    });

    // Format for frontend
    const formattedOrders = orders.map(order => ({
      order_number: order.orderNumber,
      order_status: order.status,
      created_at: order.createdAt,
      grand_total: order.totalAmount,
      items: order.items.map(item => ({
        product_name_snapshot: item.product.name,
        image_url_snapshot: item.product.images.find(i => i.isMain)?.imageUrl || item.product.images[0]?.imageUrl,
        quantity: item.quantity,
        price: item.price
      }))
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
