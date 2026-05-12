import { Navigate } from 'react-router-dom';

export function AdminPaymentsRedirect() {
  return <Navigate to="/admin/registrations?status=PENDING" replace />;
}
