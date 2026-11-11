import React from 'react';

const statusConfig = {
  BOOKED: { bg: 'bg-primary-subtle text-primary border-primary', label: 'Booked' },
  CONFIRMED: { bg: 'bg-info-subtle text-info border-info', label: 'Confirmed' },
  CHECKED_IN: { bg: 'bg-warning-subtle text-warning-emphasis border-warning', label: 'Checked In' },
  COMPLETED: { bg: 'bg-success-subtle text-success border-success', label: 'Completed' },
  CANCELLED: { bg: 'bg-danger-subtle text-danger border-danger', label: 'Cancelled' },
  NO_SHOW: { bg: 'bg-secondary-subtle text-secondary border-secondary', label: 'No Show' },
  DRAFT: { bg: 'bg-secondary-subtle text-secondary border-secondary', label: 'Draft' },
  FINAL: { bg: 'bg-success-subtle text-success border-success', label: 'Final' },
  ISSUED: { bg: 'bg-warning-subtle text-warning-emphasis border-warning', label: 'Awaiting Dispense' },
  PARTIALLY_DISPENSED: { bg: 'bg-info-subtle text-info border-info', label: 'Partially Dispensed' },
  DISPENSED: { bg: 'bg-success-subtle text-success border-success', label: 'Fully Dispensed' },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || { bg: 'bg-light text-dark border', label: status || 'Unknown' };
  return (
    <span className={`badge border px-2 py-1 ${config.bg}`} style={{ fontWeight: 600, fontSize: '0.8rem' }}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
