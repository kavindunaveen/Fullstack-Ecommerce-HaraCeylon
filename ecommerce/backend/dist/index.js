"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const child_process_1 = require("child_process");
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const prisma_1 = __importDefault(require("./prisma"));
const auth_1 = require("./middleware/auth");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8001;
// Express 5 defaults to strict routing (trailing slash matters).
// Disable it so /path and /path/ are treated identically.
app.set('strict routing', false);
// ── Compression middleware ─────────────────────────────────────
// Gzip/Brotli all responses — typically reduces JSON payload by 60-80%
app.use((0, compression_1.default)());
// ── CORS ───────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000').split(',');
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID', 'X-Currency', 'Accept-Language']
}));
app.use(express_1.default.json());
// ── Logging ────────────────────────────────────────────────────
// Use verbose logging in dev, compact in production (saves CPU + disk I/O)
if (process.env.NODE_ENV !== 'production') {
    app.use((0, morgan_1.default)('dev'));
}
else {
    app.use((0, morgan_1.default)('combined'));
}
// Ensure uploads directory exists
const uploadsDir = path_1.default.join(__dirname, '../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
// Serve uploaded files
app.use('/uploads', express_1.default.static(uploadsDir));
const auth_2 = __importDefault(require("./routes/auth"));
const cart_1 = __importDefault(require("./routes/cart"));
const orders_1 = __importDefault(require("./routes/orders"));
const account_1 = __importDefault(require("./routes/account"));
const admin_1 = __importDefault(require("./routes/admin"));
const shipping_1 = __importDefault(require("./routes/shipping"));
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running correctly.' });
});
// ───────────────────────────────────────────────
// TEMPORARY MIGRATION ENDPOINT (for Hostinger)
// ───────────────────────────────────────────────
app.get('/api/migrate', (req, res) => {
    (0, child_process_1.exec)(`${process.execPath} node_modules/prisma/build/index.js db push`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Migration error: ${error.message}`);
            return res.status(500).json({ error: error.message, stderr });
        }
        res.json({ message: 'Migration successful!', stdout });
    });
});
// API Routes
app.use('/api/auth', auth_2.default);
app.use('/api/cart', cart_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/account', account_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/shipping', shipping_1.default);
// ───────────────────────────────────────────────
// Products API
// ───────────────────────────────────────────────
// Helper to format a product for the frontend
const formatProduct = (p, detail = false) => {
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';
    const formatImg = (img) => {
        if (!img)
            return null;
        let url = img.imageUrl;
        if (url && !url.startsWith('http') && url.startsWith('/uploads')) {
            url = `${BACKEND_URL}${url}`;
        }
        return { image_url: url, is_main: img.isMain, alt_text: p.name };
    };
    const mainImg = p.images?.find((img) => img.isMain) || p.images?.[0] || null;
    const base = {
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
        base.reviews = (p.reviews || []).map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            user_name: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Guest',
            created_at: r.createdAt
        }));
    }
    return base;
};
// ── Cache-Control helper ───────────────────────────────────────
// Adds HTTP caching headers so browsers and CDNs cache the response.
// max-age=60: fresh for 60s; stale-while-revalidate=300: serve stale for 5min while revalidating in BG
const setProductCache = (res) => {
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
};
// ── Products list (with pagination) ───────────────────────────
app.get('/api/products', async (req, res) => {
    try {
        const { search, category, ids, page, limit } = req.query;
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, parseInt(limit) || 20);
        const whereClause = {};
        if (search && typeof search === 'string') {
            whereClause.name = { contains: search };
        }
        if (category && typeof category === 'string') {
            whereClause.category = { slug: category };
        }
        if (ids && typeof ids === 'string') {
            whereClause.id = { in: ids.split(',') };
        }
        const [products, total] = await Promise.all([
            prisma_1.default.product.findMany({
                where: whereClause,
                include: { category: true, images: true },
                orderBy: { createdAt: 'desc' },
                take: limitNum,
                skip: (pageNum - 1) * limitNum,
            }),
            prisma_1.default.product.count({ where: whereClause }),
        ]);
        setProductCache(res);
        res.json({
            results: products.map(p => formatProduct(p)),
            count: total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// Featured Products (accept both /featured and /featured/)
const featuredHandler = async (req, res) => {
    try {
        const products = await prisma_1.default.product.findMany({
            where: { isFeatured: true },
            include: { category: true, images: true }
        });
        setProductCache(res);
        res.json({ results: products.map((p) => formatProduct(p)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
app.get('/api/products/featured', featuredHandler);
app.get('/api/products/featured/', featuredHandler);
// New Arrivals (accept both /new-arrivals and /new-arrivals/)
const newArrivalsHandler = async (req, res) => {
    try {
        const products = await prisma_1.default.product.findMany({
            where: { isNewArrival: true },
            include: { category: true, images: true }
        });
        setProductCache(res);
        res.json({ results: products.map((p) => formatProduct(p)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
app.get('/api/products/new-arrivals', newArrivalsHandler);
app.get('/api/products/new-arrivals/', newArrivalsHandler);
// Best Sellers (accept both /best-sellers and /best-sellers/)
const bestSellersHandler = async (req, res) => {
    try {
        const products = await prisma_1.default.product.findMany({
            where: { isBestSeller: true },
            include: { category: true, images: true }
        });
        setProductCache(res);
        res.json({ results: products.map((p) => formatProduct(p)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
};
app.get('/api/products/best-sellers', bestSellersHandler);
app.get('/api/products/best-sellers/', bestSellersHandler);
// Categories (accept both /categories and /categories/)
const categoriesHandler = async (req, res) => {
    try {
        const categories = await prisma_1.default.category.findMany();
        // Categories rarely change — cache for longer
        res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
        res.json({ results: categories });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
};
app.get('/api/products/categories', categoriesHandler);
app.get('/api/products/categories/', categoriesHandler);
// Product Detail
app.get('/api/products/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;
        const product = await prisma_1.default.product.findUnique({
            where: { slug },
            include: {
                category: true,
                images: true,
                reviews: { include: { user: true }, orderBy: { createdAt: 'desc' } }
            }
        });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        setProductCache(res);
        res.json(formatProduct(product, true));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed' });
    }
});
// Submit Product Review
app.post('/api/products/:slug/reviews', auth_1.authenticate, async (req, res) => {
    try {
        const slug = req.params.slug;
        const { rating, comment } = req.body;
        const userId = req.user.id;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Valid rating (1-5) is required' });
        }
        const product = await prisma_1.default.product.findUnique({ where: { slug } });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        // Ensure user hasn't already reviewed
        const existing = await prisma_1.default.review.findFirst({
            where: { productId: product.id, userId }
        });
        if (existing) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }
        const review = await prisma_1.default.review.create({
            data: {
                rating: Number(rating),
                comment,
                userId,
                productId: product.id
            },
            include: { user: true }
        });
        res.json({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            user_name: `${review.user.firstName} ${review.user.lastName}`,
            created_at: review.createdAt
        });
    }
    catch (error) {
        console.error('Failed to submit review:', error);
        res.status(500).json({ error: 'Failed to submit review' });
    }
});
// ───────────────────────────────────────────────
// Stub routes — called by frontend but lightweight
// ───────────────────────────────────────────────
// Currencies list (used by currency switcher)
app.get('/api/products/currencies', (req, res) => {
    // Currencies are static — cache for a long time
    res.setHeader('Cache-Control', 'public, max-age=3600');
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
    res.setHeader('Cache-Control', 'public, max-age=3600');
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
const PAGES = {
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
app.get('/api/pages/:slug/', (req, res) => {
    const page = PAGES[req.params.slug];
    if (!page)
        return res.status(404).json({ error: 'Page not found' });
    res.setHeader('Cache-Control', 'public, max-age=300');
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
