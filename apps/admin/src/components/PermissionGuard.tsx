import type { ReactNode } from 'react';
import type { CurrentAdmin } from '../api';

type PermissionGuardProps = {
  code: string;
  permissions: CurrentAdmin['permissions'];
  children: ReactNode;
};

export function PermissionGuard({ code, permissions, children }: PermissionGuardProps) {
  if (!permissions.includes(code)) {
    return null;
  }

  return <>{children}</>;
}
