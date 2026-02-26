import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    price: { type: Number, required: true, min: 0 },
    // Snapshot of product info at add-to-cart time (for display without populating)
    name: String,
    image: String,
    sku: String,
    productType: { type: String, enum: ['ready_stock', 'made_to_order'] },
    goldPurity: String,
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Keep updatedAt in sync
cartSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for item count
cartSchema.virtual('itemCount').get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for subtotal
cartSchema.virtual('subtotal').get(function () {
  return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

cartSchema.set('toJSON', { virtuals: true });
cartSchema.set('toObject', { virtuals: true });

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
