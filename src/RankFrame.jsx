import { rankBadgeSrc, rankRingSrc } from './ranks'

export function RankFrame({ rank, size = 96, children }) {
  const ring = Math.min(Math.round(size / rank.hole), 230)
  const photo = Math.round(ring * rank.hole * 0.97)
  return <span className="rank-frame" style={{ '--ring': `${ring}px`, '--photo': `${photo}px` }}>
    <span className="rank-frame-photo">{children}</span>
    <img className="rank-frame-ring" src={rankRingSrc(rank)} alt="" aria-hidden="true"/>
  </span>
}

export function RankCorner({ rank }) {
  return <img className="rank-corner" src={rankBadgeSrc(rank)} alt={`${rank.title} rank`} title={rank.title}/>
}

export function RankLine({ rank, exp }) {
  return <p className="rank-line"><img src={rankBadgeSrc(rank)} alt="" aria-hidden="true"/><span><strong>{rank.title}</strong>{exp !== undefined && exp !== null && <> · {Number(exp).toLocaleString()} EXP</>}</span></p>
}
