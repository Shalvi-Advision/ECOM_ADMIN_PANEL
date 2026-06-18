import type { ReactNode } from 'react';

import { useMemo, useState, useContext, useCallback, createContext } from 'react';

// ----------------------------------------------------------------------

// Tenant context (plan §8). Holds the tenant a super-admin is currently acting
// on. Store-admins are pinned to their own tenant by their JWT and never use the
// switcher, so for them this stays null and no X-Tenant header is sent (the
// backend resolves their tenant from the token/Host).
//
// The selected slug is mirrored to sessionStorage so it survives reloads and is
// readable by the api-client (utils/api-client.ts) when it builds requests.

const SELECTED_TENANT_KEY = 'selectedTenantSlug';

interface TenantContextType {
  /** Slug the super-admin is acting on, or null when none is selected. */
  selectedTenant: string | null;
  setTenant: (slug: string | null) => void;
  clearTenant: () => void;
}

const TenantContext = createContext<TenantContextType | null>(null);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Read the persisted selection directly (used by non-React code like the
// api-client, which can't call hooks).
export function getSelectedTenant(): string | null {
  return sessionStorage.getItem(SELECTED_TENANT_KEY);
}

interface TenantProviderProps {
  children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [selectedTenant, setSelectedTenant] = useState<string | null>(() => getSelectedTenant());

  const setTenant = useCallback((slug: string | null) => {
    if (slug) {
      sessionStorage.setItem(SELECTED_TENANT_KEY, slug);
    } else {
      sessionStorage.removeItem(SELECTED_TENANT_KEY);
    }
    setSelectedTenant(slug);
  }, []);

  const clearTenant = useCallback(() => setTenant(null), [setTenant]);

  const value = useMemo(
    () => ({ selectedTenant, setTenant, clearTenant }),
    [selectedTenant, setTenant, clearTenant]
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}
