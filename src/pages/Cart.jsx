// src/pages/Cart.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { setCart } from '@/features/cart/cartSlice';
import * as cartApi from '@/features/cart/cartApi';
import { Trash, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Cart() {
  const cart = useAppSelector(state => state.cart.items);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [updatingItems, setUpdatingItems] = useState({})

  /* ================= LOAD CART ================= */
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await cartApi.getCart();
        dispatch(setCart(data));
      } catch (err) {
        console.error('Failed to fetch cart:', err);
      }
    };
    fetchCart();
  }, [dispatch]);

  if (!cart.length) {
    return (
      <div className="p-12 text-center text-gray-500">
        <p className="text-lg">Your cart is empty</p>
        <Button className="mt-4" onClick={() => navigate('/')}>
          Continue Shopping
        </Button>
      </div>
    );
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  /* ================= CHANGE QUANTITY ================= */
  const changeQty = async (item, delta) => {
    if (updatingItems[item.key]) return // Prevent multi-clicks

    const currentQty = Number(item.qty);
    const availableStock = item.variantStock ?? item.productStock ?? 0;
    const newQty = currentQty + Number(delta);

    if (newQty < 1) return;
    if (newQty > availableStock) {
      toast({ title: 'Reached maximum stock limit', variant: 'destructive' });
      return;
    }

    setUpdatingItems(prev => ({ ...prev, [item.key]: true }))

    // Optimistic UI Update  
    const optimisticCart = cart.map(cartItem =>
      cartItem.key === item.key ? { ...cartItem, qty: newQty } : cartItem
    )
    dispatch(setCart(optimisticCart))

    try {
      // Sync with backend in background
      const data = await cartApi.updateCartItem(item.productId, newQty, item.variant);
      dispatch(setCart(data));
    } catch (err) {
      console.error('Failed to update item:', err);
      // Revert to original cart on error
      dispatch(setCart(cart));
      alert(err.response?.data?.message || 'Failed to update cart');
    } finally {
      setUpdatingItems(prev => ({ ...prev, [item.key]: false }))
    }
  };

  /* ================= REMOVE ITEM ================= */
  const removeItem = async (item) => {
    try {
      const data = await cartApi.removeCartItem(item.productId, item.variant);
      dispatch(setCart(data));
    } catch (err) {
      console.error('Failed to remove item:', err);
      alert(err.response?.data?.message || 'Failed to remove item');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 tracking-tight">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Cart Items (Left 2/3) */}
        <div className="lg:w-2/3 space-y-6">
          <div className="space-y-4">
            {cart.map(item => (
              <div
                key={item.key}
                className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-gray-100 pb-6 mb-6 last:border-0"
              >
                {/* Product Image */}
                <div className="w-full sm:w-32 h-40 sm:h-32 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 p-2">
                  <img
                    src={item.productImage || item.product?.images?.[0]?.url || 'https://via.placeholder.com/150'}
                    alt={item.title}
                    className="w-full h-full object-contain mix-blend-multiply"
                  />
                </div>

                {/* Product Details */}
                <div className="flex-1 w-full space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">{item.title}</h3>
                      {item.variant && (
                        <p className="text-sm text-gray-500 mt-1 uppercase tracking-wide">
                          Variant: <span className="font-medium text-gray-700">{item.variant}</span>
                        </p>
                      )}

                    </div>
                    <p className="font-bold text-lg text-gray-900">
                      ₦{(item.price * item.qty).toLocaleString()}
                    </p>
                  </div>

                  <p className="text-sm text-gray-500">₦{item.price.toLocaleString()} each</p>

                  {/* Quantity & Remove actions */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center border border-gray-300 rounded-md overflow-hidden bg-white shadow-sm">
                      <button
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 hover:text-black transition flex items-center justify-center disabled:opacity-50"
                        onClick={() => changeQty(item, -1)}
                        disabled={updatingItems[item.key] || item.qty <= 1}
                      >
                        -
                      </button>
                      <span className="px-4 py-1.5 text-center min-w-[3rem] text-sm font-medium border-x border-gray-200">
                        {updatingItems[item.key] ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : item.qty}
                      </span>
                      <button
                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-50 hover:text-black transition flex items-center justify-center disabled:opacity-50"
                        onClick={() => changeQty(item, 1)}
                        disabled={updatingItems[item.key] || item.qty >= (item.variantStock ?? item.productStock ?? 0)}
                      >
                        +
                      </button>
                    </div>

                    <button
                      className="text-sm text-red-600 hover:text-red-800 font-medium flex items-center gap-1.5 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      onClick={() => removeItem(item)}
                    >
                      <Trash size={16} /> <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary (Right 1/3) */}
        <div className="lg:w-1/3">
          <div className="bg-gray-50 rounded-xl p-6 md:p-8 space-y-6 sticky top-24 border border-gray-200/60 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 border-b border-gray-200 pb-4">Order Summary</h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
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
                or Continue Shopping →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
