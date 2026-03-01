import React from 'react'

export default function SkeletonLoader() {
  return (
    <div className='grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
      {[...Array(8)].map((_, idx) => (
        <div key={idx} className='animate-pulse h-80 bg-gray-200 rounded' />
      ))}

    </div>
  )
}
