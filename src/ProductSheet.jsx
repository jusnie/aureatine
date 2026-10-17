import { useEffect, useRef, useState } from 'react'
import RewardRedemption from './RewardRedemption'
import { basePath } from './urls'
import { productCostText } from './redeemables'

const brandLogo = name => `${basePath}images/brands/${name.toLowerCase()}-fit-v3.png`
const assetSrc = path => (/^https?:/.test(path) ? path : `${basePath}${path}`)

// product = one card from the catalog. Its colour variants are picked here; each variant redeems and counts on its own.
export default function ProductSheet({ product, session, balance, countLabelFor, similar = [], onOpenProduct, onRedeemed, onClose }) {
  const dialog = useRef(null)
  const [picked, setPicked] = useState(null)
  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (product && !element.open) element.showModal()
    if (!product && element.open) element.close()
  }, [product])
  useEffect(() => {
    setPicked(null)
    dialog.current?.scrollTo?.(0, 0)
  }, [product?.key])
  const variants = product?.variants || []
  const item = variants.find(v => v.id === picked) || variants[0] || null
  const costKnown = Boolean(item) && Number.isSafeInteger(item.points) && item.points > 0
  const after = costKnown && Number.isFinite(balance) ? balance - item.points : null
  return <dialog ref={dialog} className="shop-sheet" aria-labelledby="shop-sheet-title" onClose={onClose}>
    {item && <div className="shop-sheet-body">
      <button type="button" className="shop-sheet-close" onClick={() => dialog.current?.close()}>Close</button>
      <figure className="shop-sheet-media">
        {item.image ? <img src={assetSrc(item.image)} alt={item.imageAlt || product.name}/> : product.brand && <span className="shop-card-logo"><img src={brandLogo(product.brand)} alt=""/></span>}
        <span className="shop-brand-tag">{product.brand || 'Aureatine'}</span>
      </figure>
      <div className="shop-sheet-info">
        <h2 id="shop-sheet-title">{product.name}</h2>
        {variants.length > 1 && <fieldset className="shop-color-picker">
          <legend>Choose a {product.variantLabel.toLowerCase()}</legend>
          {variants.map(v => <button key={v.id} type="button" className="shop-swatch" aria-pressed={v.id === item.id} onClick={() => setPicked(v.id)}>
            {v.swatch && <span className="shop-swatch-dot" style={{ background: v.swatch }} aria-hidden="true"/>}{v.label}
          </button>)}
        </fieldset>}
        {item.label && <p className="shop-sheet-color">{product.variantLabel}: <strong>{item.label}</strong></p>}
        {(item.description || product.description) && <p className="shop-sheet-desc">{item.description || product.description}</p>}
        <p className="shop-sheet-cost"><img src={`${basePath}images/aurel-coin.png`} alt="" width="30" height="30"/><strong>{costKnown ? item.points.toLocaleString() : 'To be confirmed'}</strong>{costKnown && <span>Aurels</span>}</p>
        {after !== null && session && <p className={after >= 0 ? 'shop-balance-line' : 'shop-balance-line shop-balance-short'}>{after >= 0 ? `Balance after exchange: ${after.toLocaleString()} Aurels` : `You need ${(-after).toLocaleString()} more Aurels`}</p>}
        {countLabelFor && <p className="reward-redeemed-count" aria-live="polite">{countLabelFor(item)}</p>}
        <div className="shop-sheet-exchange"><RewardRedemption key={item.id} item={item} session={session} balance={balance} onRedeemed={onRedeemed}/></div>
      </div>
      {similar.length > 0 && <section className="shop-similar" aria-labelledby="shop-similar-title">
        <h3 id="shop-similar-title">You may also like</h3>
        <div className="shop-similar-grid">
          {similar.map(p => <button key={p.key} type="button" className="shop-similar-card" onClick={() => onOpenProduct(p)}>
            {p.image && <img src={assetSrc(p.image)} alt="" loading="lazy"/>}
            <span>{p.name}</span>
            <small>{productCostText(p)}</small>
          </button>)}
        </div>
      </section>}
    </div>}
  </dialog>
}
