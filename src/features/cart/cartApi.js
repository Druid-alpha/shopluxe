import axios from "@/lib/axios";

const API = `${import.meta.env.VITE_API_URL}/cart`

// 🔥 Normalize cart for frontend
export const normalizeCart = (cart) =>
  cart.map((i) => {
    const variantSku =
      typeof i.variant === 'string'
        ? i.variant
        : i.variant?.sku || null;
    const variantObj = i.product?.variants?.find(v => v.sku === variantSku) || null;
    const productImage =
      variantObj?.image?.url || i.product?.images?.[0]?.url || null

    return {
      key: `${i.product._id}-${variantSku || 'default'}`,
      productId: i.product._id,
      title: i.product.title,
      price: variantObj?.price || i.product.price,
      qty: i.qty,
      variant: variantSku, // Always string or null
      variantStock: variantObj?.stock, // Specific variant stock
      productStock: i.product.stock,    // Base product stock
      productImage
    };
  });

export const getCart = async () => {
  const res = await axios.get(API, { withCredentials: true });
  return normalizeCart(res.data.cart);
};

export const addToCart = async (productId, qty = 1, variant = null) => {
  const variantSku = typeof variant === 'string' ? variant : variant?.sku ?? null;
  const res = await axios.post(
    `${API}/add`,
    { productId, qty, variant: variantSku },
    { withCredentials: true }
  );
  return normalizeCart(res.data.cart);
};

export const updateCartItem = async (productId, qty, variant = null) => {
  const variantSku = typeof variant === 'string' ? variant : variant?.sku ?? null;
  const res = await axios.put(
    `${API}/update`,
    { productId, qty, variant: variantSku },
    { withCredentials: true }
  );
  return normalizeCart(res.data.cart);
};

export const removeCartItem = async (productId, variant = null) => {
  const variantSku = typeof variant === 'string' ? variant : variant?.sku ?? null;
  const res = await axios.delete(`${API}/remove`, {
    data: { productId, variant: variantSku },
    withCredentials: true
  });
  return normalizeCart(res.data.cart);
};

export const clearCartBackend = async () => {
  const res = await axios.delete(`${API}/clear`, { withCredentials: true });
  return normalizeCart(res.data.cart);
};
