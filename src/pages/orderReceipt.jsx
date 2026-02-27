import { useParams } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import html2pdf from 'html2pdf.js'

export default function OrderReceipt() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)

  const receiptRef = useRef(null)

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/orders/${id}`, {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => setOrder(data.order))
  }, [id])

  const downloadPDF = () => {
    const element = receiptRef.current
    const opt = {
      margin: 1,
      filename: `Invoice_${order._id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    }
    html2pdf().set(opt).from(element).save()
  }

  if (!order) return <div className="p-12 text-center animate-pulse">Loading receipt...</div>

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Order Successful!</h1>
          <p className="text-gray-500 text-sm mt-1">Thank you for shopping with ShopLuxe&trade;.</p>
        </div>
        <Button onClick={downloadPDF} className="flex items-center gap-2 bg-black hover:bg-gray-800">
          <Download size={18} /> Download PDF
        </Button>
      </div>

      <div ref={receiptRef} className="bg-white p-8 border rounded-xl shadow-sm space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-6">
          <div>
            <h2 className="text-3xl font-black tracking-tight">INVOICE</h2>
            <p className="text-gray-500 mt-2">Order ID: #{order._id}</p>
            <p className="text-gray-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-xl">ShopLuxe</h3>
            <p className="text-gray-500 text-sm">123 Luxury Avenue</p>
            <p className="text-gray-500 text-sm">Lagos, Nigeria</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-gray-700 uppercase text-xs mb-2 tracking-wider">Billed To</h4>
            <p className="font-medium">{order.shippingAddress?.fullName || 'Customer'}</p>
            <p className="text-gray-600 text-sm">{order.shippingAddress?.address}</p>
            <p className="text-gray-600 text-sm">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
          </div>
          <div>
            <h4 className="font-semibold text-gray-700 uppercase text-xs mb-2 tracking-wider">Payment Status</h4>
            <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {/* Items Table */}
        <div className="mt-8">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="py-3 font-semibold text-gray-700 w-1/2">Item Description</th>
                <th className="py-3 font-semibold text-gray-700 text-center">Qty</th>
                <th className="py-3 font-semibold text-gray-700 text-right">Price</th>
                <th className="py-3 font-semibold text-gray-700 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, i) => (
                <tr key={i} className="border-b border-gray-100">
                  <td className="py-4">
                    <p className="font-medium text-gray-900">{item.product.title}</p>
                    {item.variant && <p className="text-sm text-gray-500">Variant: {item.variant.sku || item.variant}</p>}
                  </td>
                  <td className="py-4 text-center text-gray-600">{item.qty}</td>
                  <td className="py-4 text-right text-gray-600">₦{item.priceAtPurchase.toLocaleString()}</td>
                  <td className="py-4 text-right font-medium">₦{(item.priceAtPurchase * item.qty).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end pt-6 border-t">
          <div className="w-1/2 space-y-3">
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Subtotal</span>
              <span>₦{order.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600 text-sm">
              <span>Tax (0%)</span>
              <span>₦0</span>
            </div>
            <div className="flex justify-between font-bold text-xl text-gray-900 pt-3 border-t">
              <span>Grand Total</span>
              <span>₦{order.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-400 text-sm pt-12">
          If you have any questions about this invoice, please contact support@shopluxe.com.
        </div>
      </div>
    </div>
  )
}
