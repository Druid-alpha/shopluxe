import React from 'react'

export default function StarRating({ rating = 0, maxStars = 5, size = 20 }) {
  const fullStars = Math.floor(rating)       // e.g., 3.5 -> 3
  const hasHalfStar = rating % 1 >= 0.5      // e.g., 3.5 -> true
  const emptyStars = maxStars - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="flex items-center gap-0.5">
      {/* Full stars */}
      {Array(fullStars).fill(0).map((_, idx) => (
        <span key={`full-${idx}`} style={{ fontSize: size, color: '#facc15' }}>*</span>
      ))}

      {/* Half star */}
      {hasHalfStar && (
        <span style={{ fontSize: size, color: '#facc15', position: 'relative' }}>
          <span style={{ position: 'absolute', overflow: 'hidden', width: '50%' }}>*</span>
          <span style={{ color: '#d1d5db' }}>*</span>
        </span>
      )}

      {/* Empty stars */}
      {Array(emptyStars).fill(0).map((_, idx) => (
        <span key={`empty-${idx}`} style={{ fontSize: size, color: '#d1d5db' }}>*</span>
      ))}
    </div>
  )
}

