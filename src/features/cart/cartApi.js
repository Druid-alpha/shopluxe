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

const HEX_NAME_MAP = {
  "#000000": "Midnight Black",
  "#0f172a": "Midnight",
  "#111111": "Jet Black",
  "#1f2937": "Charcoal",
  "#374151": "Graphite",
  "#6b7280": "Slate Gray",
  "#9ca3af": "Steel Gray",
  "#d1d5db": "Silver",
  "#e5e7eb": "Cloud",
  "#f5f5f5": "Soft White",
  "#ffffff": "Pure White",
  "#fff5f5": "Blush",
  "#ffe4e6": "Rose Quartz",
  "#fecdd3": "Petal",
  "#fda4af": "Coral Pink",
  "#fb7185": "Watermelon",
  "#ef4444": "Crimson",
  "#dc2626": "Ruby",
  "#b91c1c": "Garnet",
  "#991b1b": "Burgundy",
  "#7f1d1d": "Merlot",
  "#fff1f2": "Soft Rose",
  "#ffe4b5": "Peach",
  "#fed7aa": "Apricot",
  "#f97316": "Tangerine",
  "#ea580c": "Burnt Orange",
  "#c2410c": "Clay",
  "#9a3412": "Cinnamon",
  "#78350f": "Mocha",
  "#ffedd5": "Champagne",
  "#fef3c7": "Butter",
  "#fde68a": "Honey",
  "#f59e0b": "Amber",
  "#d97706": "Ochre",
  "#b45309": "Bronze",
  "#92400e": "Caramel",
  "#facc15": "Gold",
  "#eab308": "Sunflower",
  "#fde047": "Lemon",
  "#fef08a": "Mellow Yellow",
  "#ecfccb": "Pistachio",
  "#d9f99d": "Lime Cream",
  "#a3e635": "Lime",
  "#84cc16": "Chartreuse",
  "#4d7c0f": "Moss",
  "#22c55e": "Emerald",
  "#16a34a": "Jade",
  "#15803d": "Forest",
  "#166534": "Pine",
  "#dcfce7": "Mint",
  "#bbf7d0": "Seafoam",
  "#86efac": "Spring Green",
  "#34d399": "Tropical Green",
  "#14b8a6": "Teal",
  "#0d9488": "Deep Teal",
  "#0f766e": "Lagoon",
  "#134e4a": "Evergreen",
  "#ccfbf1": "Aqua",
  "#99f6e4": "Ice Mint",
  "#5eead4": "Turquoise",
  "#2dd4bf": "Caribbean",
  "#e0f2fe": "Sky Mist",
  "#bae6fd": "Sky Blue",
  "#7dd3fc": "Daylight",
  "#38bdf8": "Azure",
  "#0ea5e9": "Bluebird",
  "#3b82f6": "Royal Blue",
  "#2563eb": "Cobalt",
  "#1d4ed8": "Sapphire",
  "#1e3a8a": "Navy",
  "#0f172a": "Midnight",
  "#6366f1": "Indigo",
  "#4f46e5": "Deep Indigo",
  "#4338ca": "Iris",
  "#312e81": "Ink",
  "#e0e7ff": "Periwinkle",
  "#c7d2fe": "Lavender Blue",
  "#8b5cf6": "Violet",
  "#7c3aed": "Amethyst",
  "#6d28d9": "Plum",
  "#4c1d95": "Aubergine",
  "#ede9fe": "Lilac",
  "#ddd6fe": "Wisteria",
  "#ec4899": "Rose",
  "#db2777": "Fuchsia",
  "#be185d": "Magenta",
  "#9d174d": "Wine",
  "#fce7f3": "Blush Pink",
  "#fbcfe8": "Pink Mist",
  "#f472b6": "Hot Pink",
  "#0f766e": "Lagoon",
  "#0b1020": "Obsidian",
  "#111827": "Onyx",
  "#1e293b": "Storm",
  "#334155": "Slate",
  "#475569": "Ash",
  "#64748b": "Smoke",
  "#94a3b8": "Mist",
  "#cbd5e1": "Fog",
  "#e2e8f0": "Frost",
  "#f8fafc": "Snow",
  "#fafafa": "Porcelain",
  "#e8e5e0": "Ivory",
  "#f7f3e9": "Cream",
  "#e5e0d8": "Stone",
  "#d6d3d1": "Mushroom",
  "#a8a29e": "Taupe",
  "#78716c": "Mocha Brown",
  "#57534e": "Cocoa",
  "#44403c": "Espresso",
  "#2f2f2f": "Graphite Black",
  "#3f3f46": "Steel",
  "#52525b": "Gunmetal",
  "#71717a": "Dusty Gray",
  "#a1a1aa": "Silver Mist",
  "#d4d4d8": "Pearl",
  "#e4e4e7": "Porcelain White",
  "#faf0e6": "Linen",
  "#ffefd5": "Papaya",
  "#ffe4b5": "Peach",
  "#f5deb3": "Wheat",
  "#deb887": "Sand",
  "#d2b48c": "Tan",
  "#c19a6b": "Camel",
  "#b08968": "Toffee",
  "#8d6e63": "Cappuccino",
  "#6d4c41": "Coffee",
  "#5d4037": "Chocolate",
  "#4e342e": "Espresso Brown",
  "#3e2723": "Dark Roast",
  "#e6ccb2": "Oat",
  "#d4a373": "Desert",
  "#c68642": "Sienna",
  "#a0522d": "Umber",
  "#8b4513": "Saddle",
  "#7f5539": "Hazel",
  "#6f4e37": "Mocha",
  "#ffe5b4": "Apricot",
  "#ffd1dc": "Blush Pink",
  "#ffc0cb": "Pink",
  "#ffb6c1": "Light Pink",
  "#ffa07a": "Light Salmon",
  "#ff7f7f": "Salmon",
  "#ff6f61": "Coral",
  "#ff4500": "Vermilion",
  "#ff2400": "Scarlet",
  "#ff0000": "Red",
  "#d1001f": "Cherry",
  "#a40000": "Oxblood",
  "#800000": "Maroon",
  "#7c0a02": "Barn Red",
  "#5c0a00": "Mahogany",
  "#fff8dc": "Cornsilk",
  "#fffacd": "Lemon Cream",
  "#fffdd0": "Cream",
  "#ffeaa7": "Vanilla",
  "#ffd700": "Gold",
  "#ffcc00": "Sunshine",
  "#f0e68c": "Khaki",
  "#e6e6fa": "Lavender",
  "#d8bfd8": "Thistle",
  "#dda0dd": "Plum Light",
  "#c8a2c8": "Lilac Purple",
  "#b19cd9": "Pastel Violet",
  "#a78bfa": "Lavender Purple",
  "#8a2be2": "Blue Violet",
  "#7b68ee": "Medium Slate Blue",
  "#6a5acd": "Slate Blue",
  "#4b0082": "Indigo Deep",
  "#2e1065": "Deep Purple",
  "#f0f9ff": "Ice",
  "#e0f7fa": "Aqua Mist",
  "#b2ebf2": "Lagoon Light",
  "#80deea": "Blue Lagoon",
  "#4dd0e1": "Lagoon Blue",
  "#26c6da": "Caribbean Blue",
  "#00bcd4": "Cyan",
  "#00acc1": "Deep Cyan",
  "#0097a7": "Teal Blue",
  "#006064": "Deep Sea",
  "#e3f2fd": "Sky",
  "#bbdefb": "Baby Blue",
  "#90caf9": "Powder Blue",
  "#64b5f6": "Cornflower",
  "#42a5f5": "Ocean Blue",
  "#2196f3": "Blue",
  "#1e88e5": "Azure Blue",
  "#1976d2": "Deep Blue",
  "#1565c0": "Royal Navy",
  "#0d47a1": "Navy Blue",
  "#f3e5f5": "Lavender Mist",
  "#e1bee7": "Orchid",
  "#ce93d8": "Violet Mist",
  "#ba68c8": "Purple",
  "#9c27b0": "Amethyst Purple",
  "#8e24aa": "Royal Purple",
  "#6a1b9a": "Plum Purple",
  "#4a148c": "Deep Purple",
  "#fce4ec": "Rose Mist",
  "#f8bbd0": "Rose Pink",
  "#f48fb1": "Pink Rose",
  "#f06292": "Bubblegum",
  "#e91e63": "Hot Rose",
  "#d81b60": "Raspberry",
  "#ad1457": "Berry",
  "#880e4f": "Mulberry",
  "#ede7f6": "Lavender Gray",
  "#d1c4e9": "Iris Mist",
  "#b39ddb": "Soft Lavender",
  "#9575cd": "Purple Haze",
  "#7e57c2": "Royal Iris",
  "#673ab7": "Purple",
  "#5e35b1": "Deep Iris",
  "#512da8": "Violet Deep",
  "#4527a0": "Plum",
  "#311b92": "Eggplant",
  "#efeae6": "Pearl White",
  "#656b83": "Slate Blue",
};

const isHexLike = (value) => /^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(String(value || ""))

const normalizeHex = (hex) => {
  if (!hex) return "";
  let h = String(hex).trim().toLowerCase();
  if (!h.startsWith("#")) h = `#${h}`;
  if (h.length === 4) {
    h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
  }
  return h;
};

const getColorName = (rawColor) => {
  if (!rawColor) return "";
  if (typeof rawColor === "string") {
    if (/^[a-f0-9]{24}$/i.test(rawColor)) return "";
    if (rawColor.startsWith("#") || isHexLike(rawColor)) {
      const hex = normalizeHex(rawColor);
      return HEX_NAME_MAP[hex] || "Custom Color";
    }
    return rawColor;
  }
  const name = rawColor.name || "";
  if (name && !name.startsWith("#") && !isHexLike(name)) return name;
  const hex = normalizeHex(rawColor.hex || name);
  return HEX_NAME_MAP[hex] || "Custom Color";
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
      const baseColorObj = product.color || null
      const variantColorName = getColorName(variantColorObj) || getColorName(item.variant?.color) || getColorName(baseColorObj)
      const variantColorHex = (variantColorObj && typeof variantColorObj === 'object' && variantColorObj.hex)
        ? variantColorObj.hex
        : (baseColorObj && typeof baseColorObj === 'object' && baseColorObj.hex ? baseColorObj.hex : null)
      const variantColorValue = variantColorObj?._id || variantColorObj?.name || item.variant?.color || baseColorObj?._id || baseColorObj?.name || null
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
