export function normalizeRedemptionCounts(rows) {
  const counts = Object.create(null)
  for (const row of rows || []) {
    const raw = row?.member_count
    const value = typeof raw === 'number' || (typeof raw === 'string' && /^\d+$/.test(raw)) ? Number(raw) : NaN
    if (typeof row?.item_id === 'string' && Number.isSafeInteger(value) && value >= 0) counts[row.item_id] = value
  }
  return counts
}
export function redemptionCountLabel(count, loading = false) {
  if (loading) return 'Checking redemptions…'
  if (!Number.isSafeInteger(count) || count < 0) return 'Redemption count unavailable'
  if (count === 0) return 'No completed redemptions yet'
  return `Redeemed by ${count.toLocaleString()} ${count === 1 ? 'member' : 'members'}`
}
