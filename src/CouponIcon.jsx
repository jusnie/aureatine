// Decorative ticket icon. Screen readers get the surrounding text instead.
export default function CouponIcon({ size = 20 }) {
  return <svg className="coupon-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8.2V6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v1.7a2.3 2.3 0 0 0 0 4.6v1.7a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 14.5v-1.7a2.3 2.3 0 0 0 0-4.6Z"/>
    <path d="M14.5 5.5v2.2M14.5 10.4v3.2M14.5 15.9v2.6" strokeDasharray="0.1 2.4"/>
  </svg>
}
