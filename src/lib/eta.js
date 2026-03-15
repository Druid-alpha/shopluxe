const NIGERIA_ETA_RULES = [
  { states: ['lagos'], minDays: 1, maxDays: 2 },
  { states: ['ogun', 'oyo', 'osun', 'ondo', 'ekiti'], minDays: 2, maxDays: 4 },
  { states: ['fct', 'abuja'], minDays: 3, maxDays: 5 },
  { states: ['rivers', 'delta', 'edo', 'akwa ibom', 'cross river', 'bayelsa'], minDays: 3, maxDays: 6 },
  { states: ['kano', 'kaduna', 'katsina', 'plateau', 'kwara', 'niger'], minDays: 3, maxDays: 6 },
]

const FALLBACK_ETA = { minDays: 4, maxDays: 7 }

const normalizeState = (value) => String(value || '').trim().toLowerCase()

const findEtaRule = (state) => {
  const normalized = normalizeState(state)
  if (!normalized) return FALLBACK_ETA
  const match = NIGERIA_ETA_RULES.find(rule =>
    rule.states.some((s) => normalized === s || normalized.includes(s))
  )
  return match || FALLBACK_ETA
}

const addBusinessDays = (date, daysToAdd) => {
  const result = new Date(date)
  let added = 0
  while (added < daysToAdd) {
    result.setDate(result.getDate() + 1)
    const day = result.getDay()
    if (day !== 0 && day !== 6) added += 1
  }
  return result
}

const formatDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const estimateEtaRange = (order) => {
  const status = String(order?.status || '').toLowerCase()
  if (['failed', 'cancelled'].includes(status)) return null
  if (status === 'delivered') {
    const deliveredDate = formatDate(order?.updatedAt || order?.createdAt)
    return deliveredDate ? { label: `Delivered on ${deliveredDate}` } : { label: 'Delivered' }
  }

  const anchor = order?.paidAt || order?.createdAt
  if (!anchor) return null
  const { minDays, maxDays } = findEtaRule(order?.shippingAddress?.state)
  const earliest = addBusinessDays(anchor, minDays)
  const latest = addBusinessDays(anchor, maxDays)
  return {
    label: `ETA: ${formatDate(earliest)} - ${formatDate(latest)}`,
    earliest,
    latest
  }
}
