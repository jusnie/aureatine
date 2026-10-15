export const RANKS = [
  { key: 'mortal', title: 'Mortal', min: 0, hole: 0.44 },
  { key: 'demigod', title: 'Demigod', min: 500, hole: 0.45 },
  { key: 'divine', title: 'Divine', min: 1500, hole: 0.45 },
  { key: 'olympian', title: 'Olympian', min: 4000, hole: 0.31 },
  { key: 'ascendant', title: 'Ascendant', min: 10000, hole: 0.22 },
]

export function rankFor(exp) {
  const value = Number(exp) || 0
  return RANKS.reduce((current, rank) => (value >= rank.min ? rank : current), RANKS[0])
}

export function rankByTitle(title, exp) {
  return RANKS.find(rank => rank.title === title) || rankFor(exp)
}

export const rankBadgeSrc = rank => `/images/ranks/${rank.key}-badge.webp`
export const rankRingSrc = rank => `/images/ranks/${rank.key}-border.webp`
