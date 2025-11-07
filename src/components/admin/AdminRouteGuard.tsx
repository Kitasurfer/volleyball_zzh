import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';

interface Props {
  children: ReactNode;
}

const AdminRouteGuard = ({ children }: Props) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <p className="text-sm text-neutral-500">Checking admin access…</p>
      </div>
    );
  }

  if (!user || role !== 'admin') {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default AdminRouteGuard;
