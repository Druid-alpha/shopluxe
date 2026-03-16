export const getStoredReservation = () => {
  try {
    const raw = window.localStorage.getItem('shopluxe_reservation')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      orderId: parsed?.orderId || null,
      expiresAt: parsed?.expiresAt ? Number(parsed.expiresAt) : null
    }
  } catch {
    return null
  }
}

export const clearReservationStorage = () => {
  window.localStorage.removeItem('shopluxe_reservation')
  window.dispatchEvent(new CustomEvent('shopluxe:reservation-updated', { detail: { expiresAt: null } }))
}

export const releaseReservation = async ({ token } = {}) => {
  const stored = getStoredReservation()
  if (!stored?.orderId) return
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/orders/${stored.orderId}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
  } catch {
    // ignore release errors; server may already have cleared
  }
}

export const cancelAllReservations = async ({ token } = {}) => {
  try {
    await fetch(`${import.meta.env.VITE_API_URL}/orders/cancel-reservations`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    })
  } catch {
    // ignore cancellation errors
  }
}
