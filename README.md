# ShopLuxe — Full-Stack Ecommerce Platform

React + Vite ecommerce client for ShopLuxe. This app is designed to run with the ShopLuxe backend in the sibling folder `../shop-luxe-BE`.


## Project Overview

ShopLuxe is a full-stack ecommerce platform with a React/Vite frontend and a Node/Express/MongoDB backend. The frontend focuses on a premium retail browsing experience with category filters, product detail variants, wishlist, cart, and checkout. The backend provides authentication, product catalog, cart/order flows, and payment verification.

Core user flow:
- Browse products and filter by category/brand/price/color.
- Select variants (size/color) in product details and add to cart.
- Edit variants directly in cart (size/color selection where applicable).
- Checkout with shipping details and Paystack payment verification.
- View order receipt, track order timeline, and download invoice.
- Request returns from the receipt page (paid orders).

Additional UX:
- Compare drawer (up to 3 products).
- Recently viewed product rail.
- Sticky mobile add-to-cart bar on product details.
- My Orders page with ETA estimates and tracking links.

Core admin flow:
- Manage products, variants, pricing, stock, and images.
- Quick Restock modal for instant stock refills.
- Manage orders and fulfillment status.
- Handle returns (approve/reject/refund) with notes and refund amounts.
- Refund actions can include admin notes (emailed to customers).
- Manage users and reviews.
- Export products and orders as CSV backups.
- Admin notifications for new orders, return requests, and user signups.

## Architecture

Frontend (this repo):
- React + Vite SPA with React Router for navigation.
- Redux Toolkit + RTK Query for server state (auth, cart, orders, products).
- Tailwind CSS UI with Framer Motion page transitions.

Backend (sibling repo `../shop-luxe-BE`):
- Node.js + Express REST API.
- MongoDB via Mongoose models.
- Paystack payments and Cloudinary for media/invoice storage.

Key boundaries:
- Frontend talks to `/api/*` routes.
- Auth uses cookie-based session in the frontend.
- Orders and payments are verified server-side; receipts are derived from server data.

High-level diagram:

```
Browser (React/Vite)
  |
  |  HTTPS (REST JSON)
  v
Vercel (Frontend)
  |
  |  SPA assets + /api proxy
  v
Vercel Serverless (api/index.js)
  |
  |  Express API
  v
Backend API (Express)
  |         |            |
  |         |            +--> Paystack (payments/verify + webhook)
  |         |
  |         +--> Cloudinary (images + invoice PDFs)
  |
  +--> MongoDB (products, users, carts, orders)
```

Auth/token flow:
- Cookie-based session only (no localStorage tokens in the frontend).
- Requests include cookies via `credentials: include`.
- Protected routes fetch profile data and redirect to `/login` if missing.

## Repository Scope

This repository (`myapp`) is the frontend only.

Backend location used by this frontend:
- `../shop-luxe-BE`

## Tech Stack

- React + Vite
- React Router
- Redux Toolkit + RTK Query
- Tailwind CSS + Radix UI
- React Hook Form + Zod
- Framer Motion
- Axios + fetch (mixed usage)

## Frontend Scripts

From `myapp/`:

```bash
npm install
npm run dev
npm run build
npm run preview
npm run lint
```

## Frontend Runtime Configuration

Frontend API base behavior in `src/app/api.js`:
- Uses `VITE_API_URL` when set.
- If not set:
  - Dev fallback: `/api`
  - Production fallback: `https://shoplux-be.vercel.app/api`

Note: some modules call `import.meta.env.VITE_API_URL` directly (not fallback-aware), so setting `VITE_API_URL` is strongly recommended.

## Frontend Routes (App.jsx)

Public routes:
- `/`
- `/products`
- `/products/:id`
- `/cart`
- `/register`
- `/login`
- `/forgot-password`
- `/verify-email`
- `/reset-password/:token`
- `/payment/success`
- `/help-center`
- `/privacy-policy`
- `/terms-of-service`

Protected user/admin routes:
- `/profile`
- `/checkout`
- `/wishlist`
- `/orders` (My Orders)
- `/orders/:id`

Admin-only routes:
- `/admin`
- `/admin/products`
- `/admin/users`
- `/admin/orders`

Fallback:
- `*` -> Not Found

## Backend Integration (`shop-luxe-BE`)

The frontend expects backend endpoints under `/api/*`.

Backend scripts (from `shop-luxe-BE/package.json`):

```bash
npm install
npm run dev
npm start
```

Backend entry points:
- `index.js` (local server mode)
- `api/index.js` (Vercel serverless handler)

Main backend route groups mounted under `/api`:
- `/auth`
- `/users`
- `/products`
- `/reviews`
- `/cart`
- `/orders`
- `/wishlist`
- `/admin`
- `/payments`

## API Contracts (High Level)

Auth:
- `POST /api/auth/login` -> returns user and sets cookies
- `POST /api/auth/refresh` -> refreshes session
- `GET /api/users/profile` -> current user profile

Products:
- `GET /api/products` -> list products (filterable, paginated)
- `GET /api/products/:id` -> product details with variants and reviews
- `GET /api/products/filters` -> filter options (categories, brands, colors, sizes)

Cart:
- `GET /api/cart` -> current cart (populated product + variant info)
- `POST /api/cart/add` -> add item (productId, qty, optional variant)
- `PUT /api/cart/update` -> update item qty (productId, qty, optional variant)
- `DELETE /api/cart/remove` -> remove item (productId, optional variant)
- `POST /api/cart/sync` -> merge guest cart into user cart

Orders:
- `POST /api/orders/validate` -> validate stock before checkout
- `POST /api/orders` -> create order from cart and shipping address
- `GET /api/orders/:id` -> order detail for receipt
- `POST /api/orders/:id/invoice` -> signed invoice URL
- `POST /api/orders/:id/return` -> request a return (paid orders)
- `PATCH /api/orders/:id/return` -> admin return decision (approve/reject/refund)

Payments:
- `POST /api/payments/paystack/init` -> initialize Paystack transaction
- `GET /api/payments/verify/:reference` -> verify payment and update order
- `POST /api/payments/paystack/webhook` -> Paystack webhook
- `POST /api/payments/paystack/refund` -> admin refund (partial/full)

Admin (examples):
- `GET /api/admin/products`
- `POST /api/products/admin`
- `PUT /api/products/admin/:id`
- `PATCH /api/orders/:id/status`
- `GET /api/admin/export/products`
- `GET /api/admin/export/orders`

Note: payload shapes are defined in the backend controllers and Mongoose schemas.

Paystack webhook endpoint:
- `POST /api/payments/paystack/webhook`

## Local Development (Frontend + Backend)

1. Start backend from `../shop-luxe-BE`.
2. Start frontend from `myapp`.
3. Ensure frontend `VITE_API_URL` points to backend `/api` base.
4. Ensure backend `CLIENT_URL` matches frontend origin for CORS/cookies.

## Deployment Notes

Frontend `vercel.json` rewrites:
- `/api/(.*)` -> `/api/$1`
- all other routes -> `/index.html`

Backend `vercel.json` uses:
- `api/index.js` as serverless function
- rewrite `/api/(.*)` -> `/api/index.js`

## Payment And Invoice Flow

- Payment verification runs in `src/pages/PaymentSuccess.jsx`, clears cart, and redirects to `/orders/:id`.
- Invoice download requests a signed invoice URL from `/orders/:id/invoice` and falls back to a client-side PDF if needed.
- Order receipt uses RTK Query and refetches on mount and focus to avoid stale status after payment.
- Admin refunds run through Paystack via `/payments/paystack/refund` (partial or full).
- Returns are requested by customers and approved/rejected/refunded by admin in the Orders screen.



## Troubleshooting

- If the receipt shows "Awaiting Payment Confirmation" after a successful Paystack redirect, wait a few seconds. The receipt view refetches automatically.
- If invoice download fails once, retry after confirmation is visible or use the fallback PDF export.
- Make sure `VITE_API_URL` points to the backend `/api` base in dev and prod.

## Deployment

Frontend:
- Vite build output deployed with Vercel.
- Uses `vercel.json` rewrites to support SPA routing and `/api` proxy.

Backend:
- Express app deployed as Vercel serverless handler (`api/index.js`).
- Exposes `/api/*` routes and the Paystack webhook.
- Cloudinary stores invoices and product media.

Environment:
- Frontend uses `VITE_API_URL` to point at backend `/api`.
- Backend expects `CLIENT_URL` for CORS and Paystack callback URL.

## License

No license file is currently present.
