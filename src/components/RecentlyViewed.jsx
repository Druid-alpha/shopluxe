import * as React from 'react'
import ProductCard from '@/features/products/ProductCard'

const STORAGE_KEY = 'recentlyViewedProducts'

export default function RecentlyViewed({ title = 'Recently Viewed' }) {
  const [items, setItems] = React.useState([])

  React.useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
      setItems(Array.isArray(stored) ? stored : [])
    } catch {
      setItems([])
    }
  }, [])

  if (!items.length) return null

  return (
    <section className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">{title}</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Pick up where you left off</p>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 pr-2">
        {items.map((product) => (
          <div key={product._id} className="min-w-[180px] w-[180px] sm:min-w-[220px] sm:w-[220px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
