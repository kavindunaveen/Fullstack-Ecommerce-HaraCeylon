"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
const auth_1 = require("../middleware/auth");
const resolveCart = async (req, res, next) => {
    try {
        let cart;
        const sessionId = req.headers['x-session-id'];
        if (req.user) {
            // User is logged in
            cart = await prisma_1.default.cart.findUnique({ where: { userId: req.user.id } });
            if (!cart) {
                // Check if there's a guest cart to merge or use
                if (sessionId) {
                    cart = await prisma_1.default.cart.findUnique({ where: { sessionId } });
                    if (cart && !cart.userId) {
                        // Link guest cart to user
                        cart = await prisma_1.default.cart.update({
                            where: { id: cart.id },
                            data: { userId: req.user.id, sessionId: null }
                        });
                    }
                }
                if (!cart) {
                    cart = await prisma_1.default.cart.create({ data: { userId: req.user.id } });
                }
            }
        }
        else {
            // Guest user
            if (!sessionId) {
                return res.status(400).json({ error: 'Session ID or Auth required for cart' });
            }
            cart = await prisma_1.default.cart.findUnique({ where: { sessionId } });
            if (!cart) {
                cart = await prisma_1.default.cart.create({ data: { sessionId } });
            }
        }
        req.cart = cart;
        next();
    }
    catch (error) {
        console.error('Resolve cart error:', error);
        res.status(500).json({ error: 'Failed to resolve cart' });
    }
};
const formatCart = async (cartId) => {
    const items = await prisma_1.default.cartItem.findMany({
        where: { cartId: cartId },
        include: { product: { include: { images: true } } }
    });
    const formattedItems = items.map(item => ({
        id: item.id,
        product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            sku: item.product.id.slice(0, 8),
            price: item.product.basePrice,
            sale_price: item.product.basePrice !== item.product.effectivePrice ? item.product.effectivePrice : null,
            effective_price: item.product.effectivePrice,
            stock_status: item.product.stock > 0 ? 'in_stock' : 'out_of_stock',
            main_image: (item.product.images.find(i => i.isMain) || item.product.images[0]) ? {
                image_url: (item.product.images.find(i => i.isMain) || item.product.images[0]).imageUrl,
                is_main: (item.product.images.find(i => i.isMain) || item.product.images[0]).isMain,
                alt_text: item.product.name
            } : null
        },
        quantity: item.quantity,
        unit_price: item.product.effectivePrice,
        line_total: item.product.effectivePrice * item.quantity
    }));
    const subtotal = formattedItems.reduce((acc, item) => acc + item.line_total, 0);
    const itemCount = formattedItems.reduce((acc, item) => acc + item.quantity, 0);
    return {
        id: cartId,
        items: formattedItems,
        subtotal,
        item_count: itemCount,
        currency: 'GBP'
    };
};
router.get('/', auth_1.optionalAuthenticate, resolveCart, async (req, res) => {
    try {
        const cart = req.cart;
        const formattedCart = await formatCart(cart.id);
        res.json(formattedCart);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get cart' });
    }
});
router.post('/add/', auth_1.optionalAuthenticate, resolveCart, async (req, res) => {
    try {
        const cart = req.cart;
        const { product_id, quantity = 1 } = req.body;
        if (!product_id)
            return res.status(400).json({ error: 'product_id is required' });
        let item = await prisma_1.default.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId: product_id } }
        });
        if (item) {
            await prisma_1.default.cartItem.update({
                where: { id: item.id },
                data: { quantity: item.quantity + quantity }
            });
        }
        else {
            await prisma_1.default.cartItem.create({
                data: { cartId: cart.id, productId: product_id, quantity }
            });
        }
        const formattedCart = await formatCart(cart.id);
        res.json(formattedCart);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});
router.patch('/update/:itemId/', auth_1.optionalAuthenticate, async (req, res) => {
    try {
        const { quantity } = req.body;
        const itemId = req.params.itemId;
        const item = await prisma_1.default.cartItem.findUnique({ where: { id: itemId } });
        if (!item)
            return res.status(404).json({ error: 'Item not found' });
        if (quantity < 1) {
            await prisma_1.default.cartItem.delete({ where: { id: itemId } });
        }
        else {
            await prisma_1.default.cartItem.update({
                where: { id: itemId },
                data: { quantity }
            });
        }
        const formattedCart = await formatCart(item.cartId);
        res.json(formattedCart);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update cart' });
    }
});
router.delete('/remove/:itemId/', auth_1.optionalAuthenticate, async (req, res) => {
    try {
        const itemId = req.params.itemId;
        const item = await prisma_1.default.cartItem.findUnique({ where: { id: itemId } });
        if (!item)
            return res.status(404).json({ error: 'Item not found' });
        await prisma_1.default.cartItem.delete({ where: { id: itemId } });
        const formattedCart = await formatCart(item.cartId);
        res.json(formattedCart);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to remove item' });
    }
});
router.delete('/clear/', auth_1.optionalAuthenticate, resolveCart, async (req, res) => {
    try {
        const cart = req.cart;
        await prisma_1.default.cartItem.deleteMany({ where: { cartId: cart.id } });
        const formattedCart = await formatCart(cart.id);
        res.json(formattedCart);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to clear cart' });
    }
});
exports.default = router;
