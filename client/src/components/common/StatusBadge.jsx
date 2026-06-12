const STATUS_CONFIGS = {
  REQUESTED:   { label: 'Requested',   cls: 'badge-requested'   },
  ACCEPTED:    { label: 'Accepted',    cls: 'badge-accepted'    },
  IN_PROGRESS: { label: 'In Progress', cls: 'badge-in_progress' },
  COMPLETED:   { label: 'Completed',   cls: 'badge-completed'   },
  CANCELLED:   { label: 'Cancelled',   cls: 'badge-cancelled'   },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIGS[status] || { label: status, cls: 'badge-requested' };
  return (
    <span className={`status-badge ${config.cls}`}>
      {config.label}
    </span>
  );
}
