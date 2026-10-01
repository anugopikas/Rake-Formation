const toneMap = {
  active: 'success',
  inactive: 'neutral',
  maintenance: 'warning',
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  critical: 'danger',
  high: 'danger',
  warning: 'warning',
  info: 'info',
  default: 'neutral',
};

export default function StatusBadge({ label, tone = 'default' }) {
  const resolvedTone = toneMap[tone] || toneMap.default;

  return <span className={`status-badge status-badge--${resolvedTone}`}>{label}</span>;
}
