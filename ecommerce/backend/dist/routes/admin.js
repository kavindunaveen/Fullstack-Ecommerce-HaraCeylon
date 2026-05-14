"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Middleware to ensure user is an ADMIN
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
};
// Admin Dashboard Stats
router.get('/stats', auth_1.authenticate, requireAdmin, async (req, res) => {
    try {
        const totalOrders = await prisma_1.default.order.count();
        const activeProducts = await prisma_1.default.product.count();
        const totalCustomers = await prisma_1.default.user.count({ where: { role: 'CUSTOMER' } });
        const orders = await prisma_1.default.order.findMany({ select: { totalAmount: true } });
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        // Recent orders
        const recentOrders = await prisma_1.default.order.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load admin stats' });
    }
});
// Admin Products List
router.get('/products', auth_1.authenticate, requireAdmin, async (req, res) => {
    try {
        const products = await prisma_1.default.product.findMany({
            include: { category: true, images: true },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ products });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});
// Admin Add Product
router.post('/products', auth_1.authenticate, requireAdmin, async (req, res) => {
    try {
        const { name, slug, description, basePrice, effectivePrice, stock, categoryId, imageUrl, isFeatured, isNewArrival, isBestSeller } = req.body;
        const product = await prisma_1.default.product.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});
// Admin Update Product
router.put('/products/:id', auth_1.authenticate, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const { name, slug, description, basePrice, effectivePrice, stock, categoryId, imageUrl, isFeatured, isNewArrival, isBestSeller } = req.body;
        // Update basic product info
        const product = await prisma_1.default.product.update({
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
// Admin Orders List
router.get('/orders', auth_1.authenticate, requireAdmin, async (req, res) => {
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
router.patch('/orders/:id/status', auth_1.authenticate, requireAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const order = await prisma_1.default.order.update({
            where: { id },
            data: { status }
        });
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update order status' });
    }
});
// Admin Delete Product
router.delete('/products/:id', auth_1.authenticate, requireAdmin, async (req, res) => {
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
router.get('/users', auth_1.authenticate, requireAdmin, async (req, res) => {
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
router.patch('/users/:id/role', auth_1.authenticate, requireAdmin, async (req, res) => {
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
router.post('/seed', auth_1.authenticate, requireAdmin, async (req, res) => {
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
exports.default = router;
