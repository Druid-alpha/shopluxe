// src/pages/Cart.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { Button } from '@/components/ui/button';
import { setCart } from '@/features/cart/cartSlice';
import * as cartApi from '@/features/cart/cartApi';
import { Trash } from 'lucide-react';

export default function Cart() {
  const cart = useAppSelector(state => state.cart.items);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
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

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  /* ================= CHANGE QUANTITY ================= */
  const changeQty = async (item, delta) => {
    if (updatingItems[item.key]) return // Prevent multi-clicks

    const newQty = item.qty + delta;
    if (newQty < 1) return;

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
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Shopping Cart</h1>

      <div className="space-y-4">
        {cart.map(item => (
          <div
            key={item.key}
            className="flex flex-col md:flex-row items-center md:items-start gap-4 border rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            {/* Product Image */}
            <img
              src={item.productImage || item.product?.images?.[0]?.url || 'https://via.placeholder.com/100'}
              alt={item.title}
              className="w-24 h-24 md:w-32 md:h-32 object-cover rounded"
            />

            {/* Product Details */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="font-semibold text-lg">{item.title}</p>
                {item.variant && (
                  <p className="text-sm text-gray-500 mt-1">Variant: {item.variant}</p>
                )}
                <p className="text-sm mt-1">₦{item.price.toLocaleString()} each</p>
              </div>

              {/* Quantity & Remove */}
              <div className="flex items-center mt-3 gap-4">
                <div className="flex items-center border rounded overflow-hidden">
                  <Button size="sm" variant="outline" onClick={() => changeQty(item, -1)} disabled={updatingItems[item.key]}>
                    -
                  </Button>
                  <span className="px-4 py-1 text-center min-w-[3rem]">{item.qty}</span>
                  <Button size="sm" variant="outline" onClick={() => changeQty(item, 1)} disabled={updatingItems[item.key]}>
                    +
                  </Button>
                </div>

                <p className="font-semibold text-lg">
                  ₦{(item.price * item.qty).toLocaleString()}
                </p>

                <Button size="icon" variant="destructive" onClick={() => removeItem(item)}>
                  <Trash size={18} />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center text-xl font-bold mt-6 border-t pt-4">
        <span>Total</span>
        <span>₦{total.toLocaleString()}</span>
      </div>

      {/* Checkout Button */}
      <div className="flex justify-end mt-4">
        <Button className="px-6 py-2 text-lg" onClick={() => navigate('/checkout')}>
          Proceed to Checkout
        </Button>
      </div>
    </div>
  );
}
