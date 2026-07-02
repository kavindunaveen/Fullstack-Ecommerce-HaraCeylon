import { Router } from 'express';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';
import path from 'path';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { toAbsoluteUrl } from '../utils';

const router = Router();


// Configure Multer for local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only images are allowed (jpeg, jpg, png, webp)'));
  }
});

// Middleware to ensure user is an ADMIN
const requireAdmin = (req: AuthRequest, res: any, next: any) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// Admin Login (Email/Password)
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;
    console.log('Admin login attempt for:', email);
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    
    console.log('User found:', user.email, 'Role:', user.role);

    if (user.role !== 'ADMIN' || !user.passwordHash) {
      console.log('User is not admin or has no password hash');
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    console.log('Password valid:', valid);
    
    if (!valid) return res.status(401).json({ error: 'Invalid admin credentials' });

    const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '1d' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        first_name: user.firstName,
        last_name: user.lastName,
        role: user.role,
        is_staff: true
      },
      access: accessToken,
      refresh: refreshToken
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin Dashboard Stats
router.get('/stats', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    
    // Run all queries in parallel for maximum speed
    const [
      totalOrders, 
      activeProducts, 
      totalCustomers, 
      revenueAgg, 
      recentOrders,
      todayOrders,
      newCustomersToday,
      todayRevenueAgg,
      lowStockProducts
    ] = await Promise.all([
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true } } }
      }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: todayStart } } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: todayStart } },
        _sum: { totalAmount: true }
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        select: { id: true, name: true, stock: true },
        take: 5,
        orderBy: { stock: 'asc' }
      })
    ]);

    const totalRevenue = revenueAgg._sum.totalAmount ?? 0;
    const todayRevenue = todayRevenueAgg._sum.totalAmount ?? 0;

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
        todayRevenue,
        totalOrders, 
        todayOrders,
        activeProducts, 
        totalCustomers,
        newCustomersToday,
        lowStockItems: lowStockProducts.length
      },
      recentOrders: formattedRecentOrders,
      lowStockProducts
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
    
    // Format to include absolute image URLs
    const formattedProducts = products.map(p => {
      const mainImg = p.images.find(img => img.isMain) || p.images[0];
      return {
        ...p,
        imageUrl: mainImg ? toAbsoluteUrl(mainImg.imageUrl) : null
      };
    });
    
    res.json({ products: formattedProducts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Admin Product Detail (by ID)
router.get('/products/:id', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const id = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, images: true }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const mainImg = product.images.find(img => img.isMain) || product.images[0];
    res.json({
      ...product,
      imageUrl: mainImg ? toAbsoluteUrl(mainImg.imageUrl) : null
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
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
        effectivePrice: Number(effectivePrice || basePrice),
        stock: Number(stock) || 0,
        categoryId: categoryId || null,
        isFeatured: isFeatured === true || isFeatured === 'true',
        isNewArrival: isNewArrival === true || isNewArrival === 'true',
        isBestSeller: isBestSeller === true || isBestSeller === 'true',
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
        effectivePrice: Number(effectivePrice || basePrice),
        stock: Number(stock) || 0,
        categoryId: categoryId || null,
        isFeatured: isFeatured === true || isFeatured === 'true',
        isNewArrival: isNewArrival === true || isNewArrival === 'true',
        isBestSeller: isBestSeller === true || isBestSeller === 'true',
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

// Admin Export Orders to CSV
router.get('/orders/export', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const headers = ['Order Number', 'Date', 'Customer Name', 'Customer Email', 'Status', 'Total', 'Currency', 'Payment Method'];
    const rows = orders.map(order => [
      order.orderNumber,
      order.createdAt.toISOString(),
      order.user ? `${order.user.firstName} ${order.user.lastName}` : order.shippingName,
      order.user?.email || '',
      order.status,
      order.totalAmount,
      order.currency,
      order.paymentMethod
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.attachment(`orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csvContent);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export orders' });
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

// Admin Seed Route (For testing only — requires admin auth)
router.post('/seed', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const category1 = await prisma.category.upsert({
      where: { slug: 'black-tea' },
      update: {},
      create: { name: 'Black Tea', slug: 'black-tea', description: 'Premium Ceylon Black Tea' }
    });
    
    const category2 = await prisma.category.upsert({
      where: { slug: 'green-tea' },
      update: {},
      create: { name: 'Green Tea', slug: 'green-tea', description: 'Organic Ceylon Green Tea' }
    });

    const product1 = await prisma.product.upsert({
      where: { slug: 'premium-ceylon-black' },
      update: {},
      create: {
        name: 'Premium Ceylon Black',
        slug: 'premium-ceylon-black',
        description: 'The finest black tea from the central highlands.',
        basePrice: 15.00,
        effectivePrice: 15.00,
        stock: 100,
        categoryId: category1.id,
        isFeatured: true,
        isBestSeller: true,
        images: {
          create: [{ imageUrl: '/PREMIUM-BLACK-TEA.png', isMain: true }]
        }
      }
    });

    const product2 = await prisma.product.upsert({
      where: { slug: 'organic-green-tea' },
      update: {},
      create: {
        name: 'Organic Green Tea',
        slug: 'organic-green-tea',
        description: 'Smooth and refreshing green tea.',
        basePrice: 18.00,
        effectivePrice: 18.00,
        stock: 50,
        categoryId: category2.id,
        isNewArrival: true,
        images: {
          create: [{ imageUrl: '/PREMIUM-GREEN-TEA.png', isMain: true }]
        }
      }
    });

    res.json({ message: 'Seed successful', products: [product1, product2] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Seed failed' });
  }
});

// Admin Account Setup (Sets or updates admin password)
router.post('/setup-account', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.upsert({
      where: { email },
      update: { passwordHash, role: 'ADMIN' },
      create: { 
        email, 
        passwordHash, 
        role: 'ADMIN',
        firstName: 'Store',
        lastName: 'Admin'
      }
    });

    res.json({ message: 'Admin account secured with password', email: user.email });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Setup failed' });
  }
});

// Admin Image Upload
router.post('/upload', authenticate, requireAdmin, upload.single('image'), async (req: any, res): Promise<any> => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Return the relative URL
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Upload failed' });
  }
});

// ── Category Management ─────────────────────────────────────

// List all categories (admin)
router.get('/categories', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } }
    });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/categories', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { name, slug, description } = req.body;
    if (!name || !slug) return res.status(400).json({ error: 'Name and slug are required' });

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return res.status(400).json({ error: 'A category with this slug already exists' });

    const category = await prisma.category.create({
      data: { name, slug, description }
    });
    res.status(201).json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// Update category
router.put('/categories/:id', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { name, slug, description } = req.body;
    const category = await prisma.category.update({
      where: { id },
      data: { name, slug, description }
    });
    res.json(category);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// Delete category
router.delete('/categories/:id', authenticate, requireAdmin, async (req: AuthRequest, res): Promise<any> => {
  try {
    const id = req.params.id as string;
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Category deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
