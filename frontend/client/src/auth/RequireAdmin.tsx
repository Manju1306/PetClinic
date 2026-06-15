import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from './AuthContext';

const RequireAdmin = () => {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default RequireAdmin;
