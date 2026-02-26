import crypto from 'crypto';
import Order, { getNextOrderNumber } from '../models/Order.js';
import Cart from '../models/Cart.js';
import { config } from '../config/env.js';

function buildOrderFromCart(cart, reqBody) {
  const { shippingAddress, notes } = reqBody;
  const items = [];
  let subtotal = 0;
  for (const item of cart.items) {
    const product = item.product;
    if (!product || !product.isActive) continue;
    const price = product.price;
    const total = price * item.quantity;
    subtotal += total;
    items.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      quantity: item.quantity,
      price,
      total,
      image: product.images?.[0]?.url,
      productType: product.productType,
      goldPurity: product.goldPurity,
    });
  }
  const shippingCharge = 0;
  const orderTotal = subtotal + shippingCharge;
  return { items, subtotal, shippingCharge, total: orderTotal, shippingAddress, notes };
}

export const createOrder = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }
    const { shippingAddress, paymentMethod, notes } = req.body;
    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.addressLine1 ||
        !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.pincode) {
      return res.status(400).json({ success: false, message: 'Valid shipping address required.' });
    }
    const built = buildOrderFromCart(cart, req.body);
    if (built.items.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid items in cart.' });
    }
    const orderNumber = await getNextOrderNumber();
    const order = await Order.create({
      orderNumber,
      user: req.user.id,
      ...built,
      paymentMethod: paymentMethod || 'cod',
      billingAddress: req.body.billingAddress || shippingAddress,
    });
    cart.items = [];
    await cart.save();
    const populated = await Order.findById(order._id).populate('items.product', 'name images');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
};

/** Create order for online payment: creates DB order (pending) + Razorpay order, returns payload for checkout. Cart cleared only after verify. */
export const createPaymentOrder = async (req, res, next) => {
  try {
    if (!config.razorpay.keyId || !config.razorpay.keySecret) {
      return res.status(503).json({ success: false, message: 'Online payment is not configured.' });
    }
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }
    const { shippingAddress, notes } = req.body;
    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.addressLine1 ||
        !shippingAddress?.city || !shippingAddress?.state || !shippingAddress?.pincode) {
      return res.status(400).json({ success: false, message: 'Valid shipping address required.' });
    }
    const built = buildOrderFromCart(cart, req.body);
    if (built.items.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid items in cart.' });
    }
    const orderNumber = await getNextOrderNumber();
    const order = await Order.create({
      orderNumber,
      user: req.user.id,
      ...built,
      paymentMethod: 'online',
      paymentStatus: 'pending',
      status: 'pending',
      shippingAddress: built.shippingAddress,
      billingAddress: req.body.billingAddress || built.shippingAddress,
      notes: built.notes,
    });
    const Razorpay = (await import('razorpay')).default;
    const razorpay = new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
    const amountPaise = Math.round(order.total * 100);
    const rzOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order._id.toString(),
    });
    res.status(201).json({
      success: true,
      data: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        razorpayOrderId: rzOrder.id,
        amount: amountPaise,
        currency: 'INR',
        keyId: config.razorpay.keyId,
      },
    });
  } catch (err) {
    next(err);
  }
};

/** Verify Razorpay payment and mark order paid; clear cart. */
export const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details.' });
    }
    if (!config.razorpay.keySecret) {
      return res.status(503).json({ success: false, message: 'Online payment is not configured.' });
    }
    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    if (order.paymentStatus === 'paid') {
      const populated = await Order.findById(order._id).populate('items.product', 'name images');
      return res.json({ success: true, data: populated, message: 'Already verified.' });
    }
    const expectedSignature = crypto
      .createHmac('sha256', config.razorpay.keySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');
    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
    }
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    order.paymentId = razorpay_payment_id;
    await order.save();
    const cart = await Cart.findOne({ user: req.user.id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    const populated = await Order.findById(order._id).populate('items.product', 'name images');
    res.json({ success: true, data: populated, message: 'Payment verified.' });
  } catch (err) {
    next(err);
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort('-createdAt').lean();
    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};

// Admin: list all orders
export const adminGetOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = status ? { status } : {};
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10) || 20);
    const limitNum = Math.min(100, parseInt(limit, 10) || 20);
    const [items, total] = await Promise.all([
      Order.find(filter).sort('-createdAt').skip(skip).limit(limitNum).populate('user', 'name email').lean(),
      Order.countDocuments(filter),
    ]);
    res.json({
      success: true,
      data: items,
      pagination: { page: Math.ceil(skip / limitNum) + 1, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

// Admin: update order status
export const adminUpdateOrderStatus = async (req, res, next) => {
  try {
    const { status, paymentStatus, trackingNumber, trackingUrl } = req.body;
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    if (trackingNumber !== undefined) update.trackingNumber = trackingNumber;
    if (trackingUrl !== undefined) update.trackingUrl = trackingUrl;
    if (status === 'shipped') update.shippedAt = new Date();
    if (status === 'delivered') update.deliveredAt = new Date();
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
};
