import axios from "@/lib/axios";

const API = `${import.meta.env.VITE_API_URL}/cart`

const getVariantKey = (variant) => {
  if (!variant) return "default";
  if (typeof variant === "string") return variant || "default";
  if (variant?.sku) return variant.sku;
  const size = variant?.size || "";
  const color = variant?.color || "";
  const combined = `${color}|${size}`.trim();
  return combined === "|" ? "default" : combined;
};

const getColorName = (rawColor) => {
  if (!rawColor) return "";
  if (typeof rawColor === "string") {
    if (/^[a-f0-9]{24}$/i.test(rawColor)) return "";
    return rawColor;
  }
  return rawColor.name || "";
};

const buildVariantLabel = ({ variantSku, size, colorName }) => {
  if (colorName && size) return `${colorName} / ${size}`;
  if (size) return `Size: ${size}`;
  if (colorName) return `Color: ${colorName}`;
  return variantSku || "";
};

// 🔥 Normalize cart for frontend
export const normalizeCart = (cart) => {
  if (!cart || !Array.isArray(cart)) return [];
  const seedTime = Date.now()

  return cart
    .filter(item => item.product && (typeof item.product === 'object'))
    .map((item, index) => {
      const product = item.product;
      const variantSku =
        typeof item.variant === 'string'
          ? item.variant
          : item.variant?.sku || null;

      const variantObj = product.variants?.find(v => v.sku === variantSku) || null;
      const variantSize = variantObj?.options?.size || item.variant?.size || null
      const variantColorObj = variantObj?.options?.color || null
      const variantColorName = getColorName(variantColorObj) || getColorName(item.variant?.color)
      const variantColorHex = (variantColorObj && typeof variantColorObj === 'object' && variantColorObj.hex)
        ? variantColorObj.hex
        : null
      const variantColorValue = variantColorObj?._id || variantColorObj?.name || item.variant?.color || null
      const variantLabel = buildVariantLabel({
        variantSku,
        size: variantSize,
        colorName: variantColorName
      })
      const variantPayload = {
        ...(variantSku ? { sku: variantSku } : {}),
        ...(variantSize ? { size: variantSize } : {}),
        ...(variantColorValue ? { color: variantColorValue } : {})
      }
      const productImage =
        variantObj?.image?.url || product.images?.[0]?.url || null
      const basePrice = Number(variantObj?.price ?? product.price ?? 0)
      const discount = Number(variantObj?.discount ?? product.discount ?? 0)
      const finalPrice = discount > 0
        ? Math.round(basePrice * (1 - discount / 100))
        : basePrice
      const fallbackAddedAt = new Date(seedTime + index).toISOString()
      const addedAt = item.addedAt || item.createdAt || item.updatedAt || fallbackAddedAt

      return {
        key: `${product._id || product.id || Math.random()}-${getVariantKey(item.variant)}`,
        productId: product._id || product.id,
        title: product.title || 'Product',
        price: finalPrice,
        basePrice,
        discount,
        qty: item.qty,
        variant: variantSku,
        variantPayload,
        variantLabel,
        variantSize,
        variantColor: variantColorObj || item.variant?.color || null,
        variantColorHex,
        variantColorName,
        variantStock: variantObj?.stock,
        productStock: product.stock,
        clothingType: product.clothingType || null,
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
  const res = await axios.post(
    `${API}/add`,
    { productId, qty, variant },
    { withCredentials: true }
  );
  return normalizeCart(res.data.cart);
};

export const updateCartItem = async (productId, qty, variant = null) => {
  const res = await axios.put(
    `${API}/update`,
    { productId, qty, variant },
    { withCredentials: true }
  );
  return normalizeCart(res.data.cart);
};

export const removeCartItem = async (productId, variant = null) => {
  const res = await axios.delete(`${API}/remove`, {
    data: { productId, variant },
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
