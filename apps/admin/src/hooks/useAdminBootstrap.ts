import { useEffect, useState } from 'react';
import { fetchCurrentAdmin, type CurrentAdmin } from '../api';
import { getAdminToken } from '../auth';

export function useAdminBootstrap() {
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getAdminToken()) {
      setLoading(false);
      return;
    }

    fetchCurrentAdmin()
      .then(setCurrentAdmin)
      .catch(() => {
        setCurrentAdmin(null);
      })
      .finally(() => setLoading(false));
  }, []);

  return {
    currentAdmin,
    loading,
    setCurrentAdmin
  };
}
