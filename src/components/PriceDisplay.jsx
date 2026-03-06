import React from 'react'

export default function PriceDisplay({ price, discount, className = "" }) {
    if (!price) return null

    const hasDiscount = discount > 0
    const discountedPrice = hasDiscount ? price * (1 - discount / 100) : price

    return (
        <div className={`flex items-baseline gap-1 sm:gap-2 ${className}`}>
            <span className="text-slate-900 font-black tracking-tight text-xs sm:text-sm">
                ₦{Math.round(discountedPrice).toLocaleString()}
            </span>
            {hasDiscount && (
                <span className="text-gray-400 text-[9px] sm:text-[10px] font-bold line-through tracking-tight sm:tracking-widest uppercase">
                    ₦{Math.round(price).toLocaleString()}
                </span>
            )}
        </div>
    )
}
