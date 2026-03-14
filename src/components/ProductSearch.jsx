
import React from 'react'
import { Input } from './ui/input'
import { Button } from './ui/button'

export default function ProductSearch({ search, setSearch, onSearch, suggestions = [] }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (onSearch) onSearch()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Search products, brands, or categories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-black border border-gray-200 rounded-full px-3 py-2"
          >
            Clear
          </button>
        )}
        {onSearch && (
          <Button onClick={onSearch} className="shrink-0">Search</Button>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSearch(s)}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-gray-200 text-gray-500 hover:text-black hover:border-black transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
