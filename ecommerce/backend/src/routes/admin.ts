import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Middleware to ensure user is an ADMIN
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// Admin Dashboard Stats
router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const totalOrders = await prisma.order.count();
    const activeProducts = await prisma.product.count();
    const totalCustomers = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    
    const orders = await prisma.order.findMany({ select: { totalAmount: true } });
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

    // Recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    });

    const formattedRecentOrders = recentOrders.map(order => ({
      id: order.orderNumber,
      customer: order.user ? `${order.user.firstName} ${order.user.lastName}` : order.shippingName,
      date: order.createdAt,
      total: order.totalAmount,
      status: order.status,
      currency: order.currency
    }));

    res.json({
      stats: {
        totalRevenue,
        totalOrders,
        activeProducts,
        totalCustomers,
      },
      recentOrders: formattedRecentOrders
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to load admin stats' });
  }
});

// Admin Products List
router.get('/products', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, images: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Admin Add Product
router.post('/products', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { name, slug, description, basePrice, effectivePrice, stock, categoryId, imageUrl, isFeatured, isNewArrival, isBestSeller } = req.body;
    
    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        basePrice: Number(basePrice),
        effectivePrice: Number(effectivePrice),
        stock: Number(stock),
        categoryId,
        isFeatured: Boolean(isFeatured),
        isNewArrival: Boolean(isNewArrival),
        isBestSeller: Boolean(isBestSeller),
        images: imageUrl ? { create: [{ imageUrl, isMain: true }] } : undefined
      }
    });
    res.status(201).json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Admin Update Product
router.put('/products/:id', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { name, slug, description, basePrice, effectivePrice, stock, categoryId, imageUrl, isFeatured, isNewArrival, isBestSeller } = req.body;
    
    // Update basic product info
    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        basePrice: Number(basePrice),
        effectivePrice: Number(effectivePrice),
        stock: Number(stock),
        categoryId,
        isFeatured: Boolean(isFeatured),
        isNewArrival: Boolean(isNewArrival),
        isBestSeller: Boolean(isBestSeller),
      }
    });

    // If a new imageUrl is provided, we can either add it or update the main one
    if (imageUrl) {
      const existingImage = await prisma.productImage.findFirst({
        where: { productId: id, isMain: true }
      });
      if (existingImage) {
        await prisma.productImage.update({
          where: { id: existingImage.id },
          data: { imageUrl }
        });
      } else {
        await prisma.productImage.create({
          data: { productId: id, imageUrl, isMain: true }
        });
      }
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Admin Orders List
router.get('/orders', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        items: { include: { product: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ orders });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Admin Update Order Status
router.patch('/orders/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;
    
    const order = await prisma.order.update({
      where: { id },
      data: { status }
    });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// Admin Delete Product
router.delete('/products/:id', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const id = req.params.id as string;
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Admin Users List
router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        _count: { select: { orders: true } }
      }
    });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Admin Update User Role
router.patch('/users/:id/role', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { role } = req.body;
    
    if (!['CUSTOMER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

export default router;
