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

await connectDB();

const app = express();

const corsOrigin = config.clientUrls.length > 1 ? config.clientUrls : config.clientUrls[0];
app.use(cors({ origin: corsOrigin, credentials: true }));
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
