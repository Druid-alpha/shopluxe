import axios from "@/lib/axios";

const API = `${import.meta.env.VITE_API_URL}/cart`

// 🔥 Normalize cart for frontend
export const normalizeCart = (cart) => {
  if (!cart || !Array.isArray(cart)) return [];

  return cart
    .filter(item => item.product && (typeof item.product === 'object')) // Safety: Filter out unpopulated/deleted products
    .map((item) => {
      const product = item.product;
      const variantSku =
        typeof item.variant === 'string'
          ? item.variant
          : item.variant?.sku || null;

      const variantObj = product.variants?.find(v => v.sku === variantSku) || null;
      const productImage =
        variantObj?.image?.url || product.images?.[0]?.url || null
      const basePrice = Number(variantObj?.price ?? product.price ?? 0)
      const discount = Number(variantObj?.discount ?? product.discount ?? 0)
      const finalPrice = discount > 0
        ? Math.round(basePrice * (1 - discount / 100))
        : basePrice
      const addedAt = item.updatedAt || item.createdAt || item.addedAt || new Date().toISOString()

      return {
        key: `${product._id || product.id || Math.random()}-${variantSku || 'default'}`,
        productId: product._id || product.id,
        title: product.title || 'Product',
        price: finalPrice,
        basePrice,
        discount,
        qty: item.qty,
        variant: variantSku,
        variantStock: variantObj?.stock,
        productStock: product.stock,
        productImage,
        addedAt
      };
    })
    .sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
};

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
export const syncCart = async (items) => {
  const res = await axios.post(
    `${API}/sync`,
    { items },
    { withCredentials: true }
  )

  return normalizeCart(res.data.cart)
}
