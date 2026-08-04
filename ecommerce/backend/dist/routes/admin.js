"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt = __importStar(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const path_1 = __importDefault(require("path"));
const multer_1 = __importDefault(require("multer"));
const crypto_1 = __importDefault(require("crypto"));
const auth_1 = require("../middleware/auth");
const utils_1 = require("../utils");
const email_1 = require("../utils/email");
const router = (0, express_1.Router)();
// Configure Multer for local storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path_1.default.join(__dirname, '../../uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path_1.default.extname(file.originalname));
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for all files
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|mp4|webm/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        if (mimetype && extname)
            return cb(null, true);
        cb(new Error('Format not supported. Please upload optimized WebP/JPG/PNG or MP4/WebM videos under 10MB.'));
    }
});
// Admin Setup Route (TEMPORARY - hit this in the browser once)
router.get('/setup', async (req, res) => {
    try {
        const email = 'admin@haraceylon.com';
        const password = 'HaraAdmin123!';
        let admin = await prisma_1.default.user.findUnique({ where: { email } });
        const passwordHash = await bcrypt.hash(password, 10);
        if (admin) {
            await prisma_1.default.user.update({
                where: { email },
                data: { role: 'ADMIN', isVerified: true, passwordHash }
            });
            return res.json({ message: 'Admin existed. Role elevated and password forcefully reset.', email, password });
        }
        admin = await prisma_1.default.user.create({
            data: {
                email,
                passwordHash,
                firstName: 'Hara',
                lastName: 'Admin',
                role: 'ADMIN',
                isVerified: true
            }
        });
        res.json({ message: 'New Admin created successfully', email, password });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Middleware to ensure user is an ADMIN
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};
// Admin Login (Email/Password)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password required' });
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        if (user.role !== 'ADMIN' || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid admin credentials' });
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid)
            return res.status(401).json({ error: 'Invalid admin credentials' });
        const accessToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_ACCESS_SECRET, { expiresIn: '2h' });
        const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
        // Store refresh token
        await prisma_1.default.refreshToken.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed: ' + (error instanceof Error ? error.message : String(error)) });
    }
});
router.use(auth_1.authenticate, requireAdmin);
// Admin Dashboard Stats
router.get('/stats', async (req, res) => {
    try {
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
        // Run all queries in parallel for maximum speed
        const [totalOrders, activeProducts, totalCustomers, revenueAgg, recentOrders, todayOrders, newCustomersToday, todayRevenueAgg, lowStockProducts] = await Promise.all([
            prisma_1.default.order.count(),
            prisma_1.default.product.count(),
            prisma_1.default.user.count({ where: { role: 'CUSTOMER' } }),
            prisma_1.default.order.aggregate({ _sum: { totalAmount: true } }),
            prisma_1.default.order.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { firstName: true, lastName: true } } }
            }),
            prisma_1.default.order.count({ where: { createdAt: { gte: todayStart } } }),
            prisma_1.default.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: todayStart } } }),
            prisma_1.default.order.aggregate({
                where: { createdAt: { gte: todayStart } },
                _sum: { totalAmount: true }
            }),
            prisma_1.default.product.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load admin stats' });
    }
});
// Admin Products List
router.get('/products', async (req, res) => {
    try {
        const products = await prisma_1.default.product.findMany({
            include: { category: true, images: true },
            orderBy: { createdAt: 'desc' }
        });
        // Format to include absolute image URLs
        const formattedProducts = products.map(p => {
            const mainImg = p.images.find(img => img.isMain) || p.images[0];
            return {
                ...p,
                imageUrl: mainImg ? (0, utils_1.toAbsoluteUrl)(mainImg.imageUrl) : null
            };
        });
        res.json({ products: formattedProducts });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// Admin Product Detail (by ID)
router.get('/products/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const product = await prisma_1.default.product.findUnique({
            where: { id },
            include: { category: true, images: true }
        });
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        const mainImg = product.images.find(img => img.isMain) || product.images[0];
        res.json({
            ...product,
            imageUrl: mainImg ? (0, utils_1.toAbsoluteUrl)(mainImg.imageUrl) : null
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});
// Admin Add Product
router.post('/products', async (req, res) => {
    try {
        const { name, slug, sku, description, basePrice, effectivePrice, stock, categoryId, imageUrl, isFeatured, isNewArrival, isBestSeller } = req.body;
        // Auto-generate SKU if not provided
        const finalSku = sku ? sku : `HARA-${crypto_1.default.randomBytes(3).toString('hex').toUpperCase()}`;
        const product = await prisma_1.default.product.create({
            data: {
                name,
                slug,
                sku: finalSku,
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});
// Admin Update Product
router.put('/products/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, slug, sku, description, basePrice, effectivePrice, stock, categoryId, imageUrl, isFeatured, isNewArrival, isBestSeller } = req.body;
        // Update basic product info
        const product = await prisma_1.default.product.update({
            where: { id },
            data: {
                name,
                slug,
                sku,
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
            const existingImage = await prisma_1.default.productImage.findFirst({
                where: { productId: id, isMain: true }
            });
            if (existingImage) {
                await prisma_1.default.productImage.update({
                    where: { id: existingImage.id },
                    data: { imageUrl }
                });
            }
            else {
                await prisma_1.default.productImage.create({
                    data: { productId: id, imageUrl, isMain: true }
                });
            }
        }
        res.json(product);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});
// Admin Export Orders to CSV
router.get('/orders/export', async (req, res) => {
    try {
        const orders = await prisma_1.default.order.findMany({
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
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export orders' });
    }
});
// Admin Orders List
router.get('/orders', async (req, res) => {
    try {
        const orders = await prisma_1.default.order.findMany({
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                items: { include: { product: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ orders });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
// Admin Update Order Status
router.patch('/orders/:id/status', async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const order = await prisma_1.default.order.update({
            where: { id },
            data: { status }
        });
        // Send email notification if shipped or delivered
        // Assuming schema was updated, but fallback gracefully if customerEmail doesn't exist yet in the types
        const customerEmail = order.customerEmail;
        if (customerEmail) {
            await (0, email_1.sendOrderStatusEmail)(customerEmail, order.shippingName, order.orderNumber, status);
        }
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});
// Admin Delete Product
router.delete('/products/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_1.default.product.delete({ where: { id } });
        res.json({ message: 'Product deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});
// Admin Users List
router.get('/users', async (req, res) => {
    try {
        const users = await prisma_1.default.user.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Admin Update User Role
router.patch('/users/:id/role', async (req, res) => {
    try {
        const id = req.params.id;
        const { role } = req.body;
        if (!['CUSTOMER', 'ADMIN'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }
        const user = await prisma_1.default.user.update({
            where: { id },
            data: { role },
            select: { id: true, email: true, role: true }
        });
        res.json(user);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update user role' });
    }
});
// Admin Seed Route (For testing only — requires admin auth)
router.post('/seed', async (req, res) => {
    try {
        const category1 = await prisma_1.default.category.upsert({
            where: { slug: 'black-tea' },
            update: {},
            create: { name: 'Black Tea', slug: 'black-tea', description: 'Premium Ceylon Black Tea' }
        });
        const category2 = await prisma_1.default.category.upsert({
            where: { slug: 'green-tea' },
            update: {},
            create: { name: 'Green Tea', slug: 'green-tea', description: 'Organic Ceylon Green Tea' }
        });
        const product1 = await prisma_1.default.product.upsert({
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
        const product2 = await prisma_1.default.product.upsert({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Seed failed' });
    }
});
// Admin Account Setup (Sets or updates admin password)
router.post('/setup-account', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ error: 'Email and password required' });
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await prisma_1.default.user.upsert({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Setup failed' });
    }
});
// Admin Image Upload
router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'No file uploaded' });
        // Return the relative URL
        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ imageUrl });
    }
    catch (error) {
        res.status(500).json({ error: error.message || 'Upload failed' });
    }
});
// ── Category Management ─────────────────────────────────────
// List all categories (admin)
router.get('/categories', async (req, res) => {
    try {
        const categories = await prisma_1.default.category.findMany({
            orderBy: { name: 'asc' },
            include: { _count: { select: { products: true } } }
        });
        res.json({ categories });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});
// Create category
router.post('/categories', async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        if (!name || !slug)
            return res.status(400).json({ error: 'Name and slug are required' });
        const existing = await prisma_1.default.category.findUnique({ where: { slug } });
        if (existing)
            return res.status(400).json({ error: 'A category with this slug already exists' });
        const category = await prisma_1.default.category.create({
            data: { name, slug, description }
        });
        res.status(201).json(category);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});
// Update category
router.put('/categories/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, slug, description } = req.body;
        const category = await prisma_1.default.category.update({
            where: { id },
            data: { name, slug, description }
        });
        res.json(category);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});
// Delete category
router.delete('/categories/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await prisma_1.default.category.delete({ where: { id } });
        res.json({ message: 'Category deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});
// ── Hero Slides CMS ──────────────────────────────────────────
// Get all slides (admin view)
router.get('/hero-slides', async (req, res) => {
    try {
        const slides = await prisma_1.default.heroSlide.findMany({
            orderBy: { orderIndex: 'asc' }
        });
        res.json(slides);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch hero slides' });
    }
});
// Create a slide
router.post('/hero-slides', async (req, res) => {
    try {
        const { title, subtitle, tagline, caption, mediaUrl, mediaType, buttonText, buttonLink, isActive, orderIndex } = req.body;
        const slide = await prisma_1.default.heroSlide.create({
            data: {
                title,
                subtitle: subtitle || null,
                tagline: tagline || null,
                caption: caption || null,
                mediaUrl,
                mediaType: mediaType || 'image',
                buttonText: buttonText || 'Shop Collection',
                buttonLink: buttonLink || '/products',
                isActive: isActive !== false,
                orderIndex: Number(orderIndex) || 0,
            }
        });
        res.status(201).json(slide);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create hero slide' });
    }
});
// Update a slide
router.put('/hero-slides/:id', async (req, res) => {
    try {
        const { title, subtitle, tagline, caption, mediaUrl, mediaType, buttonText, buttonLink, isActive, orderIndex } = req.body;
        const slide = await prisma_1.default.heroSlide.update({
            where: { id: req.params.id },
            data: {
                title,
                subtitle: subtitle || null,
                tagline: tagline || null,
                caption: caption || null,
                mediaUrl,
                mediaType,
                buttonText,
                buttonLink,
                isActive,
                orderIndex: Number(orderIndex),
            }
        });
        res.json(slide);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update hero slide' });
    }
});
// Delete a slide
router.delete('/hero-slides/:id', async (req, res) => {
    try {
        await prisma_1.default.heroSlide.delete({ where: { id: req.params.id } });
        res.json({ message: 'Slide deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete hero slide' });
    }
});
// Reorder slides
router.put('/hero-slides/reorder/batch', async (req, res) => {
    try {
        const { orderedIds } = req.body; // Array of slide IDs in the new order
        if (!Array.isArray(orderedIds))
            return res.status(400).json({ error: 'Invalid payload' });
        // Update each slide's orderIndex inside a transaction
        await prisma_1.default.$transaction(orderedIds.map((id, index) => prisma_1.default.heroSlide.update({
            where: { id },
            data: { orderIndex: index }
        })));
        res.json({ message: 'Slides reordered' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to reorder hero slides' });
    }
});
exports.default = router;
