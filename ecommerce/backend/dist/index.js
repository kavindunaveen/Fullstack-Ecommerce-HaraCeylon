"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const morgan_1 = __importDefault(require("morgan"));
const prisma_1 = __importDefault(require("./prisma"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 8000;
app.use((0, cors_1.default)({ origin: ['http://localhost:3000', 'https://haraceylon.com'], credentials: true }));
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
const auth_1 = __importDefault(require("./routes/auth"));
const cart_1 = __importDefault(require("./routes/cart"));
const orders_1 = __importDefault(require("./routes/orders"));
const account_1 = __importDefault(require("./routes/account"));
const admin_1 = __importDefault(require("./routes/admin"));
const shipping_1 = __importDefault(require("./routes/shipping"));
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running correctly.' });
});
// API Routes
app.use('/api/auth', auth_1.default);
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
    const formatImg = (img) => img ? { image_url: img.imageUrl, is_main: img.isMain, alt_text: p.name } : null;
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
    }
    return base;
};
app.get('/api/products', async (req, res) => {
    try {
        const { search, category } = req.query;
        const whereClause = {};
        if (search && typeof search === 'string') {
            whereClause.name = { contains: search };
        }
        if (category && typeof category === 'string') {
            whereClause.category = { slug: category };
        }
        const products = await prisma_1.default.product.findMany({
            where: whereClause,
            include: { category: true, images: true }
        });
        res.json({ results: products.map(p => formatProduct(p)) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// Featured Products
app.get('/api/products/featured', async (req, res) => {
    try {
        const products = await prisma_1.default.product.findMany({
            where: { isFeatured: true },
            include: { category: true, images: true }
        });
        res.json({ results: products.map(p => formatProduct(p)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
// New Arrivals
app.get('/api/products/new-arrivals', async (req, res) => {
    try {
        const products = await prisma_1.default.product.findMany({
            where: { isNewArrival: true },
            include: { category: true, images: true }
        });
        res.json({ results: products.map(p => formatProduct(p)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
// Best Sellers
app.get('/api/products/best-sellers', async (req, res) => {
    try {
        const products = await prisma_1.default.product.findMany({
            where: { isBestSeller: true },
            include: { category: true, images: true }
        });
        res.json({ results: products.map(p => formatProduct(p)) });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
app.get('/api/products/categories', async (req, res) => {
    try {
        const categories = await prisma_1.default.category.findMany();
        res.json({ results: categories });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
// Product Detail
app.get('/api/products/:slug', async (req, res) => {
    try {
        const slug = req.params.slug;
        const product = await prisma_1.default.product.findUnique({
            where: { slug },
            include: { category: true, images: true }
        });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        res.json(formatProduct(product, true));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed' });
    }
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
