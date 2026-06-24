import type { ReactNode } from 'react';

import { Navigate } from 'react-router-dom';

import { isPlatformAuthenticated } from 'src/services/platform-auth';

type PlatformProtectedRouteProps = {
  children: ReactNode;
};

// Gate for the platform (company) console. Independent of the tenant store-admin
// ProtectedRoute: it checks the platform token (sessionStorage 'platformToken'),
// NOT the store-admin 'authToken'. A store admin is not redirected here and a
// platform admin does not need a store-admin login first.
export function PlatformProtectedRoute({ children }: PlatformProtectedRouteProps) {
  if (!isPlatformAuthenticated()) {
    return <Navigate to="/platform/sign-in" replace />;
  }

  return <>{children}</>;
}
