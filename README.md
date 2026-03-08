# ShopLuxe Frontend (myapp)

React + Vite ecommerce client for ShopLuxe. This app is designed to run with the ShopLuxe backend in the sibling folder `../shop-luxe-BE`.

## Repository Scope

This repository (`myapp`) is the frontend only.

Backend location used by this frontend:
- `../shop-luxe-BE`

## Tech Stack

- React 19 + Vite 7
- React Router 7
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

Build status checked on March 9, 2026:
- `npm run build` completes successfully.
- Bundle warning exists for large JS chunk size.

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

## Current Implementation Notes

- `orderReceipt.jsx` is still at project root and imported as `../orderReceipt` from `src/App.jsx`.
- Redux store currently wires `auth`, `cart`, and RTK Query API reducers; wishlist reducer is not wired.
- API usage style is mixed (RTK Query + axios + fetch).

## License

No license file is currently present.
