import Product from '../models/Product.js';

export const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      goldPurity,
      productType,
      isFeatured,
      page = 1,
      limit = 20,
      sort = '-createdAt',
      search,
    } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (goldPurity) filter.goldPurity = goldPurity;
    if (productType) filter.productType = productType;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured === 'true';
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { shortDescription: new RegExp(search, 'i') },
        { tags: new RegExp(search, 'i') },
      ];
    }
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(50, parseInt(limit, 10) || 20);
    const limitNum = Math.min(50, parseInt(limit, 10) || 20);
    const [items, total] = await Promise.all([
      Product.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Product.countDocuments(filter),
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

export const getProductBySlug = async (req, res, next) => {
  try {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true }).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Admin: list all (including inactive)
export const adminGetProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt', category, goldPurity, productType, isActive } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (goldPurity) filter.goldPurity = goldPurity;
    if (productType) filter.productType = productType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10) || 20);
    const limitNum = Math.min(100, parseInt(limit, 10) || 20);
    const query = Product.find(filter).sort(sort).skip(skip).limit(limitNum);
    const [items, total] = await Promise.all([query.lean(), Product.countDocuments(filter)]);
    res.json({
      success: true,
      data: items,
      pagination: { page: Math.ceil(skip / limitNum) + 1, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
};

// Admin: create product
export const adminCreateProduct = async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Admin: update product
export const adminUpdateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
};

// Admin: delete (soft delete by isActive)
export const adminDeleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    res.json({ success: true, message: 'Product deactivated.', data: product });
  } catch (err) {
    next(err);
  }
};
