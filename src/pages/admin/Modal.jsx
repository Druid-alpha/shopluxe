import { X } from 'lucide-react'

export default function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 md:p-6">
      <div className="mx-auto w-full max-w-6xl rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 md:px-6">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[85vh] overflow-y-auto px-2 py-2 md:px-4">
          {children}
        </div>
      </div>
    </div>
  )
}
