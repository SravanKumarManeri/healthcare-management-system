import React from 'react';

export const LoadingSpinner = ({ message = 'Loading data...' }) => (
  <div className="text-center py-5">
    <div className="spinner-border text-primary" role="status" style={{ width: '2.5rem', height: '2.5rem' }}>
      <span className="visually-hidden">Loading...</span>
    </div>
    <p className="mt-3 text-muted">{message}</p>
  </div>
);

export const EmptyState = ({ title = 'No records found', message = 'There are no items to display at this time.', action = null, icon = 'bi-inbox' }) => (
  <div className="text-center py-5 bg-light rounded-3 border border-dashed my-3 p-4">
    <i className={`bi ${icon} fs-1 text-muted mb-3 d-block`}></i>
    <h5 className="fw-semibold text-secondary">{title}</h5>
    <p className="text-muted small mb-3">{message}</p>
    {action}
  </div>
);

export const AlertMessage = ({ type = 'danger', message, dismissible = true, onDismiss }) => {
  if (!message) return null;
  return (
    <div className={`alert alert-${type} alert-dismissible fade show`} role="alert">
      {message}
      {dismissible && (
        <button type="button" className="btn-close" onClick={onDismiss} aria-label="Close"></button>
      )}
    </div>
  );
};

export const ConfirmModal = ({ isOpen, title, message, confirmText = 'Confirm', confirmVariant = 'danger', onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow border-0">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">{title}</h5>
            <button type="button" className="btn-close" onClick={onCancel} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <p className="text-secondary mb-0">{message}</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" className={`btn btn-${confirmVariant}`} onClick={onConfirm}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
