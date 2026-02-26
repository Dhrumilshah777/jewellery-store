/**
 * Create first admin user and a sample product. Run from server folder:
 *   node scripts/seed-admin.js
 * Or: npm run seed
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jewellery-store';

async function run() {
  await mongoose.connect(MONGODB_URI);

  const { default: User } = await import('../src/models/User.js');
  const { default: Product } = await import('../src/models/Product.js');

  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log('Admin user already exists:', existingAdmin.email);
  } else {
    await User.create({
      email: 'admin@jewellerystore.com',
      password: 'admin123',
      name: 'Admin',
      role: 'admin',
      isActive: true,
    });
    console.log('Created admin user: admin@jewellerystore.com / password: admin123');
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.create({
      name: 'Sample Gold Ring',
      description: 'A beautiful sample gold ring. 18KT gold, ready stock. Pan India shipping.',
      shortDescription: '18KT gold ring, ready stock',
      category: 'gold',
      goldPurity: '18KT',
      productType: 'ready_stock',
      price: 15000,
      stock: { quantity: 10, trackInventory: true, allowBackorder: false },
      isActive: true,
      isFeatured: true,
      shipping: { panIndia: true },
    });
    console.log('Created sample product: Sample Gold Ring');
  } else {
    console.log('Products already exist, skipping sample product.');
  }

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
