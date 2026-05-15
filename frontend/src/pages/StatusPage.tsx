import { Navigate, useParams } from 'react-router-dom';

/** Legacy badge/status links redirect to the attendee register page. */
export function StatusPage() {
  const { id } = useParams();
  if (!id?.trim()) {
    return <Navigate to="/register" replace />;
  }
  return <Navigate to={`/register?id=${encodeURIComponent(id.trim())}`} replace />;
}
