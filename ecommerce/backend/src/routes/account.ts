import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

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

// ── Address Helpers ──────────────────────────────────────────

const formatAddress = (addr: any) => ({
  id: addr.id,
  full_name: `${addr.firstName || ''} ${addr.lastName || ''}`.trim(),
  phone: addr.phone || '',
  address_line_1: addr.street,
  address_line_2: '',
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
    const { full_name, phone, address_line_1, city, state, postal_code, country, is_default } = req.body;
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
    const { full_name, phone, address_line_1, city, state, postal_code, country, is_default } = req.body;
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
      data: { firstName, lastName, phone: phone || '', street: address_line_1, city, state: state || '', zipCode: postal_code, country: country || 'GB', isDefault: is_default || false },
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
      grand_total: order.totalAmount,
      items: order.items.map(item => ({
        product_name_snapshot: item.product.name,
        image_url_snapshot: item.product.images.find(i => i.isMain)?.imageUrl || item.product.images[0]?.imageUrl || null,
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
      grand_total: order.totalAmount,
      subtotal,
      shipping_total: order.totalAmount - subtotal,
      shipping_method_name: 'Standard Delivery',
      currency: order.currency,
      payment_method: 'cod',
      payment_status: 'pending',
      items: order.items.map((item: any) => ({
        id: item.id,
        product_name_snapshot: item.product.name,
        image_url_snapshot: item.product.images.find((i: any) => i.isMain)?.imageUrl || item.product.images[0]?.imageUrl || null,
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

export default router;
