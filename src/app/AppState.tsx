import {
  createContext, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react';
import { ROLES } from '../data/fixtures';
import type { BranchCode } from '../types/domain';

interface AppStateValue {
  branch: BranchCode;
  setBranch: (b: BranchCode) => void;
  roleId: string;
  setRoleId: (r: string) => void;
  role: (typeof ROLES)[number];
}

const AppStateContext = createContext<AppStateValue | null>(null);

function readLS(key: string, fallback: string): string {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function writeLS(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore — private browsing etc.
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [branch, setBranchState] = useState<BranchCode>(() => readLS('tdone.branch', 'MKY') as BranchCode);
  const [roleId, setRoleIdState] = useState<string>(() => readLS('tdone.role', 'supervisor'));

  const setBranch = (b: BranchCode) => { setBranchState(b); writeLS('tdone.branch', b); };
  const setRoleId = (r: string) => { setRoleIdState(r); writeLS('tdone.role', r); };

  useEffect(() => {
    // Keep tabs/windows in sync if the branch or role changes elsewhere.
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tdone.branch' && e.newValue) setBranchState(e.newValue as BranchCode);
      if (e.key === 'tdone.role' && e.newValue) setRoleIdState(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const role = useMemo(() => ROLES.find((r) => r.id === roleId) ?? ROLES[2], [roleId]);

  const value = useMemo(() => ({
    branch, setBranch, roleId, setRoleId, role,
  }), [branch, roleId, role]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider');
  return ctx;
}
