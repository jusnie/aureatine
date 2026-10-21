import './motionButton.css'

// Button that morphs through idle -> loading -> success (green, check) or error (red, X) and back to idle.
// Callers set phase. On error they set phase 'error' and reset to 'idle' after a short hold.
export default function MotionButton({ as: Tag = 'button', phase = 'idle', loadingText = 'Working', doneText = 'Done', errorText = 'Please try again', className = '', disabled, children, ...rest }) {
  const busy = phase !== 'idle'
  return (
    <Tag
      {...rest}
      className={`button dark motion-button ${className}`.trim()}
      data-phase={phase}
      disabled={Tag === 'button' ? busy || disabled : undefined}
      aria-busy={phase === 'loading' || undefined}
    >
      <span className="mb-label">{children}</span>
      <span className="mb-spinner" aria-hidden="true"/>
      <svg className="mb-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.6l4.4 4.4L19 7.6"/></svg>
      <svg className="mb-x" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>
      <span className="mb-sr" role="status">{phase === 'loading' ? loadingText : phase === 'success' ? doneText : phase === 'error' ? errorText : ''}</span>
    </Tag>
  )
}
