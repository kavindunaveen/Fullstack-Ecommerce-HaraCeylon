"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_1 = require("../middleware/auth");
const utils_1 = require("../utils");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
// ── User Profile ─────────────────────────────────────────────
router.get('/user/', auth_1.authenticate, async (req, res) => {
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json({
            id: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            is_staff: user.role === 'ADMIN',
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
router.patch('/user/', auth_1.authenticate, async (req, res) => {
    try {
        const { first_name, last_name } = req.body;
        const user = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: {
                firstName: first_name !== undefined ? first_name : undefined,
                lastName: last_name !== undefined ? last_name : undefined,
            },
            select: { id: true, email: true, firstName: true, lastName: true, role: true },
        });
        res.json({
            id: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            is_staff: user.role === 'ADMIN',
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});
router.patch('/password/', auth_1.authenticate, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        if (!new_password || new_password.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // For users registered via Google (no password), current_password check is optional or handled differently.
        // Assuming they must have a password to change it, or they can set one if they don't have one.
        if (user.passwordHash) {
            if (!current_password) {
                return res.status(400).json({ error: 'Current password is required' });
            }
            const isValid = await bcryptjs_1.default.compare(current_password, user.passwordHash);
            if (!isValid) {
                return res.status(400).json({ error: 'Incorrect current password' });
            }
        }
        const passwordHash = await bcryptjs_1.default.hash(new_password, 12);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: { passwordHash }
        });
        res.json({ message: 'Password updated successfully' });
    }
    catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
});
// ── Address Helpers ──────────────────────────────────────────
const formatAddress = (addr) => ({
    id: addr.id,
    full_name: `${addr.firstName || ''} ${addr.lastName || ''}`.trim(),
    phone: addr.phone || '',
    address_line_1: addr.street,
    address_line_2: addr.addressLine2 || '',
    city: addr.city,
    state: addr.state || '',
    postal_code: addr.zipCode,
    country: addr.country,
    is_default: addr.isDefault,
});
const splitName = (full_name) => {
    const parts = (full_name || '').trim().split(' ');
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
};
// ── Address CRUD ─────────────────────────────────────────────
// GET /api/account/addresses/
router.get('/addresses/', auth_1.authenticate, async (req, res) => {
    try {
        const addresses = await prisma_1.default.address.findMany({
            where: { userId: req.user.id },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
        res.json(addresses.map(formatAddress));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch addresses' });
    }
});
// POST /api/account/addresses/
router.post('/addresses/', auth_1.authenticate, async (req, res) => {
    try {
        const { full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_default } = req.body;
        const { firstName, lastName } = splitName(full_name);
        if (is_default) {
            await prisma_1.default.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
        }
        const address = await prisma_1.default.address.create({
            data: {
                userId: req.user.id,
                firstName,
                lastName,
                phone: phone || '',
                street: address_line_1,
                addressLine2: address_line_2,
                city,
                state: state || '',
                zipCode: postal_code,
                country: country || 'GB',
                isDefault: is_default || false,
            },
        });
        res.status(201).json(formatAddress(address));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add address' });
    }
});
// PATCH /api/account/addresses/:id/
router.patch('/addresses/:id/', auth_1.authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        const { full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_default } = req.body;
        const { firstName, lastName } = splitName(full_name);
        const existing = await prisma_1.default.address.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.user.id) {
            return res.status(404).json({ error: 'Address not found' });
        }
        if (is_default) {
            await prisma_1.default.address.updateMany({
                where: { userId: req.user.id, id: { not: id } },
                data: { isDefault: false },
            });
        }
        const address = await prisma_1.default.address.update({
            where: { id },
            data: { firstName, lastName, phone: phone || '', street: address_line_1, addressLine2: address_line_2, city, state: state || '', zipCode: postal_code, country: country || 'GB', isDefault: is_default || false },
        });
        res.json(formatAddress(address));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update address' });
    }
});
// DELETE /api/account/addresses/:id/
router.delete('/addresses/:id/', auth_1.authenticate, async (req, res) => {
    try {
        const id = req.params.id;
        const existing = await prisma_1.default.address.findUnique({ where: { id } });
        if (!existing || existing.userId !== req.user.id) {
            return res.status(404).json({ error: 'Address not found' });
        }
        await prisma_1.default.address.delete({ where: { id } });
        res.json({ message: 'Address deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete address' });
    }
});
// ── Orders ───────────────────────────────────────────────────
// GET /api/account/orders/
router.get('/orders/', auth_1.authenticate, async (req, res) => {
    try {
        const orders = await prisma_1.default.order.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            include: { items: { include: { product: { include: { images: true } } } } },
        });
        res.json(orders.map(order => ({
            order_number: order.orderNumber,
            order_status: order.status,
            created_at: order.createdAt,
            grand_total: order.paidAmount ?? order.totalAmount,
            currency: order.currency,
            items: order.items.map(item => ({
                product_name_snapshot: item.product?.name || 'Unknown Product',
                image_url_snapshot: (0, utils_1.toAbsoluteUrl)(item.product?.images?.find(i => i.isMain)?.imageUrl || item.product?.images?.[0]?.imageUrl || null),
                quantity: item.quantity,
                price: item.price,
            })),
        })));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});
// GET /api/account/orders/:orderNumber/
router.get('/orders/:orderNumber/', auth_1.authenticate, async (req, res) => {
    try {
        const orderNumber = req.params.orderNumber;
        const order = await prisma_1.default.order.findUnique({
            where: { orderNumber },
            include: { items: { include: { product: { include: { images: true } } } } },
        });
        if (!order)
            return res.status(404).json({ error: 'Order not found' });
        if (order.userId && order.userId !== req.user.id) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        const subtotal = order.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        res.json({
            order_number: order.orderNumber,
            order_status: order.status,
            created_at: order.createdAt,
            grand_total: order.paidAmount ?? order.totalAmount,
            subtotal,
            shipping_total: order.totalAmount - subtotal,
            shipping_method_name: 'Standard Delivery',
            currency: order.currency,
            payment_method: order.paymentMethod,
            payment_status: order.paymentStatus,
            customer_note: order.customerNote,
            items: order.items.map((item) => ({
                id: item.id,
                product_name_snapshot: item.product?.name || 'Unknown Product',
                image_url_snapshot: (0, utils_1.toAbsoluteUrl)(item.product?.images?.find((i) => i.isMain)?.imageUrl || item.product?.images?.[0]?.imageUrl || null),
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity,
            })),
            shipping_address_snapshot: {
                full_name: order.shippingName,
                address_line_1: order.shippingAddress,
                city: order.shippingCity,
                country: order.shippingCountry,
                postal_code: order.shippingZip,
            },
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});
// ── Wishlist ───────────────────────────────────────────────────
// GET /api/account/wishlist/
router.get('/wishlist/', auth_1.authenticate, async (req, res) => {
    try {
        const wishlist = await prisma_1.default.wishlistItem.findMany({
            where: { userId: req.user.id },
            include: { product: { include: { images: true } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(wishlist.map(item => ({
            id: item.product.id,
            slug: item.product.slug,
            name: item.product.name,
            base_price: item.product.basePrice,
            effective_price: item.product.effectivePrice,
            stock: item.product.stock,
            main_image: item.product.images.find(img => img.isMain) || item.product.images[0] || null,
        })));
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch wishlist' });
    }
});
// POST /api/account/wishlist/
router.post('/wishlist/', auth_1.authenticate, async (req, res) => {
    try {
        const { product_id } = req.body;
        if (!product_id)
            return res.status(400).json({ error: 'Product ID is required' });
        const existing = await prisma_1.default.wishlistItem.findUnique({
            where: { userId_productId: { userId: req.user.id, productId: product_id } },
        });
        if (existing) {
            return res.json({ message: 'Already in wishlist' });
        }
        await prisma_1.default.wishlistItem.create({
            data: { userId: req.user.id, productId: product_id },
        });
        res.status(201).json({ message: 'Added to wishlist' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add to wishlist' });
    }
});
// DELETE /api/account/wishlist/:productId/remove/
router.delete('/wishlist/:productId/remove/', auth_1.authenticate, async (req, res) => {
    try {
        const { productId } = req.params;
        await prisma_1.default.wishlistItem.deleteMany({
            where: { userId: req.user.id, productId: productId },
        });
        res.json({ message: 'Removed from wishlist' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to remove from wishlist' });
    }
});
exports.default = router;
