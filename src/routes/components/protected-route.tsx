import type { ReactNode } from 'react';

import { Navigate } from 'react-router-dom';

import { isAuthenticated } from 'src/services/auth';

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const authenticated = isAuthenticated();

  console.log('ProtectedRoute check:', {
    authenticated,
    token: sessionStorage.getItem('authToken'),
    userData: sessionStorage.getItem('userData'),
  });

  if (!authenticated) {
    console.log('Not authenticated, redirecting to sign-in');
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

