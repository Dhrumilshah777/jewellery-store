import mongoose from 'mongoose';

// Enums for product attributes
export const GOLD_PURITY = ['14KT', '18KT', '22KT'];
export const PRODUCT_CATEGORY = ['gold', 'american_diamond', 'cz'];
export const PRODUCT_TYPE = ['ready_stock', 'made_to_order'];
export const GENDER = ['men', 'women', 'unisex', 'kids'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    shortDescription: {
      type: String,
      maxlength: 500,
    },
    category: {
      type: String,
      required: true,
      enum: PRODUCT_CATEGORY,
      index: true,
    },
    // For gold: 14KT, 18KT, 22KT. For CZ/american_diamond can be null or secondary
    goldPurity: {
      type: String,
      enum: { values: GOLD_PURITY, message: 'Invalid gold purity' },
      default: null,
    },
    productType: {
      type: String,
      required: true,
      enum: PRODUCT_TYPE,
      default: 'ready_stock',
      index: true,
    },
    gender: {
      type: String,
      enum: { values: GENDER, message: 'Invalid gender' },
      default: 'unisex',
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    images: [
      {
        url: { type: String, required: true },
        alt: String,
        order: { type: Number, default: 0 },
      },
    ],
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    compareAtPrice: {
      type: Number,
      min: 0,
      default: null,
    },
    weight: {
      value: { type: Number, min: 0 },
      unit: { type: String, enum: ['gm', 'grams'], default: 'gm' },
    },
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: { type: String, enum: ['mm', 'cm'], default: 'mm' },
    },
    stock: {
      quantity: { type: Number, min: 0, default: 0 },
      trackInventory: { type: Boolean, default: true },
      allowBackorder: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: [{ type: String, trim: true }],
    meta: {
      title: String,
      description: String,
    },
    // Pan India shipping – same for all products; overridable per product if needed
    shipping: {
      panIndia: { type: Boolean, default: true },
      freeShippingAbove: Number,
      estimatedDays: { min: Number, max: Number },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ productType: 1, isActive: 1 });
productSchema.index({ goldPurity: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });

// Auto-generate slug from name before save
productSchema.pre('save', function (next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
