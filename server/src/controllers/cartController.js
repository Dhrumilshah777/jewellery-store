import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

/**
 * Get cart for current user. Creates empty cart if none.
 */
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product', 'name images price stock isActive');
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    // Filter out invalid items (product deleted or inactive)
    const validItems = cart.items.filter(
      (item) => item.product && item.product.isActive
    );
    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }
    res.json({ success: true, cart });
  } catch (err) {
    next(err);
  }
};

/**
 * Add item to cart. Body: { productId, quantity? }
 */
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findOne({ _id: productId, isActive: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    if (product.productType === 'ready_stock' && product.stock?.trackInventory) {
      const available = product.stock.quantity ?? 0;
      if (available < quantity && !product.stock.allowBackorder) {
        return res.status(400).json({
          success: false,
          message: `Only ${available} unit(s) available.`,
        });
      }
    }
    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }
    const existingIndex = cart.items.findIndex(
      (i) => i.product.toString() === productId
    );
    const imageUrl = product.images?.[0]?.url || null;
    const snapshot = {
      name: product.name,
      image: imageUrl,
      sku: product.sku,
      productType: product.productType,
      goldPurity: product.goldPurity,
      price: product.price,
    };
    if (existingIndex >= 0) {
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (product.stock?.trackInventory && !product.stock?.allowBackorder) {
        const max = product.stock.quantity ?? 0;
        if (newQty > max) {
          return res.status(400).json({
            success: false,
            message: `Maximum ${max} unit(s) available.`,
          });
        }
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].price = product.price;
      Object.assign(cart.items[existingIndex], snapshot);
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        ...snapshot,
      });
    }
    await cart.save();
    const updated = await Cart.findById(cart._id).populate('items.product', 'name images price stock isActive');
    res.json({ success: true, cart: updated, message: 'Added to cart.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Update item quantity. Body: { productId, quantity }
 */
export const updateCartItem = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
    }
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }
    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not in cart.' });
    }
    const product = await Product.findById(productId);
    if (product?.stock?.trackInventory && !product?.stock?.allowBackorder) {
      const max = product.stock.quantity ?? 0;
      if (quantity > max) {
        return res.status(400).json({
          success: false,
          message: `Maximum ${max} unit(s) available.`,
        });
      }
    }
    item.quantity = quantity;
    if (product) item.price = product.price;
    await cart.save();
    const updated = await Cart.findById(cart._id).populate('items.product', 'name images price stock isActive');
    res.json({ success: true, cart: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * Remove item from cart. Body or params: productId
 */
export const removeFromCart = async (req, res, next) => {
  try {
    const productId = req.body.productId || req.params.productId;
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found.' });
    }
    cart.items = cart.items.filter((i) => i.product.toString() !== productId);
    await cart.save();
    const updated = await Cart.findById(cart._id).populate('items.product', 'name images price stock isActive');
    res.json({ success: true, cart: updated, message: 'Item removed.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Clear entire cart.
 */
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    next(err);
  }
};
