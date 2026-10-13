export const MAX_AVATAR_BYTES = 2 * 1024 * 1024
export function parseMemberCode(text) {
  const code = String(text || '').trim().replace(/^aureatine:member:/i, '')
  if (/^[A-HJ-NP-Z]{6}$/i.test(code)) return code.toUpperCase()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code) ? code.toLowerCase() : null
}
export function purchaseCentavos(text) {
  const s = String(text).trim()
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(s)) return null
  const [whole, fraction = ''] = s.split('.')
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return value >= 1 && value <= 100000000 ? value : null
}
export async function prepareAvatar(file) {
  if (!file || file.size > MAX_AVATAR_BYTES) throw Error('Choose an image up to 2 MB.')
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('Use a JPG, PNG or WebP image.')
  const bitmap = await createImageBitmap(file)
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 25000000) throw Error('Image dimensions are too large. Choose a smaller image.')
    const ratio = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * ratio)); canvas.height = Math.max(1, Math.round(bitmap.height * ratio))
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', .86))
    if (!blob || blob.type !== 'image/webp' || blob.size > MAX_AVATAR_BYTES) throw Error('Could not prepare this photo. Try a different image.')
    return blob
  } finally { bitmap.close() }
}
