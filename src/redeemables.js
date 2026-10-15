export const rewardBrands = ['Youngla', 'Gymshark', 'Breathevinity', 'Dfyne']
export const rewardCategories = [{ value: 'all', label: 'All items' }, { value: 'apparel', label: 'Apparel' }, { value: 'accessories', label: 'Accessories' }]
// Add owner-confirmed items only. No stock, Aurels or product claims are assumed.
// { id, brand, category: 'apparel'|'accessories', name, image, imageAlt, description, points: number|null, sizes: [], available: false }
export const rewardItems = []
export function selectRewards(items, brand = 'all', sort = 'points-asc', category = 'all') {
  return items.filter(item => (brand === 'all' || item.brand === brand) && (category === 'all' || item.category === category)).slice().sort((a,b) => {
    const aKnown = Number.isFinite(a.points), bKnown = Number.isFinite(b.points)
    if (aKnown !== bKnown) return aKnown ? -1 : 1
    if (sort === 'name') return a.name.localeCompare(b.name)
    return (aKnown ? (a.points - b.points) * (sort === 'points-desc' ? -1 : 1) : 0) || a.name.localeCompare(b.name)
  })
}

export const standardRewardSizes = ['S', 'M', 'L', 'XL']
export function getRewardSizes(item) {
  if (Array.isArray(item.sizes) && item.sizes.length) return [...new Set(item.sizes.filter(size => typeof size === 'string' && size.trim()))]
  return item.category === 'apparel' ? standardRewardSizes : []
}
