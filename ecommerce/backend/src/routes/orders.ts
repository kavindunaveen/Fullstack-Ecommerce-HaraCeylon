import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Checkout
router.post('/checkout/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.user.id;
    const { shippingName, shippingAddress, shippingCity, shippingCountry, shippingZip, currency = 'GBP' } = req.body;

    if (!shippingName || !shippingAddress || !shippingCity) {
      return res.status(400).json({ error: 'Shipping details are required' });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } }
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const totalAmount = cart.items.reduce((acc, item) => acc + (item.product.effectivePrice * item.quantity), 0);
    const orderNumber = `HARA-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId,
        totalAmount,
        currency,
        shippingName,
        shippingAddress,
        shippingCity,
        shippingCountry,
        shippingZip,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.effectivePrice
          }))
        }
      }
    });

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    res.status(201).json({ orderNumber: order.orderNumber, message: 'Order placed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Get Order Details
router.get('/:orderNumber/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const orderNumber = req.params.orderNumber as string;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: { include: { images: true } } } } }
    });

    if (!order || order.userId !== req.user.id) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
