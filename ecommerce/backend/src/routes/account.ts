import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { toAbsoluteUrl } from '../utils';
import bcrypt from 'bcryptjs';

const router = Router();

// ── User Profile ─────────────────────────────────────────────

router.get('/user/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, firstName: true, lastName: true, role: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      full_name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      is_staff: user.role === 'ADMIN',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.patch('/user/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { first_name, last_name } = req.body;
    const user = await prisma.user.update({
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.patch('/password/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { current_password, new_password } = req.body;
    
    if (!new_password || new_password.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // For users registered via Google (no password), current_password check is optional or handled differently.
    // Assuming they must have a password to change it, or they can set one if they don't have one.
    if (user.passwordHash) {
      if (!current_password) {
        return res.status(400).json({ error: 'Current password is required' });
      }
      const isValid = await bcrypt.compare(current_password, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Incorrect current password' });
      }
    }

    const passwordHash = await bcrypt.hash(new_password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// ── Address Helpers ──────────────────────────────────────────

const formatAddress = (addr: any) => ({
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

const splitName = (full_name: string) => {
  const parts = (full_name || '').trim().split(' ');
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
};

// ── Address CRUD ─────────────────────────────────────────────

// GET /api/account/addresses/
router.get('/addresses/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    res.json(addresses.map(formatAddress));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// POST /api/account/addresses/
router.post('/addresses/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_default } = req.body;
    const { firstName, lastName } = splitName(full_name);

    if (is_default) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// PATCH /api/account/addresses/:id/
router.patch('/addresses/:id/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const id = req.params.id as string;
    const { full_name, phone, address_line_1, address_line_2, city, state, postal_code, country, is_default } = req.body;
    const { firstName, lastName } = splitName(full_name);

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'Address not found' });
    }

    if (is_default) {
      await prisma.address.updateMany({
        where: { userId: req.user.id, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data: { firstName, lastName, phone: phone || '', street: address_line_1, addressLine2: address_line_2, city, state: state || '', zipCode: postal_code, country: country || 'GB', isDefault: is_default || false },
    });
    res.json(formatAddress(address));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update address' });
  }
});

// DELETE /api/account/addresses/:id/
router.delete('/addresses/:id/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ error: 'Address not found' });
    }
    await prisma.address.delete({ where: { id } });
    res.json({ message: 'Address deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

// ── Orders ───────────────────────────────────────────────────

// GET /api/account/orders/
router.get('/orders/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const orders = await prisma.order.findMany({
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
        image_url_snapshot: toAbsoluteUrl(
          item.product?.images?.find(i => i.isMain)?.imageUrl || item.product?.images?.[0]?.imageUrl || null
        ),
        quantity: item.quantity,
        price: item.price,
      })),
    })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/account/orders/:orderNumber/
router.get('/orders/:orderNumber/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const orderNumber = req.params.orderNumber as string;
    const order: any = await prisma.order.findUnique({
      where: { orderNumber },
      include: { items: { include: { product: { include: { images: true } } } } },
    });

    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.userId && order.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const subtotal = order.items.reduce((acc: number, item: any) => acc + item.price * item.quantity, 0);

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
      items: order.items.map((item: any) => ({
        id: item.id,
        product_name_snapshot: item.product?.name || 'Unknown Product',
        image_url_snapshot: toAbsoluteUrl(
          item.product?.images?.find((i: any) => i.isMain)?.imageUrl || item.product?.images?.[0]?.imageUrl || null
        ),
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});
// ── Wishlist ───────────────────────────────────────────────────

// GET /api/account/wishlist/
router.get('/wishlist/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const wishlist = await prisma.wishlistItem.findMany({
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// POST /api/account/wishlist/
router.post('/wishlist/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ error: 'Product ID is required' });

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: req.user.id, productId: product_id } },
    });

    if (existing) {
      return res.json({ message: 'Already in wishlist' });
    }

    await prisma.wishlistItem.create({
      data: { userId: req.user.id, productId: product_id },
    });

    res.status(201).json({ message: 'Added to wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/account/wishlist/:productId/remove/
router.delete('/wishlist/:productId/remove/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { productId } = req.params;
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user.id, productId },
    });
    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

export default router;
