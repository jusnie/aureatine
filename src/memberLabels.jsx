// Member labels. APEX and AUREATINE are owner-granted; MEMBER, STUDENT and STAFF are assigned by label managers.
// A member may hold several labels; they render after the ADMIN badge in this fixed order.
export const ASSIGNABLE_LABELS = ['MEMBER', 'STUDENT', 'STAFF']
const LABEL_ORDER = ['APEX', 'AUREATINE', 'MEMBER', 'STUDENT', 'STAFF']

// Older database responses only return owner_label (APEX or AUREATINE). Use it until the labels list is live.
export function labelsOf(entry) {
  if (Array.isArray(entry?.labels)) return entry.labels
  return entry?.owner_label ? [entry.owner_label] : []
}

export function orderedLabels(labels) {
  return Array.isArray(labels) ? LABEL_ORDER.filter(label => labels.includes(label)) : []
}

export function LabelBadges({ isAdmin, labels }) {
  return <>
    {isAdmin === true && <span className="admin-badge">ADMIN</span>}
    {orderedLabels(labels).map(label => <span key={label} className={`admin-badge label-badge label-${label.toLowerCase()}`}>{label}</span>)}
  </>
}
