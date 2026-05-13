import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, optionalAuthenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Checkout
router.post('/checkout/', optionalAuthenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const {
      billing_full_name,
      billing_email,
      billing_phone,
      billing_address_line_1,
      billing_address_line_2,
      billing_city,
      billing_country,
      billing_postal_code,
      shipping_full_name,
      shipping_address_line_1,
      shipping_address_line_2,
      shipping_city,
      shipping_country,
      shipping_postal_code,
      ship_to_different_address,
      currency = 'GBP',
      shipping_rate_id
    } = req.body;

    const sessionId = req.headers['x-session-id'] as string;
    let cart;

    // Try finding by userId first if authenticated
    if (req.user) {
      cart = await prisma.cart.findUnique({
        where: { userId: req.user.id },
        include: { items: { include: { product: true } } }
      });
    }

    // If no user cart or it's empty, fallback to the sessionId cart
    // This happens if a user adds to cart as guest, then logs in at checkout
    if ((!cart || cart.items.length === 0) && sessionId) {
      const sessionCart = await prisma.cart.findUnique({
        where: { sessionId },
        include: { items: { include: { product: true } } }
      });
      if (sessionCart && sessionCart.items.length > 0) {
        cart = sessionCart;
        
        // Link the guest cart to the user if they just logged in
        if (req.user && !cart.userId) {
          await prisma.cart.update({
            where: { id: cart.id },
            data: { userId: req.user.id, sessionId: null }
          });
        }
      }
    }

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const sName = ship_to_different_address ? shipping_full_name : billing_full_name;
    const sAddr = ship_to_different_address 
      ? `${shipping_address_line_1}${shipping_address_line_2 ? ', ' + shipping_address_line_2 : ''}`
      : `${billing_address_line_1}${billing_address_line_2 ? ', ' + billing_address_line_2 : ''}`;
    const sCity = ship_to_different_address ? shipping_city : billing_city;
    const sCountry = ship_to_different_address ? shipping_country : billing_country;
    const sZip = ship_to_different_address ? shipping_postal_code : billing_postal_code;

    if (!sName || !sAddr || !sCity) {
      return res.status(400).json({ error: 'Shipping details are required' });
    }

    // Get shipping rate price
    let shippingPrice = 0;
    if (shipping_rate_id) {
      const rateId = parseInt(shipping_rate_id, 10);
      if (rateId === 1) shippingPrice = 10; // Standard International
      else if (rateId === 2) shippingPrice = 25; // Express International
      else if (rateId === 3) shippingPrice = 2;  // Standard Local
      else if (rateId === 4) shippingPrice = 5;  // Next Day
    }

    const subtotal = cart.items.reduce((acc, item) => acc + (item.product.effectivePrice * item.quantity), 0);
    const totalAmount = subtotal + shippingPrice;
    const orderNumber = `HARA-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user?.id || null,
        totalAmount,
        currency,
        shippingName: sName,
        shippingAddress: sAddr,
        shippingCity: sCity,
        shippingCountry: sCountry,
        shippingZip: sZip,
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

    res.status(201).json({ 
      order_number: order.orderNumber, 
      message: 'Order placed successfully' 
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// Get Order Details
router.get('/:orderNumber/', optionalAuthenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const orderNumber = req.params.orderNumber as string;
    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: { include: { images: true } } } } }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // If it's a guest order, allow viewing. If it's a user order, check ownership.
    if (order.userId && (!req.user || order.userId !== req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized to view this order' });
    }

    // Format for frontend success page and detail page
    const formattedOrder = {
      order_number: order.orderNumber,
      order_status: order.status,
      created_at: order.createdAt,
      grand_total: order.totalAmount,
      subtotal: order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      shipping_total: order.totalAmount - order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      shipping_method_name: 'Standard Delivery', // Placeholder or add to DB
      currency: order.currency,
      items: order.items.map(item => ({
        id: item.id,
        product_name_snapshot: item.product.name,
        image_url_snapshot: item.product.images.find(i => i.isMain)?.imageUrl || item.product.images[0]?.imageUrl || null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      })),
      shipping_address_snapshot: {
        full_name: order.shippingName,
        address_line_1: order.shippingAddress,
        city: order.shippingCity,
        country: order.shippingCountry,
        postal_code: order.shippingZip
      }
    };

    res.json(formattedOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
