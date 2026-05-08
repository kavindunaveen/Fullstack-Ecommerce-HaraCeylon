import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import prisma from './prisma';

dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

import authRoutes from './routes/auth';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import accountRoutes from './routes/account';
import adminRoutes from './routes/admin';

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


// ───────────────────────────────────────────────
// Products API
// ───────────────────────────────────────────────
// Helper to format a product for the frontend
const formatProduct = (p: any, detail = false) => {
  const formatImg = (img: any) => img ? { image_url: img.imageUrl, is_main: img.isMain, alt_text: p.name } : null;
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
    const { search, category } = req.query;
    const whereClause: any = {};
    if (search && typeof search === 'string') {
      whereClause.name = { contains: search };
    }
    if (category && typeof category === 'string') {
      whereClause.category = { slug: category };
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

// Product Detail — must come BEFORE /categories route to avoid slug conflict
app.get('/api/products/:slug', async (req, res): Promise<any> => {
  try {
    const slug = req.params.slug as string;
    // Skip if it's actually the 'categories' sub-route
    if (slug === 'categories') return res.status(404).json({ error: 'Not found' });
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

app.get('/api/products/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json({ results: categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// ───────────────────────────────────────────────
// Admin Seed Route (For testing only)
// ───────────────────────────────────────────────
app.post('/api/admin/seed', async (req, res) => {
  try {
    const category1 = await prisma.category.create({
      data: { name: 'Black Tea', slug: 'black-tea', description: 'Premium Ceylon Black Tea' }
    });
    
    const category2 = await prisma.category.create({
      data: { name: 'Green Tea', slug: 'green-tea', description: 'Organic Ceylon Green Tea' }
    });

    const product1 = await prisma.product.create({
      data: {
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

    const product2 = await prisma.product.create({
      data: {
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

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
