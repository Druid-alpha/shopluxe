# ShopLuxe Frontend

Modern ecommerce frontend built with React + Vite, powered by Redux Toolkit, RTK Query, Tailwind CSS, and Paystack checkout.

## Overview

This repository contains the client application for ShopLuxe. It supports:

- Customer browsing, filtering, and searching products
- Product detail pages with variant selection and reviews
- Cart and wishlist flows (guest + authenticated behavior)
- Authentication with OTP email verification and password reset
- Checkout and payment redirect flow via Paystack
- Order receipt and order tracking screens
- Admin dashboard for product, user, order, review, and analytics management

## Tech Stack

- React 19
- Vite 7
- React Router DOM 7
- Redux Toolkit + RTK Query
- Tailwind CSS + Radix UI primitives
- React Hook Form + Zod validation
- Framer Motion animations
- Axios + Fetch (mixed usage)

## Project Structure

```text
myapp/
|- src/
|  |- app/
|  |  |- api.js              # RTK Query base API + token refresh logic
|  |  |- store.js            # Redux store
|  |- components/            # Shared UI + layout components
|  |- features/
|  |  |- auth/               # auth slice + RTK Query auth endpoints
|  |  |- cart/               # cart slice + API helpers
|  |  |- orders/             # order endpoints
|  |  |- products/           # products, reviews, product details
|  |  |- wishlist/           # wishlist API + slice (guest state)
|  |- pages/
|  |  |- admin/              # admin dashboard modules
|  |  |- *.jsx               # route-level pages
|  |- App.jsx                # route definitions + app shell
|  |- main.jsx               # app bootstrap
|- orderReceipt.jsx          # order receipt view (currently outside src)
|- vercel.json               # SPA rewrite rules
|- vite.config.js            # Vite + alias config
```

## Routing Map

### Public Routes

- `/` -> Home
- `/products` -> Product catalog with filters/search/sort
- `/products/:id` -> Product details + variants + reviews
- `/cart` -> Cart page
- `/register` -> Registration
- `/verify-email` -> OTP verification
- `/login` -> Login
- `/forgot-password` -> Request password reset
- `/reset-password/:token` -> Set new password
- `/payment/success` -> Post-payment verification callback

### Protected User/Admin Routes

- `/profile` -> Authenticated profile page
- `/checkout` -> Shipping + payment initialization
- `/wishlist` -> Authenticated wishlist
- `/orders/:id` -> Order receipt

### Admin-only Routes

- `/admin` -> Admin dashboard (tabbed: products/users/orders/reviews/analytics)
- `/admin/products` -> Product manager
- `/admin/users` -> User manager
- `/admin/orders` -> Order manager

### Fallback

- `*` -> Not Found page

## State Management

Redux store currently wires:

- `auth` slice (user + token persistence)
- `cart` slice (guest cart persistence)
- `api` reducer (RTK Query cache)

RTK Query base API in `src/app/api.js`:

- Uses `VITE_API_URL`
- Sends cookies (`credentials: 'include'`)
- Injects `Authorization: Bearer <token>` when token exists
- Automatically attempts `/auth/refresh` on `401`

## API Features Exposed in Frontend

### Auth

- Register (`/auth/register`)
- Verify OTP (`/auth/verify-otp`)
- Resend OTP (`/auth/resend-otp`)
- Login/Logout (`/auth/login`, `/auth/logout`)
- Refresh token (`/auth/refresh`)
- Profile (`/users/me`)

### Products and Reviews

- Product list, product detail, featured products
- Admin product CRUD, soft delete, restore, hard delete
- Review list/add/update/delete
- Review helpful voting
- Admin review moderation + featured toggling

### Cart / Wishlist / Orders

- Cart fetch/add/update/remove/clear/sync
- Wishlist get/toggle
- Order create/list/detail/update status/delete

## Environment Variables

Create a `.env` file in project root:

```env
VITE_API_URL=https://your-backend-domain/api
VITE_PAYSTACK_PUBLICKEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
```

Notes:

- `VITE_API_URL` must point to the backend API base URL.
- Backend must allow credentials (cookies) and CORS for this frontend origin.
- Paystack initialization and verification depend on backend endpoints.

## Local Development

### Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended

### Install

```bash
npm install
```

### Run Dev Server

```bash
npm run dev
```

Default Vite URL is usually `http://localhost:5173`.

### Build Production Bundle

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Authentication and Session Behavior

- Access token is stored in Redux + localStorage.
- Backend session/refresh flows use cookies (`withCredentials`/`credentials: include`).
- `ProtectedRoute` blocks unauthorized users and enforces role-based access.
- On login, guest cart items are synced to backend cart when available.

## Checkout and Payment Flow

1. User fills shipping details on `/checkout`.
2. Frontend creates order via `POST /orders`.
3. Frontend initializes Paystack via `POST /payments/paystack/init`.
4. User is redirected to Paystack hosted checkout.
5. Paystack redirects back to `/payment/success?reference=...`.
6. Frontend verifies payment with `GET /payments/verify/:reference`.
7. Cart is cleared and user is redirected to order receipt.

## Admin Dashboard Capabilities

- Product inventory management, filtering, creation/editing, feature toggles
- Soft delete + restore + permanent delete operations
- User role updates (promote/demote), user deletion
- Order monitoring with polling and status/payment updates
- Review moderation and featured review curation
- Quick analytics cards (users, products, orders, revenue)

## UI/UX Notes

- Tailwind-based design system with reusable `src/components/ui/*`
- Radix UI primitives for dialogs, dropdowns, tabs, etc.
- Framer Motion page and section transitions
- React Slick used in homepage hero carousel

## Deployment

### Vercel

`vercel.json` includes SPA rewrites so direct route navigation works:

- `/api/(.*)` -> `/api/$1`
- all other routes -> `/index.html`

### General Static Hosting

- Build with `npm run build`
- Serve the `dist/` folder
- Ensure fallback to `index.html` for client-side routes

## Known Implementation Notes

- `orderReceipt.jsx` is currently located at project root and imported in `src/App.jsx`.
- `wishlistSlice` exists but is not currently wired into `src/app/store.js` reducer map.
- Project currently uses both RTK Query and direct `fetch`/`axios` in different modules.

## Suggested Improvements

- Move `orderReceipt.jsx` into `src/pages/` for consistency.
- Standardize all API calls onto RTK Query (or a single API client style).
- Re-enable/wire wishlist reducer if guest wishlist state should be globally tracked.
- Add unit/integration tests (Vitest + React Testing Library).
- Add CI checks for lint/build/test.

## Scripts

- `npm run dev` -> start Vite dev server
- `npm run build` -> production build
- `npm run preview` -> preview built app
- `npm run lint` -> run ESLint

## License

No license file is currently included in this repository. Add one if open-source distribution is intended.
