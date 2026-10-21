import './motionButton.css'

// Button that morphs through idle -> loading -> success.
// phase: 'idle' | 'loading' | 'success'. Callers set phase; on error they set it back to 'idle'.
export default function MotionButton({ phase = 'idle', loadingText = 'Working', doneText = 'Done', className = '', disabled, children, ...rest }) {
  const busy = phase !== 'idle'
  return (
    <button
      {...rest}
      className={`button dark motion-button ${className}`.trim()}
      data-phase={phase}
      disabled={busy || disabled}
      aria-busy={phase === 'loading' || undefined}
    >
      <span className="mb-label">{children}</span>
      <span className="mb-spinner" aria-hidden="true"/>
      <svg className="mb-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.6l4.4 4.4L19 7.6"/></svg>
      <span className="mb-sr" role="status">{phase === 'loading' ? loadingText : phase === 'success' ? doneText : ''}</span>
    </button>
  )
}
