import mongoose from 'mongoose';

export const ORDER_STATUS = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'returned',
];
export const PAYMENT_STATUS = ['pending', 'paid', 'failed', 'refunded', 'partial_refund'];
export const PAYMENT_METHOD = ['cod', 'online', 'upi', 'card', 'bank_transfer'];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: { type: String, required: true },
    sku: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    image: String,
    productType: { type: String, enum: ['ready_stock', 'made_to_order'] },
    goldPurity: String,
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      uppercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true, min: 0 },
    shippingCharge: { type: Number, default: 0, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: { values: ORDER_STATUS, message: 'Invalid order status' },
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: { values: PAYMENT_STATUS, message: 'Invalid payment status' },
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: { values: PAYMENT_METHOD, message: 'Invalid payment method' },
    },
    paymentId: String, // gateway transaction id
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: String,
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
    },
    billingAddress: {
      fullName: String,
      phone: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      pincode: String,
    },
    notes: String,
    adminNotes: { type: String, select: false },
    shippedAt: Date,
    deliveredAt: Date,
    trackingNumber: String,
    trackingUrl: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

/** Generate next order number (call before create so validation passes). */
export async function getNextOrderNumber() {
  const count = await mongoose.model('Order').countDocuments();
  const prefix = 'ORD';
  const year = new Date().getFullYear().toString().slice(-2);
  const seq = String(count + 1).padStart(6, '0');
  return `${prefix}${year}${seq}`;
}

const Order = mongoose.model('Order', orderSchema);
export default Order;
