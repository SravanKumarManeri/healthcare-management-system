import React from 'react';
import { Link } from 'react-router-dom';

export const UnauthorizedPage = () => (
  <div className="container py-5 text-center">
    <div className="py-5">
      <i className="bi bi-shield-lock-fill text-danger display-1 mb-3 d-block"></i>
      <h2 className="fw-bold mb-2">Access Denied (403)</h2>
      <p className="text-muted col-md-6 mx-auto mb-4">
        You do not have the required role permissions to view or modify this resource.
        Please switch to an authorized user role or return to your designated portal.
      </p>
      <div className="d-flex justify-content-center gap-3">
        <Link to="/" className="btn btn-primary px-4">
          <i className="bi bi-house me-1"></i> Return Home
        </Link>
        <Link to="/login" className="btn btn-outline-secondary px-4">
          <i className="bi bi-box-arrow-in-right me-1"></i> Switch Account
        </Link>
      </div>
    </div>
  </div>
);

export const NotFoundPage = () => (
  <div className="container py-5 text-center">
    <div className="py-5">
      <i className="bi bi-exclamation-triangle-fill text-warning display-1 mb-3 d-block"></i>
      <h2 className="fw-bold mb-2">Page Not Found (404)</h2>
      <p className="text-muted col-md-6 mx-auto mb-4">
        The requested healthcare portal page or clinical route does not exist.
      </p>
      <Link to="/" className="btn btn-primary px-4">
        <i className="bi bi-house me-1"></i> Return Home
      </Link>
    </div>
  </div>
);
