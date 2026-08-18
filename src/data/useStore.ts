import { useMemo, useSyncExternalStore } from 'react';
import { store } from './store';
import type { Job } from '../types/domain';

/**
 * A cheap version counter, not the derived arrays themselves, is what we hand
 * to useSyncExternalStore — its getSnapshot must return a stable reference
 * between renders when nothing changed. Deriving fresh arrays/objects on every
 * call (store.getByBranch(), store.branchReports()...) breaks that contract
 * and can loop forever, so those are memoized on the version number instead.
 */
function useStoreVersion(): number {
  return useSyncExternalStore(store.subscribe, () => store.version);
}

export function useAllJobs(): Job[] {
  const v = useStoreVersion();
  return useMemo(() => store.getAll(), [v]);
}

export function useBranchJobs(branch: string): Job[] {
  const v = useStoreVersion();
  return useMemo(() => store.getByBranch(branch), [v, branch]);
}

export function useJob(jobNo: string | undefined): Job | undefined {
  const v = useStoreVersion();
  return useMemo(() => (jobNo ? store.get(jobNo) : undefined), [v, jobNo]);
}

export function useBranchReports() {
  const v = useStoreVersion();
  return useMemo(() => store.branchReports(), [v]);
}
