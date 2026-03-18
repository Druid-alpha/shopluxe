# ShopLuxe

I built ShopLuxe as a full-stack ecommerce platform focused on a clean shopping experience and a strong admin toolkit. The frontend lives in this repo and the backend runs from `../shop-luxe-BE`.

## Highlights
- Premium storefront with variants, filters, wishlist, and fast checkout.
- Admin dashboard for products, orders, returns, and quick restock.
- Paystack payments, Cloudinary media, and PDF invoices.
- Email flows for OTP, order updates, and returns.

## Tech Stack
Frontend
- React 19 + Vite
- Redux Toolkit + RTK Query
- Tailwind CSS

Backend
- Node.js + Express
- MongoDB (Mongoose)
- Paystack
- Cloudinary

## Running Locally
Backend
1. Open `../shop-luxe-BE`
2. Run `npm install`
3. Start: `npm run dev`

Frontend
1. In this repo, run `npm install`
2. Start: `npm run dev`

## Environment Notes
Frontend
- `VITE_API_URL` should point to your backend `/api` base.

Backend
- Set `CLIENT_URL`, `SMTP_USER`, `SMTP_PASS`, Paystack keys, and Cloudinary keys.

## Short LinkedIn Blurb (Optional)
I just shipped ShopLuxe, a full-stack ecommerce platform with a premium storefront, admin operations, Paystack payments, and return workflows. Built with React + Vite, Node/Express, and MongoDB.

## License
No license added yet.
