import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'ADMIN',
  redirectTo = '/',
}) => {
  const { isLoggedIn, profile } = useSelector((state: RootState) => state.user);

  if (!isLoggedIn || !profile) {
    return <Navigate to={redirectTo} replace />;
  }

  if (profile.role?.toUpperCase() !== requiredRole.toUpperCase()) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
