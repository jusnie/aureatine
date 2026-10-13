import { useId } from 'react'
import { getRewardSizes } from './redeemables'
export default function RewardSizePicker({ item, selected = '', onSelect, disabled = false }) {
  const group = useId()
  const sizes = getRewardSizes(item)
  if (!sizes.length) return null
  return <fieldset className="reward-size-picker"><legend>Choose size <span>{selected || 'Select one'}</span></legend><div className="reward-size-options">{sizes.map(size => <label key={size} className={item.unavailableSizes?.includes(size) ? 'size-unavailable' : ''}><input type="radio" name={group} value={size} checked={selected === size} disabled={disabled || item.unavailableSizes?.includes(size)} onChange={() => onSelect?.(size)}/><span>{size}</span>{item.unavailableSizes?.includes(size) && <span className="sr-only"> — unavailable</span>}</label>)}</div><p>{selected ? `Size ${selected} selected. ` : ''}Size availability needs confirmation. Selecting a size does not reserve an item.</p></fieldset>
}
