import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, optionalAuthenticate, AuthRequest } from '../middleware/auth';
import { DEFAULT_RATES, DOMESTIC_RATES } from './shipping';
import { toAbsoluteUrl } from '../utils';
import { sendOrderConfirmationEmail } from '../utils/email';

const router = Router();

async function verifyPayPalPayment(orderId: string, expectedAmount: number, expectedCurrency: string): Promise<boolean> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('PayPal Client ID or Secret is not configured in backend');
    return false;
  }

  const mode = process.env.PAYPAL_MODE || (process.env.NODE_ENV === 'production' ? 'live' : 'sandbox');
  const paypalBaseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  try {
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch(`${paypalBaseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Failed to get PayPal token:', errorText);
      return false;
    }

    const tokenData = await tokenResponse.json() as any;
    const accessToken = tokenData.access_token;

    const orderResponse = await fetch(`${paypalBaseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error('Failed to fetch PayPal order details:', errorText);
      return false;
    }

    const orderData = await orderResponse.json() as any;
    const status = orderData.status;
    const purchaseUnit = orderData.purchase_units?.[0];

    if (!purchaseUnit) {
      console.error('PayPal order has no purchase units');
      return false;
    }

    const amountValue = parseFloat(purchaseUnit.amount.value);
    const amountCurrency = purchaseUnit.amount.currency_code;

    if (status !== 'COMPLETED' && status !== 'APPROVED') {
      console.error(`PayPal order status is ${status}, expected COMPLETED or APPROVED`);
      return false;
    }

    if (amountCurrency.toUpperCase() !== expectedCurrency.toUpperCase()) {
      console.error(`PayPal order currency is ${amountCurrency}, expected ${expectedCurrency}`);
      return false;
    }

    if (Math.abs(amountValue - expectedAmount) > 0.05) {
      console.error(`PayPal order amount is ${amountValue}, expected ${expectedAmount}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying PayPal payment:', error);
    return false;
  }
}

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
      billing_state,
      shipping_full_name,
      shipping_address_line_1,
      shipping_address_line_2,
      shipping_city,
      shipping_country,
      shipping_postal_code,
      ship_to_different_address,
      currency,
      shipping_rate_id,
      customer_note,
      payment_method,
      paypal_order_id,
      save_address
    } = req.body;

    const sessionId = req.headers['x-session-id'] as string;
    let cart;

    let checkoutUserId = req.user?.id || null;

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

    if (!currency) {
      return res.status(400).json({ error: 'Currency is required' });
    }

    // Validate stock before proceeding
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for ${item.product.name}. Only ${item.product.stock} available.` 
        });
      }
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
      const allRates = [...DEFAULT_RATES, ...DOMESTIC_RATES];
      const selectedRate = allRates.find(r => r.id === rateId);
      if (selectedRate) {
        shippingPrice = parseFloat(selectedRate.price);
      }
    }

    const subtotal = cart.items.reduce((acc, item) => acc + (item.product.effectivePrice * item.quantity), 0);
    const totalAmount = subtotal + shippingPrice;

    if (payment_method === 'paypal') {
      if (!paypal_order_id) {
        return res.status(400).json({ error: 'PayPal Order ID is required for PayPal payments' });
      }
      const isVerified = await verifyPayPalPayment(paypal_order_id as string, totalAmount, currency);
      if (!isVerified) {
        return res.status(400).json({ error: 'PayPal payment verification failed' });
      }
    }

    const orderNumber = `HARA-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: checkoutUserId,
          totalAmount,
          currency,
          shippingName: sName,
          shippingAddress: sAddr,
          shippingCity: sCity,
          shippingCountry: sCountry,
          shippingZip: sZip,
          paymentMethod: payment_method || 'cod',
          paymentStatus: payment_method === 'paypal' ? 'paid' : 'pending',
          customerNote: customer_note || null,
          items: {
            create: cart.items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.effectivePrice
            }))
          }
        }
      });

      // Decrement stock for each item
      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        });
      }

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    // Save address to user profile if requested
    if (checkoutUserId && save_address) {
      const [firstName, ...lastNameParts] = (billing_full_name || '').split(' ');
      const lastName = lastNameParts.join(' ');

      const addressData = {
        userId: checkoutUserId,
        firstName: firstName || 'Customer',
        lastName: lastName || '',
        street: billing_address_line_1,
        city: billing_city,
        state: billing_state || null,
        zipCode: billing_postal_code,
        country: billing_country,
        phone: billing_phone,
      };

      // Check if user already has this address
      const existingAddress = await prisma.address.findFirst({
        where: {
          userId: checkoutUserId,
          street: billing_address_line_1,
          zipCode: billing_postal_code,
          city: billing_city
        }
      });

      if (!existingAddress) {
        // If it's their first address, make it default
        const addressCount = await prisma.address.count({ where: { userId: checkoutUserId } });
        await prisma.address.create({
          data: {
            ...addressData,
            isDefault: addressCount === 0
          }
        });
      }
    }

    // Send confirmation email asynchronously (do not block the response)
    const emailItems = cart.items.map((item: any) => ({
      name: item.product.name,
      quantity: item.quantity,
      price: item.product.effectivePrice,
    }));
    sendOrderConfirmationEmail(
      billing_email,
      billing_full_name,
      order.orderNumber,
      totalAmount,
      currency,
      emailItems
    ).catch(err => console.error('Failed to send order email in background:', err));

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
        product_name_snapshot: item.product?.name || 'Unknown Product',
        image_url_snapshot: toAbsoluteUrl(
          item.product?.images?.find(i => i.isMain)?.imageUrl || item.product?.images?.[0]?.imageUrl || null
        ),
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
