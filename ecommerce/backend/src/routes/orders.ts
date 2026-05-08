import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Checkout
router.post('/checkout/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const userId = req.user.id;
    const {
      billing_full_name, billing_email, billing_phone,
      billing_address_line_1, billing_address_line_2,
      billing_city, billing_postal_code, billing_country,
      // Legacy fields (kept for compatibility)
      shippingName, shippingAddress, shippingCity, shippingCountry, shippingZip,
      currency = 'GBP',
      customer_note, payment_method = 'cod'
    } = req.body;

    // Support both old and new field formats
    const finalName = billing_full_name || shippingName;
    const finalAddress = billing_address_line_1 || shippingAddress;
    const finalCity = billing_city || shippingCity;
    const finalCountry = billing_country || shippingCountry || 'GB';
    const finalPostal = billing_postal_code || shippingZip || '';
    const finalPhone = billing_phone || '';
    const finalEmail = billing_email || '';

    if (!finalName || !finalAddress || !finalCity) {
      return res.status(400).json({ error: 'Name, address and city are required' });
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
        shippingName: finalName,
        shippingAddress: finalAddress,
        shippingCity: finalCity,
        shippingCountry: finalCountry,
        shippingZip: finalPostal,
        shippingPhone: finalPhone,
        shippingEmail: finalEmail,
        items: {
          create: cart.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.effectivePrice
          }))
        }
      }
    });

    // Decrement stock for each item
    for (const item of cart.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } }
      });
    }

    // Clear cart after order placed
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    res.status(201).json({
      order_number: order.orderNumber,
      orderNumber: order.orderNumber,
      message: 'Order placed successfully',
      total: totalAmount,
      currency
    });
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
