// Shared "last rim list reviewed" state — read by both the console's Needs a
// person band and the Rim intake stepper, so the held/clean counts can never
// drift apart (PRD §11 defect #8: one set of numbers everywhere).
import { useMemo, useSyncExternalStore } from 'react';
import type { IntakeRow } from '../types/domain';
import { INTAKE_ROWS, INTAKE_SUMMARY } from './fixtures';
import type { ParsedIntake } from './xlsxIntake';

type Listener = () => void;

class IntakeState {
  rows: IntakeRow[] = INTAKE_ROWS.map((r) => ({ ...r, problems: [...r.problems] }));

  fileName = INTAKE_SUMMARY.file;

  customer = INTAKE_SUMMARY.customer;

  version = 0;

  private listeners = new Set<Listener>();

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private emit() {
    this.version += 1;
    this.listeners.forEach((fn) => fn());
  }

  get heldCount(): number {
    return this.rows.filter((r) => r.state === 'held').length;
  }

  get cleanCount(): number {
    return this.rows.length - this.heldCount;
  }

  setParsed(result: ParsedIntake) {
    this.rows = result.rows;
    this.fileName = result.fileName;
    this.customer = result.customer;
    this.emit();
  }

  fixField(row: number, field: keyof IntakeRow, value: string) {
    this.rows = this.rows.map((r) => {
      if (r.row !== row) return r;
      const next: IntakeRow = { ...r, [field]: value };
      const stillOutstanding = next.problems.some((p) => !isResolved(p, next));
      return { ...next, state: stillOutstanding ? 'held' : 'clean' };
    });
    this.emit();
  }

  confirmRow(row: number) {
    this.rows = this.rows.map((r) => (r.row === row ? { ...r, state: 'clean' } : r));
    this.emit();
  }

  /** Remove rows once their jobs have been created, leaving only what's still held. */
  removeCreated(rows: number[]) {
    this.rows = this.rows.filter((r) => !rows.includes(r.row));
    this.emit();
  }

  reset() {
    this.rows = INTAKE_ROWS.map((r) => ({ ...r, problems: [...r.problems] }));
    this.fileName = INTAKE_SUMMARY.file;
    this.customer = INTAKE_SUMMARY.customer;
    this.emit();
  }
}

function isResolved(p: IntakeRow['problems'][number], row: IntakeRow): boolean {
  if (p.field === 'rimSerial' && p.code === 'blank_serial') return !!row.rimSerial;
  if (p.field === 'size' && p.code === 'size_typo') return true; // any manual edit accepted
  if (p.field === 'hours' && p.code === 'blank_hours') return !!row.hours;
  if (p.needsHuman) return false; // duplicate/open/unknown/overdue/early need an explicit confirm, not a text edit
  return true;
}

export const intakeState = new IntakeState();

export function useIntakeState() {
  const v = useSyncExternalStore(intakeState.subscribe, () => intakeState.version);
  return useMemo(() => ({
    rows: intakeState.rows, fileName: intakeState.fileName, customer: intakeState.customer,
    heldCount: intakeState.heldCount, cleanCount: intakeState.cleanCount,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [v]);
}
