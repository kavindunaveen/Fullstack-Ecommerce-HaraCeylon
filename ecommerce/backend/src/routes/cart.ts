import { Router } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';
import { toAbsoluteUrl } from '../utils';

const router = Router();

import { optionalAuthenticate } from '../middleware/auth';

const resolveCart = async (req: AuthRequest, res: any, next: any) => {
  try {
    let cart;
    const sessionId = req.headers['x-session-id'] as string;

    if (req.user) {
      // User is logged in
      cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
      if (!cart) {
        // Check if there's a guest cart to merge or use
        if (sessionId) {
          cart = await prisma.cart.findUnique({ where: { sessionId } });
          if (cart && !cart.userId) {
            // Link guest cart to user
            cart = await prisma.cart.update({
              where: { id: cart.id },
              data: { userId: req.user.id, sessionId: null }
            });
          }
        }
        
        if (!cart) {
          cart = await prisma.cart.create({ data: { userId: req.user.id } });
        }
      }
    } else {
      // Guest user
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID or Auth required for cart' });
      }
      cart = await prisma.cart.findUnique({ where: { sessionId } });
      if (!cart) {
        cart = await prisma.cart.create({ data: { sessionId } });
      }
    }
    (req as any).cart = cart;
    next();
  } catch (error) {
    console.error('Resolve cart error:', error);
    res.status(500).json({ error: 'Failed to resolve cart' });
  }
};


const formatCart = async (cartId: string) => {
  const items = await prisma.cartItem.findMany({
    where: { cartId: cartId },
    include: { product: { include: { images: true } } }
  });

  const formattedItems = items.map(item => {
    const mainImg = item.product.images.find(i => i.isMain) || item.product.images[0] || null;
    return {
      id: item.id,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        sku: (item.product as any).sku || item.product.id.slice(0, 8),
        price: item.product.basePrice,
        sale_price: item.product.basePrice !== item.product.effectivePrice ? item.product.effectivePrice : null,
        effective_price: item.product.effectivePrice,
        stock_status: item.product.stock > 0 ? 'in_stock' : 'out_of_stock',
        main_image: mainImg ? {
          image_url: toAbsoluteUrl(mainImg.imageUrl),
          is_main: mainImg.isMain,
          alt_text: item.product.name
        } : null
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

router.get('/', optionalAuthenticate, resolveCart, async (req: AuthRequest, res): Promise<any> => {
  try {
    const cart = (req as any).cart;
    const formattedCart = await formatCart(cart.id);
    res.json(formattedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

router.post('/add/', optionalAuthenticate, resolveCart, async (req: AuthRequest, res): Promise<any> => {
  try {
    const cart = (req as any).cart;
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) return res.status(400).json({ error: 'product_id is required' });

    const product = await prisma.product.findUnique({ where: { id: product_id } });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let item = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId: product_id } }
    });

    const currentQuantity = item ? item.quantity : 0;
    const requestedTotal = currentQuantity + quantity;

    if (product.stock < requestedTotal) {
      return res.status(400).json({ error: `Insufficient stock. Only ${product.stock} available.` });
    }

    if (item) {
      await prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: requestedTotal }
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

router.patch('/update/:itemId/', optionalAuthenticate, resolveCart, async (req: AuthRequest, res): Promise<any> => {
  try {
    const { quantity } = req.body;
    const itemId = req.params.itemId as string;
    const cart = (req as any).cart;

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id }
    });
    if (!item) return res.status(404).json({ error: 'Item not found in your cart' });

    if (quantity < 1) {
      await prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      // Check stock for the new quantity
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product && product.stock < quantity) {
        return res.status(400).json({ error: `Insufficient stock. Only ${product.stock} available.` });
      }

      await prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity }
      });
    }

    const formattedCart = await formatCart(cart.id);
    res.json(formattedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

router.delete('/remove/:itemId/', optionalAuthenticate, resolveCart, async (req: AuthRequest, res): Promise<any> => {
  try {
    const itemId = req.params.itemId as string;
    const cart = (req as any).cart;

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id }
    });
    if (!item) return res.status(404).json({ error: 'Item not found in your cart' });

    await prisma.cartItem.delete({ where: { id: itemId } });
    
    const formattedCart = await formatCart(cart.id);
    res.json(formattedCart);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

router.delete('/clear/', optionalAuthenticate, resolveCart, async (req: AuthRequest, res): Promise<any> => {
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
