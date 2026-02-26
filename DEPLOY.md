# Deploy – Jewellery Store

Step-by-step guide to deploy the store to production.

**Order:** 1) MongoDB Atlas → 2) Backend (Render) → 3) Frontend (Vercel) → 4) Seed admin.

---

## 1. MongoDB Atlas

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and create an account (or sign in).
2. **Create a cluster** (free M0 is enough): Choose a cloud provider and region, then Create.
3. **Database access:** Add a database user (username + password). Note the password.
4. **Network access:** Add IP address. For Railway/Render use **“Allow access from anywhere”** (`0.0.0.0/0`) so the server can connect. (You can restrict later with VPC/peering if needed.)
5. **Connect:** Click “Connect” on the cluster → “Drivers” → copy the connection string. It looks like:
   ```text
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your DB user password. Add a database name before `?`:
   ```text
   mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/jewellery-store?retryWrites=true&w=majority
   ```
   Save this as your **MONGODB_URI** (you’ll use it in the backend).

---

## 2. Backend on Render

1. Go to [render.com](https://render.com) and sign in (e.g. with GitHub).
2. **Dashboard** → **New +** → **Web Service**.
3. **Connect repository:** Select this GitHub repo. If it’s not listed, connect your GitHub account and choose the repo.
4. **Settings:**
   - **Name:** e.g. `jewellery-store-api`
   - **Region:** Choose the one closest to you or your users.
   - **Root Directory:** Click “Advanced” and set **Root Directory** to `server` (so Render builds and runs only the API).
   - **Runtime:** Node.
   - **Build Command:** `npm install` (Render usually detects this; if not, set it explicitly).
   - **Start Command:** `npm start` (runs `node src/index.js`).
5. **Environment:** Click **Environment** in the left sidebar and add:

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Your Atlas connection string from step 1 |
   | `JWT_SECRET` | Long random string (e.g. run `openssl rand -base64 32` and paste) |
   | `JWT_REFRESH_SECRET` | Another random string (or same as JWT_SECRET) |
   | `CLIENT_URL` | Leave empty for now; set after Vercel deploy (e.g. `https://your-app.vercel.app`) |
   | `RAZORPAY_KEY_ID` | From Razorpay dashboard (optional) |
   | `RAZORPAY_KEY_SECRET` | From Razorpay dashboard (optional) |
   | `CLOUDINARY_CLOUD_NAME` | Optional |
   | `CLOUDINARY_API_KEY` | Optional |
   | `CLOUDINARY_API_SECRET` | Optional |

   Render sets `PORT` for you; the app uses it automatically.

6. **Create Web Service.** Render will build and deploy. Wait until the status is **Live**.
7. **URL:** At the top you’ll see a URL like `https://jewellery-store-api.onrender.com`. This is your **API base host**. The API base URL is `https://jewellery-store-api.onrender.com/api/v1`.
8. **Health check:** Open `https://jewellery-store-api.onrender.com/health` in a browser. You should see `{"ok":true,...}`.
9. **CORS (after Vercel):** Once the frontend is deployed (step 3), go back to Render → your service → **Environment** and set:
   - `CLIENT_URL` = `https://your-app.vercel.app` (your real Vercel URL).
   - For multiple origins: `CLIENT_URL` = `https://your-app.vercel.app,https://yourdomain.com`  
   Save; Render will redeploy with the new env.

   **Note:** On Render’s free tier, the service may spin down after ~15 minutes of no traffic. The first request after that can take 30–60 seconds (cold start). Paid plans keep the service always on.

---

## 2b. Backend on Vercel (alternative to Render)

You can host the Express API on Vercel as serverless functions (same account as the frontend, separate project).

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**.
2. Import the **same GitHub repo** (e.g. jewellery-store).
3. **Configure:**
   - **Project Name:** e.g. `jewellery-store-api`
   - **Root Directory:** set to **`server`** (so only the backend is deployed).
   - **Framework Preset:** Other (no framework).
   - **Build Command:** leave default or `npm install`.
   - **Output Directory:** leave empty (this is an API-only project).
4. **Environment variables** (add before deploying):

   | Key | Value |
   |-----|--------|
   | `NODE_ENV` | `production` |
   | `MONGODB_URI` | Your Atlas connection string |
   | `JWT_SECRET` | Long random string |
   | `JWT_REFRESH_SECRET` | Same or another random string |
   | `CLIENT_URL` | Your **frontend** URL (e.g. `https://your-store.vercel.app`) — set after the frontend is deployed, then redeploy backend |

5. **Deploy.** When done, Vercel gives a URL like `https://jewellery-store-api.vercel.app`.
6. **API base URL:** Your API lives at **`https://jewellery-store-api.vercel.app/api/v1`** (all routes go through the catch-all `/api/*`).
7. **Health check:** Open `https://jewellery-store-api.vercel.app/api/health` in a browser (note the `/api` prefix). You should see `{"ok":true,...}`.
8. **Frontend:** When you deploy the frontend (step 3), set `NEXT_PUBLIC_API_URL` = `https://jewellery-store-api.vercel.app/api/v1`. Then in this backend project set `CLIENT_URL` to the frontend URL and **redeploy** so CORS works.

**Note:** On Vercel the first request after idle can be slower (cold start). The backend runs as serverless; no separate server to manage.

---

## 3. Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. **Add New** → **Project** → Import this GitHub repo.
3. **Root Directory:** Click “Edit” and set to `client`. Confirm.
4. **Environment variables:** Add:
   - `NEXT_PUBLIC_API_URL` = your **backend** API base (e.g. `https://jewellery-store-api.onrender.com/api/v1` if using Render, or `https://jewellery-store-api.vercel.app/api/v1` if backend is on Vercel).
5. **Deploy.** Vercel will run `npm install` and `npm run build` in the `client` folder.
6. When done, you’ll get a URL like `https://your-app.vercel.app`. This is your **store URL**.
7. **Update backend CORS:** In Render → your service → **Environment**, set `CLIENT_URL` to `https://your-app.vercel.app` (and save). Render will redeploy so CORS allows your frontend.

---

## 4. First admin user

After the backend is running and connected to Atlas:

**Option A – Seed script (from your machine)**  
From the project root:

```bash
cd server
# Set env to point to production DB (use your real MONGODB_URI)
export MONGODB_URI="mongodb+srv://..."
npm run seed
```

This creates admin `admin@jewellerystore.com` / `admin123` and a sample product if the DB is empty.

**Option B – Manual**  
1. Register a new user from the deployed site (Register page).  
2. In MongoDB Atlas: **Database** → **Browse collections** → open the `users` collection.  
3. Find the new user and edit: set `role` to `admin`.  
4. Save. You can now log in as that user and use **Admin**.

---

## 5. Optional: custom domain

- **Vercel:** Project → Settings → Domains → add your domain and follow DNS instructions.
- **Render:** Settings → Custom Domain to add a branded API URL.
- After adding a domain, add it to `CLIENT_URL` on the server (comma-separated if you have multiple).

---

## Checklist

- [ ] MongoDB Atlas cluster created, user added, `0.0.0.0/0` (or correct IP) in Network Access.
- [ ] Render Web Service: root = `server`, env vars set (especially `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`).
- [ ] Render health: `https://your-service.onrender.com/health` returns OK.
- [ ] Vercel project: root = `client`, `NEXT_PUBLIC_API_URL` = your Render API base (e.g. `https://your-service.onrender.com/api/v1`).
- [ ] `CLIENT_URL` on Render set to your Vercel URL (and any custom domain).
- [ ] Admin user created (seed or manual) and able to log in and access Admin.

Once these are done, the store is deployed end-to-end.

---

## Alternative: Railway (backend)

1. [railway.app](https://railway.app) → New project → Deploy from GitHub repo.
2. Set **Root Directory** to `server`. Add the same env vars as in the Render table above.
3. Generate a domain in Settings → Networking. Use that URL as `NEXT_PUBLIC_API_URL` in Vercel and as `CLIENT_URL` (your Vercel URL) on Railway.

---

## Optional: Docker (server)

From the `server` folder you can build and run with Docker:

```bash
cd server
docker build -t jewellery-api .
docker run -p 5000:5000 -e MONGODB_URI="..." -e JWT_SECRET="..." -e CLIENT_URL="..." jewellery-api
```

Railway and Render can also deploy using the `server/Dockerfile` if you enable Docker in the project settings.
