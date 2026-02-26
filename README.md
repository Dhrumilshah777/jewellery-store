# Jewellery E‑commerce Store

Full-stack ecommerce for **14KT / 18KT / 22KT gold**, **American diamond (CZ)** jewellery, with **ready stock** and **made-to-order**, **Pan India shipping**.

## Tech Stack

| Layer        | Stack                    |
|-------------|--------------------------|
| Frontend    | Next.js 14 (App Router), Tailwind CSS |
| Backend     | Node.js, Express         |
| Database    | MongoDB                  |
| Auth        | JWT (access + refresh)   |
| Hosting     | Structure ready for Vercel (client) + any Node host (server) |

## Folder Structure

```
├── client/                    # Next.js 14 frontend
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── products/
│   │   ├── cart/
│   │   ├── login/
│   │   └── (add more routes)
│   ├── components/
│   ├── lib/
│   │   └── api.ts             # API client & auth helpers
│   ├── .env.local.example
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── package.json
│
├── server/                    # Express API
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js          # MongoDB connection
│   │   │   └── env.js        # Env validation
│   │   ├── models/
│   │   │   ├── Product.js    # Product schema
│   │   │   ├── User.js      # User + roles
│   │   │   ├── Order.js     # Order schema
│   │   │   └── Cart.js      # Cart schema
│   │   ├── middleware/
│   │   │   ├── auth.js      # JWT protect & optionalAuth
│   │   │   ├── admin.js     # adminOnly, superAdminOnly
│   │   │   └── errorHandler.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── cartController.js
│   │   │   ├── productController.js
│   │   │   └── orderController.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── cartRoutes.js
│   │   │   ├── productRoutes.js
│   │   │   ├── orderRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── utils/
│   │   │   └── jwt.js
│   │   └── index.js         # App entry
│   ├── .env.example
│   └── package.json
│
└── README.md
```

## Schemas (MongoDB)

### Product
- **Category:** `gold` | `american_diamond` | `cz`
- **Gold purity:** `14KT` | `18KT` | `22KT` (for gold)
- **Product type:** `ready_stock` | `made_to_order`
- **Fields:** name, slug, description, images, price, compareAtPrice, weight, dimensions, stock (quantity, trackInventory, allowBackorder), isActive, isFeatured, tags, shipping (panIndia, freeShippingAbove, estimatedDays), etc.

### User
- **Roles:** `user` | `admin` | `super_admin`
- **Fields:** email, password (hashed), name, phone, role, addresses[], isActive, emailVerified, refreshToken, lastLoginAt

### Order
- **Status:** pending → confirmed → processing → shipped → out_for_delivery → delivered (and cancelled, returned)
- **Payment:** pending, paid, failed, refunded; methods: cod, online, upi, card, bank_transfer
- **Fields:** orderNumber, user, items[], subtotal, shippingCharge, tax, discount, total, shippingAddress, paymentMethod, paymentId, trackingNumber, etc.

### Cart
- One cart per user; **items[]** with product ref, quantity, price, and snapshot (name, image, sku, productType, goldPurity) for display.

## Auth & Admin

- **Auth routes:** `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`
- **Protected routes:** Send `Authorization: Bearer <accessToken>`
- **Admin:** Use `protect` + `adminOnly` (admin, super_admin). Admin routes under `GET|POST|PUT|PATCH|DELETE /api/v1/admin/*` (products, orders).

## Cart Logic

- **GET /api/v1/cart** – get cart (creates if missing)
- **POST /api/v1/cart/items** – add item (`productId`, optional `quantity`)
- **PATCH /api/v1/cart/items** – update quantity (`productId`, `quantity`)
- **DELETE /api/v1/cart/items/:productId** or body `{ productId }` – remove item
- **DELETE /api/v1/cart** – clear cart  
Stock checks applied for ready_stock; cart stores price snapshot and product snapshot for display.

## Setup

### Backend
```bash
cd server
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, CLIENT_URL
npm install
npm run dev
```
Runs at `http://localhost:5000`. API base: `http://localhost:5000/api/v1`.

### Frontend
```bash
cd client
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
npm install
npm run dev
```
Runs at `http://localhost:3000`.

### First admin user
Create a user via `POST /api/v1/auth/register`, then in MongoDB set `role: 'admin'` or `'super_admin'` on that user document.

## Payments (Razorpay)

- **Pay online:** Checkout offers "Cash on delivery (COD)" and "Pay online (Card / UPI)". For online, the backend creates a Razorpay order and returns `keyId`, `razorpayOrderId`, `amount`; the frontend opens Razorpay Checkout and on success calls **verify-payment** to confirm and clear cart.
- **Backend env:** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` (from [Razorpay Dashboard](https://dashboard.razorpay.com)). If unset, "Pay online" returns 503.
- **Routes:** `POST /api/v1/orders/create-payment-order`, `POST /api/v1/orders/verify-payment`.

## Deploy (production)

See **[DEPLOY.md](./DEPLOY.md)** for a full step-by-step guide (MongoDB Atlas → Railway → Vercel → seed admin).

**Summary:**
- **Client:** Vercel, root `client`, env `NEXT_PUBLIC_API_URL` = your API base URL.
- **Server:** Railway (or Render / Fly.io), root `server`, env `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, etc. Optional: use `server/Dockerfile` for Docker deploy.
- **Database:** MongoDB Atlas; run `npm run seed` from `server` after first deploy to create admin user.

This structure is production-ready; add rate limiting and logging as needed.
