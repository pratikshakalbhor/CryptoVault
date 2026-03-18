interface StatusBadgeProps {
  status: 'valid' | 'tampered' | 'pending';
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`status-badge status-${status}`}>
      {status === 'valid'    && '● VALID'}
      {status === 'tampered' && '⚠ TAMPERED'}
      {status === 'pending'  && '○ PENDING'}
    </span>
  );
}