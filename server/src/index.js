import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

try {
  await connectDB();
} catch (err) {
  console.error('DB init failed (app will still serve health check):', err.message);
}

const app = express();

// CORS: allow CLIENT_URL(s); fallback allows known Vercel frontend so preflight always gets headers
const allowedOrigins = config.clientUrls.length ? config.clientUrls : ['https://jewellery-store-frontend-nine.vercel.app'];
const corsOptions = {
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, false);
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const base = `/api/${config.apiVersion}`;
app.use(`${base}/auth`, authRoutes);
app.use(`${base}/products`, productRoutes);
app.use(`${base}/cart`, cartRoutes);
app.use(`${base}/orders`, orderRoutes);
app.use(`${base}/admin`, adminRoutes);

app.get(['/health', '/api/health'], (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

// On Vercel we export the app for serverless; otherwise start the server
if (!process.env.VERCEL) {
  app.listen(config.port, () => {
    console.log(`Server running in ${config.nodeEnv} on port ${config.port}`);
    console.log(`API base: ${base}`);
  });
}

export default app;
