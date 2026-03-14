from pathlib import Path

path = Path(r"c:\Users\hp\Desktop\Mern stack\ProjectEcommerce\shop-luxe-BE\src\controllers\orderController.js")
text = path.read_text(encoding="utf-8")

old_block = """const colorKey = (value) => {
  if (!value) return ''
  if (typeof value === 'object') {
    return String(value._id || value.name || value.hex || '')
  }
  return String(value)
}

const findVariantByOptions = (product, size, color) => {
  if (!product?.variants?.length) return null
  const sizeKey = String(size || '')
  const colorKeyValue = colorKey(color)
  if (!sizeKey && !colorKeyValue) return null
  const exact = product.variants.find(v => {
    const vSize = String(v?.options?.size || '')
    const vColor = colorKey(v?.options?.color)
    if (sizeKey && colorKeyValue) return vSize === sizeKey && vColor === colorKeyValue
    if (sizeKey) return vSize === sizeKey
    if (colorKeyValue) return vColor === colorKeyValue
    return false
  })
  return exact || null
}
"""

new_block = """const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')

const resolveColorRef = async (raw) => {
  if (!raw) return { provided: false, id: null, label: null }

  if (typeof raw === 'object') {
    const id = raw._id ? String(raw._id) : null
    const label = raw.name || raw.hex || null
    if (id) return { provided: true, id, label }
    if (!label) return { provided: false, id: null, label: null }

    const found = await Color.findOne({
      $or: [
        { name: new RegExp(`^${escapeRegex(label)}$`, 'i') },
        { hex: new RegExp(`^${escapeRegex(label)}$`, 'i') }
      ]
    }).select('_id name hex').lean()

    if (found) {
      return { provided: true, id: String(found._id), label: found.name || found.hex || label }
    }
    return { provided: true, id: null, label }
  }

  const rawStr = String(raw || '').trim()
  if (!rawStr) return { provided: false, id: null, label: null }
  if (mongoose.Types.ObjectId.isValid(rawStr)) return { provided: true, id: rawStr, label: null }

  const label = rawStr
  const found = await Color.findOne({
    $or: [
      { name: new RegExp(`^${escapeRegex(label)}$`, 'i') },
      { hex: new RegExp(`^${escapeRegex(label)}$`, 'i') }
    ]
  }).select('_id name hex').lean()

  if (found) {
    return { provided: true, id: String(found._id), label: found.name || found.hex || label }
  }
  return { provided: true, id: null, label }
}

const findVariantByOptions = async (product, size, color) => {
  if (!product?.variants?.length) return null

  const sizeKey = String(size || '')
  const colorInfo = await resolveColorRef(color)
  const colorProvided = colorInfo.provided
  const colorId = colorInfo.id
  const productHasColoredVariants = product.variants.some(v => v?.options?.color)

  if (!sizeKey && !colorProvided) return null
  if (colorProvided && !colorId) return null
  if (!colorProvided && sizeKey && productHasColoredVariants) return null

  const exact = product.variants.find(v => {
    const vSize = String(v?.options?.size || '')
    const vColorId = String(v?.options?.color || '')
    if (sizeKey && colorId) return vSize === sizeKey && vColorId === colorId
    if (sizeKey && !colorProvided) return vSize === sizeKey
    if (!sizeKey && colorId) return vColorId === colorId
    return false
  })

  return exact || null
}
"""

if old_block not in text:
    raise SystemExit("Old block not found; aborting.")

text = text.replace(old_block, new_block)
text = text.replace("resolvedVariant = findVariantByOptions(", "resolvedVariant = await findVariantByOptions(")

path.write_text(text, encoding="utf-8")
print("orderController.js updated")
