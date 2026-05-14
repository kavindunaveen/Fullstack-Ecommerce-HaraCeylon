import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import morgan from 'morgan';
import prisma from './prisma';

dotenv.config();

const app = express();
const port = process.env.PORT || 8001;

// Production CORS configuration
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));

app.use(express.json());
app.use(morgan('dev'));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

import authRoutes from './routes/auth';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import accountRoutes from './routes/account';
import adminRoutes from './routes/admin';
import shippingRoutes from './routes/shipping';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running correctly.' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/shipping', shippingRoutes);


// ───────────────────────────────────────────────
// Products API
// ───────────────────────────────────────────────
// Helper to format a product for the frontend
const formatProduct = (p: any, detail = false) => {
  const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';
  const formatImg = (img: any) => {
    if (!img) return null;
    let url = img.imageUrl;
    if (url && !url.startsWith('http')) {
      url = `${BACKEND_URL}${url}`;
    }
    return { image_url: url, is_main: img.isMain, alt_text: p.name };
  };
  const mainImg = p.images?.find((img: any) => img.isMain) || p.images?.[0] || null;
  const base: any = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category_name: p.category?.name,
    category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
    base_price: p.basePrice,
    effective_price: p.effectivePrice,
    price: p.basePrice,
    discount_percentage: p.basePrice > p.effectivePrice
      ? Math.round((1 - p.effectivePrice / p.basePrice) * 100)
      : 0,
    main_image: formatImg(mainImg),
  };
  if (detail) {
    base.description = p.description;
    base.short_description = p.description;
    base.stock_quantity = p.stock;
    base.stock = p.stock;
    base.stock_status = p.stock > 0 ? 'in_stock' : 'out_of_stock';
    base.images = (p.images || []).map(formatImg);
  }
  return base;
};

app.get('/api/products', async (req, res) => {
  try {
    const { search, category, ids } = req.query;
    const whereClause: any = {};
    if (search && typeof search === 'string') {
      whereClause.name = { contains: search };
    }
    if (category && typeof category === 'string') {
      whereClause.category = { slug: category };
    }
    if (ids && typeof ids === 'string') {
      whereClause.id = { in: ids.split(',') };
    }
    const products = await prisma.product.findMany({
      where: whereClause,
      include: { category: true, images: true }
    });
    res.json({ results: products.map(p => formatProduct(p)) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Featured Products
app.get('/api/products/featured', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      include: { category: true, images: true }
    });
    res.json({ results: products.map(p => formatProduct(p)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// New Arrivals
app.get('/api/products/new-arrivals', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isNewArrival: true },
      include: { category: true, images: true }
    });
    res.json({ results: products.map(p => formatProduct(p)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Best Sellers
app.get('/api/products/best-sellers', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { isBestSeller: true },
      include: { category: true, images: true }
    });
    res.json({ results: products.map(p => formatProduct(p)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

app.get('/api/products/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json({ results: categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Product Detail
app.get('/api/products/:slug', async (req, res): Promise<any> => {
  try {
    const slug = req.params.slug as string;
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true, images: true }
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(formatProduct(product, true));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
