# API Routes Summary

Base path: `/api/v1` (configurable via `API_VERSION`).

## Public

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check (no prefix) |
| POST | /auth/register | Register (email, password, name, phone?) |
| POST | /auth/login | Login (email, password) |
| POST | /auth/refresh | New access token (refreshToken in body) |
| GET | /products | List products (query: category, goldPurity, productType, isFeatured, page, limit, sort, search) |
| GET | /products/slug/:slug | Get product by slug |
| GET | /products/:id | Get product by ID |

## Protected (Authorization: Bearer &lt;token&gt;)

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/logout | Logout (clears refresh token) |
| GET | /auth/me | Current user |
| GET | /cart | Get cart |
| POST | /cart/items | Add item (productId, quantity?) |
| PATCH | /cart/items | Update item (productId, quantity) |
| DELETE | /cart/items/:productId | Remove item |
| DELETE | /cart | Clear cart |
| POST | /orders | Create order (shippingAddress, paymentMethod?, notes?) |
| GET | /orders | My orders |
| GET | /orders/:id | Order detail |

## Admin (Bearer token + role admin or super_admin)

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/products | List all products (query: page, limit, sort, category, goldPurity, productType, isActive) |
| POST | /admin/products | Create product |
| PUT/PATCH | /admin/products/:id | Update product |
| DELETE | /admin/products/:id | Deactivate product (soft delete) |
| GET | /admin/orders | List all orders (query: page, limit, status) |
| PATCH | /admin/orders/:id | Update order (status, paymentStatus, trackingNumber, trackingUrl) |
