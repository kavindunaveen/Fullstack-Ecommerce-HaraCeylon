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

// Express 5 defaults to strict routing (trailing slash matters).
// Disable it so /path and /path/ are treated identically.
app.set('strict routing', false);

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
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-Currency', 'Accept-Language']
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

// Featured Products (accept both /featured and /featured/)
const featuredHandler = async (req: any, res: any) => {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true },
      include: { category: true, images: true }
    });
    res.json({ results: products.map((p: any) => formatProduct(p)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};
app.get('/api/products/featured', featuredHandler);
app.get('/api/products/featured/', featuredHandler);

// New Arrivals (accept both /new-arrivals and /new-arrivals/)
const newArrivalsHandler = async (req: any, res: any) => {
  try {
    const products = await prisma.product.findMany({
      where: { isNewArrival: true },
      include: { category: true, images: true }
    });
    res.json({ results: products.map((p: any) => formatProduct(p)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};
app.get('/api/products/new-arrivals', newArrivalsHandler);
app.get('/api/products/new-arrivals/', newArrivalsHandler);

// Best Sellers (accept both /best-sellers and /best-sellers/)
const bestSellersHandler = async (req: any, res: any) => {
  try {
    const products = await prisma.product.findMany({
      where: { isBestSeller: true },
      include: { category: true, images: true }
    });
    res.json({ results: products.map((p: any) => formatProduct(p)) });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
};
app.get('/api/products/best-sellers', bestSellersHandler);
app.get('/api/products/best-sellers/', bestSellersHandler);

// Categories (accept both /categories and /categories/)
const categoriesHandler = async (req: any, res: any) => {
  try {
    const categories = await prisma.category.findMany();
    res.json({ results: categories });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};
app.get('/api/products/categories', categoriesHandler);
app.get('/api/products/categories/', categoriesHandler);

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

// ───────────────────────────────────────────────
// Stub routes — called by frontend but lightweight
// ───────────────────────────────────────────────

// Currencies list (used by currency switcher)
app.get('/api/products/currencies', (req, res) => {
  res.json([
    { code: 'GBP', symbol: '£', name: 'British Pound', rate: 1 },
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1.27 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 1.17 },
    { code: 'LKR', symbol: '₨', name: 'Sri Lankan Rupee', rate: 385 },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.95 },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.72 },
  ]);
});
app.get('/api/products/currencies/', (req, res) => res.redirect(301, '/api/products/currencies'));

// Languages list
app.get('/api/products/languages', (req, res) => {
  res.json([{ code: 'en', name: 'English' }]);
});
app.get('/api/products/languages/', (req, res) => res.redirect(301, '/api/products/languages'));

// Brands list (not implemented — return empty)
app.get('/api/products/brands', (req, res) => res.json({ results: [] }));
app.get('/api/products/brands/', (req, res) => res.redirect(301, '/api/products/brands'));

// Coupons validate (stub — no discount applied)
app.post('/api/coupons/validate/', (req, res) => {
  res.status(400).json({ error: 'Coupon codes are not available at this time.' });
});

// Static pages (About, Terms, Privacy, Contact)
const PAGES: Record<string, { title: string; content: string }> = {
  about: {
    title: 'About HARA Ceylon',
    content: 'HARA Ceylon is a premium e-commerce platform offering the finest teas and coffees from Sri Lanka.',
  },
  terms: {
    title: 'Terms & Conditions',
    content: 'By using our website you agree to our terms and conditions. All orders are subject to availability.',
  },
  privacy: {
    title: 'Privacy Policy',
    content: 'We take your privacy seriously. We do not share your personal information with third parties.',
  },
  contact: {
    title: 'Contact Us',
    content: 'Reach us at support@haraceylon.com',
  },
};

app.get('/api/pages/:slug/', (req, res): any => {
  const page = PAGES[req.params.slug];
  if (!page) return res.status(404).json({ error: 'Page not found' });
  res.json(page);
});

// Contact form submission
app.post('/api/pages/contact/submit/', (req, res) => {
  // Log the message server-side; integrate email service later
  const { name, email, message } = req.body;
  console.log(`[Contact Form] From: ${name} <${email}>: ${message}`);
  res.json({ message: 'Thank you for your message. We will be in touch shortly.' });
});

// Newsletter subscription
app.post('/api/account/newsletter/subscribe/', (req, res) => {
  const { email } = req.body;
  console.log(`[Newsletter] Subscribed: ${email}`);
  res.json({ message: 'Successfully subscribed to our newsletter.' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
