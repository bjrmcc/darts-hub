import { Navigate } from 'react-router-dom';
import { useProfilesStore } from '../../store/profilesStore';
import { ROUTES } from '../../constants';
import type { ReactNode } from 'react';

export default function RequireProfile({ children }: { children: ReactNode }) {
  const activeProfileId = useProfilesStore((s) => s.activeProfileId);
  if (!activeProfileId) return <Navigate to={ROUTES.PROFILES} replace />;
  return <>{children}</>;
}
