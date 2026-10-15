import { useEffect, useState } from 'react'

const TOUCH_DEVICE = /Android|iPhone|iPad|iPod|Mobile|Silk|Opera Mini|IEMobile/i

export function detectDevice() {
  if (typeof window === 'undefined') return 'desktop'
  const ua = navigator.userAgent || ''
  const phoneOrTablet = TOUCH_DEVICE.test(ua) || navigator.userAgentData?.mobile === true
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  return phoneOrTablet || (coarsePointer && window.innerWidth <= 900) ? 'mobile' : 'desktop'
}

export function useDeviceKind() {
  const [kind, setKind] = useState(detectDevice)
  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)')
    const update = () => setKind(detectDevice())
    window.addEventListener('resize', update)
    media.addEventListener('change', update)
    return () => {
      window.removeEventListener('resize', update)
      media.removeEventListener('change', update)
    }
  }, [])
  return kind
}
