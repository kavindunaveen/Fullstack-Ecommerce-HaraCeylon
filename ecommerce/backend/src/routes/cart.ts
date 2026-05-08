import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

const resolveCart = async (req: AuthRequest, res: any, next: any) => {
  try {
    let cart;
    if (req.user) {
      cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { userId: req.user.id } });
      }
    } else {
      return res.status(401).json({ error: 'Auth required for cart' });
    }
    (req as any).cart = cart;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve cart' });
  }
};

const formatCart = async (cartId: string) => {
  const items = await prisma.cartItem.findMany({
    where: { cartId: cartId },
    include: { product: { include: { images: true } } }
  });

  const formattedItems = items.map(item => {
    const rawImg = item.product.images.find(i => i.isMain) || item.product.images[0] || null;
    const mainImage = rawImg ? { image_url: rawImg.imageUrl, is_main: rawImg.isMain, alt_text: item.product.name } : null;
    return {
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        sku: item.product.id.slice(0, 8).toUpperCase(),
        price: item.product.basePrice,
        sale_price: item.product.basePrice !== item.product.effectivePrice ? item.product.effectivePrice : null,
        effective_price: item.product.effectivePrice,
        stock_quantity: item.product.stock,
        stock_status: item.product.stock > 0 ? 'in_stock' : 'out_of_stock',
        main_image: mainImage
      },
      quantity: item.quantity,
      unit_price: item.product.effectivePrice,
      line_total: item.product.effectivePrice * item.quantity
    };
  });

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

router.get('/', authenticate, resolveCart, async (req: AuthRequest, res): Promise<any> => {
  try {
    const cart = (req as any).cart;
    const formattedCart = await formatCart(cart.id);
    res.json(formattedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

router.post('/add/', authenticate, resolveCart, async (req: AuthRequest, res): Promise<any> => {
  try {
    const cart = (req as any).cart;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) return res.status(400).json({ error: 'product_id is required' });

    let item = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: product_id } }
    });

    if (item) {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: item.quantity + quantity }
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: product_id, quantity }
      });
    }

    const formattedCart = await formatCart(cart.id);
    res.json(formattedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

router.patch('/update/:itemId/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.itemId as string;

    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    if (quantity < 1) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity }
      });
    }

    const formattedCart = await formatCart(item.cartId);
    res.json(formattedCart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

router.delete('/remove/:itemId/', authenticate, async (req: AuthRequest, res): Promise<any> => {
  try {
    const itemId = req.params.itemId as string;
    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await prisma.cartItem.delete({ where: { id: itemId } });
    
    const formattedCart = await formatCart(item.cartId);
    res.json(formattedCart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

router.delete('/clear/', authenticate, resolveCart, async (req: AuthRequest, res): Promise<any> => {
  try {
    const cart = (req as any).cart;
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    
    const formattedCart = await formatCart(cart.id);
    res.json(formattedCart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

export default router;
