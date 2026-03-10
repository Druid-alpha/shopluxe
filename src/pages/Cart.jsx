// src/pages/Cart.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { removeGuestCartItem, setCart, updateGuestCartQty } from '@/features/cart/cartSlice';
import * as cartApi from '@/features/cart/cartApi';
import { Trash, Loader2, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CLOTHING_TYPES = new Set(['clothes', 'shoes', 'bags', 'eyeglass'])
const SIZE_TYPE_LABEL = {
  clothes: 'Size',
  shoes: 'Shoe',
  bags: 'Size',
  eyeglass: 'Frame'
}

function VariantBadges({ item }) {
  const isClothing = CLOTHING_TYPES.has(item.clothingType)
  const colorHex = item.variantColorHex || null
  const colorName = item.variantColorName || (item.variantLabel?.split(' / ')?.[0] || '')
  const size = item.variantSize || item.variantLabel?.split(' / ')?.[1] || ''
  const sizeTypeLabel = SIZE_TYPE_LABEL[item.clothingType] || 'Size'

  if (!colorName && !size && !item.variantLabel) return null

  if (isClothing) {
    return (
      <div className="flex flex-wrap items-center gap-2 mt-1">
        {colorName && (
          <span className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
            {colorHex && (
              <span
                className="inline-block w-3 h-3 rounded-full border border-gray-200 flex-shrink-0"
                style={{ backgroundColor: colorHex }}
              />
            )}
            {colorName}
          </span>
        )}
        {size && (
          <span className="bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
            {sizeTypeLabel}: {size}
          </span>
        )}
        {!colorName && !size && item.variantLabel && (
          <span className="bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
            {item.variantLabel}
          </span>
        )}
      </div>
    )
  }

  // Non-clothing: show simple label tag
  if (item.variantLabel || item.variant) {
    return (
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded inline-block mt-1">
        {item.variantLabel || item.variant}
      </p>
    )
  }

  return null
}

export default function Cart() {
  const cart = useAppSelector(state => state.cart.items);
  const user = useAppSelector(state => state.auth.user)
  const sortedCart = [...cart].sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0))

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [updatingItems, setUpdatingItems] = useState({})

  /* ================= LOAD CART ================= */
  useEffect(() => {
    if (!user) return
    const fetchCart = async () => {
      try {
        const data = await cartApi.getCart();
        dispatch(setCart(data));
      } catch (err) {
        console.error('Failed to fetch cart:', err);
      }
    };
    fetchCart();
  }, [dispatch, user]);

  if (!cart.length) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-8 p-12 text-center">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200">
          <ShoppingCart className="text-gray-300" size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black tracking-tighter uppercase">Your bag is empty</h2>
          <p className="text-gray-400 text-sm font-medium">Add some items to start your collection.</p>
        </div>
        <Button
          className="bg-black text-white hover:bg-slate-800 rounded-none px-12 py-7 text-xs font-black uppercase tracking-widest"
          onClick={() => navigate('/')}
        >
          Return to Collections
        </Button>
      </div>
    );
  }

  const total = sortedCart.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 1), 0);

  /* ================= CHANGE QUANTITY ================= */
  const changeQty = async (item, delta) => {
    if (updatingItems[item.key]) return
    const currentQty = Number(item.qty);
    const stockValue = item.variantStock ?? item.productStock
    const availableStock = Number.isFinite(stockValue) ? Number(stockValue) : Number.POSITIVE_INFINITY
    const newQty = currentQty + Number(delta);

    if (newQty < 1) return;
    if (newQty > availableStock) {
      toast({ title: 'Reached maximum stock limit', variant: 'destructive' });
      return;
    }

    setUpdatingItems(prev => ({ ...prev, [item.key]: true }))
    if (!user) {
      dispatch(updateGuestCartQty({ key: item.key, qty: newQty }))
      setUpdatingItems(prev => ({ ...prev, [item.key]: false }))
      return
    }

    const optimisticCart = cart.map(cartItem =>
      cartItem.key === item.key ? { ...cartItem, qty: newQty } : cartItem
    )
    dispatch(setCart(optimisticCart))

    try {
      const data = await cartApi.updateCartItem(item.productId, newQty, item.variantPayload || item.variant);
      dispatch(setCart(data));
    } catch (err) {
      console.error('Failed to update item:', err);
      dispatch(setCart(cart));
      toast({
        title: 'Failed to update cart',
        description: err.response?.data?.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setUpdatingItems(prev => ({ ...prev, [item.key]: false }))
    }
  };

  /* ================= REMOVE ITEM ================= */
  const removeItem = async (item) => {
    if (!user) {
      dispatch(removeGuestCartItem(item.key))
      return
    }
    try {
      const data = await cartApi.removeCartItem(item.productId, item.variantPayload || item.variant);
      dispatch(setCart(data));
    } catch (err) {
      console.error('Failed to remove item:', err);
      toast({
        title: 'Failed to remove item',
        description: err.response?.data?.message || 'Please try again',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="lg:w-2/3 space-y-12">
          <div className="space-y-8">
            {sortedCart.map(item => {
              const stockValue = item.variantStock ?? item.productStock
              const hasKnownStock = Number.isFinite(stockValue)
              const maxStock = hasKnownStock ? Number(stockValue) : Number.POSITIVE_INFINITY

              return (
                <div
                  key={item.key}
                  className="flex flex-col sm:flex-row items-center sm:items-start gap-8 group"
                >
                  {/* Product Image */}
                  <div className="w-full sm:w-40 aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 p-4 transition-all group-hover:shadow-md">
                    <img
                      src={item.productImage || 'https://via.placeholder.com/150'}
                      alt={item.title}
                      className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105 duration-500"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 w-full space-y-4 pt-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="font-black text-lg text-slate-900 tracking-tight uppercase leading-tight">{item.title}</h3>
                        <VariantBadges item={item} />
                      </div>
                      <div className="text-right">
                        <p className="font-black text-lg text-slate-900">
                          ₦{((item.price || 0) * (item.qty || 1)).toLocaleString()}
                        </p>
                        <p className="text-[10px] font-bold text-gray-300 tracking-widest uppercase">₦{(item.price || 0).toLocaleString()} /ea</p>
                      </div>
                    </div>

                    {/* Quantity & Remove */}
                    <div className="flex items-center justify-between pt-6">
                      <div className="flex items-center bg-gray-50 rounded-xl px-2 border border-gray-100">
                        <button
                          className="w-10 h-10 flex items-center justify-center font-bold text-gray-400 hover:text-black transition disabled:opacity-20"
                          onClick={() => changeQty(item, -1)}
                          disabled={updatingItems[item.key] || item.qty <= 1}
                        >
                          -
                        </button>
                        <span className="w-12 text-center text-xs font-black tracking-widest">
                          {updatingItems[item.key] ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : item.qty}
                        </span>
                        <button
                          className="w-10 h-10 flex items-center justify-center font-bold text-gray-400 hover:text-black transition disabled:opacity-20"
                          onClick={() => changeQty(item, 1)}
                          disabled={updatingItems[item.key] || item.qty >= maxStock}
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 flex items-center gap-2 px-4 py-2 rounded-full hover:bg-red-50 transition-all active:scale-95"
                        onClick={() => removeItem(item)}
                      >
                        <Trash size={14} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 rounded-xl p-6 md:p-8 space-y-6 sticky top-24 border border-gray-200/60 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4">Order Summary</h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({sortedCart.length} item{sortedCart.length !== 1 ? 's' : ''})</span>
                <span className="font-medium text-gray-900">₦{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping estimate</span>
                <span className="font-medium text-gray-900">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-gray-600 pb-4 border-b border-gray-200">
                <span>Tax</span>
                <span className="font-medium text-gray-900">₦0</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>

            <Button
              className="w-full text-lg h-14 bg-black hover:bg-gray-800 text-white shadow-md transition-all rounded-lg mt-4"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </Button>

            <div className="text-center mt-6">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gray-500 hover:text-black font-medium transition-colors"
              >
                Continue Shopping →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
