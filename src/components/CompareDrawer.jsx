import * as React from 'react'
import { X, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'compareProducts'

const readCompare = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export default function CompareDrawer() {
  const [open, setOpen] = React.useState(false)
  const [items, setItems] = React.useState(() => readCompare())

  React.useEffect(() => {
    const sync = () => setItems(readCompare())
    window.addEventListener('compare:updated', sync)
    return () => window.removeEventListener('compare:updated', sync)
  }, [])

  const removeItem = (id) => {
    const next = items.filter(p => p?._id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setItems(next)
    window.dispatchEvent(new Event('compare:updated'))
  }

  const clearAll = () => {
    localStorage.removeItem(STORAGE_KEY)
    setItems([])
    window.dispatchEvent(new Event('compare:updated'))
  }

  const count = items.length
  if (count === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[70] bg-black text-white rounded-full px-5 py-3 text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 transition-transform hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.25)]"
      >
        <Scale size={16} />
        Compare ({count})
      </button>

      {open && (
        <div className="fixed inset-0 z-[80]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-white shadow-2xl border-l border-gray-200 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black tracking-tighter uppercase">Compare</h2>
              <button onClick={() => setOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {items.map((product) => (
                <div key={product._id} className="flex gap-4 items-center border border-gray-100 rounded-2xl p-3 transition-all hover:shadow-md hover:-translate-y-0.5 bg-white">
                  <div className="w-16 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                    <img
                      src={product?.images?.[0]?.url || '/placeholder.png'}
                      alt={product.title}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase tracking-widest text-gray-900 line-clamp-1">{product.title}</p>
                    <p className="text-[10px] text-gray-400 font-semibold uppercase">
                      NGN {Number(product.price || 0).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(product._id)}
                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {count >= 2 && (
              <div className="mt-8 border-t pt-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4">Quick Compare</h3>
                <div className="grid grid-cols-2 gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                  <div>Price</div>
                  <div className="text-right">{items.map(p => `NGN ${Number(p.price || 0).toLocaleString()}`).join(' - ')}</div>
                  <div>Rating</div>
                  <div className="text-right">{items.map(p => (p.avgRating || 0).toFixed(1)).join(' - ')}</div>
                  <div>Reviews</div>
                  <div className="text-right">{items.map(p => p.reviewsCount || 0).join(' - ')}</div>
                  <div>Stock</div>
                  <div className="text-right">{items.map(p => p.totalStock ?? p.stock ?? 0).join(' - ')}</div>
                  <div>Variants</div>
                  <div className="text-right">{items.map(p => p.variantsCount || p.variants?.length || 0).join(' - ')}</div>
                </div>
              </div>
            )}

            <div className="mt-8 flex gap-3">
              <Button className="w-full" onClick={() => setOpen(false)}>Continue Shopping</Button>
              <Button variant="outline" className="w-full" onClick={clearAll}>Clear</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}


