// Real client-side parsing of the mine's rim-return spreadsheet. Nothing here
// is hardcoded to "18 in, 13 clean, 5 held" — that outcome falls out of the
// rules below being run against whatever rows the sheet actually contains.
import * as XLSX from 'xlsx';
import type { IntakeProblem, IntakeRow } from '../types/domain';
import { RIM_REGISTER_SERIALS, OPEN_RIM_ASSET_NOS, KNOWN_RIM_SIZES } from './fixtures';
import { RULES } from '../config/rules';

const HEADER_MAP: Array<{ match: RegExp; field: keyof RawRow }> = [
  { match: /asset/i, field: 'customerAssetNo' },
  { match: /rim serial/i, field: 'rimSerial' },
  { match: /size/i, field: 'size' },
  { match: /machine/i, field: 'fleetNo' },
  { match: /hrs|hours/i, field: 'hours' },
  { match: /date/i, field: 'removedOn' },
  { match: /comment/i, field: 'note' },
];

interface RawRow {
  customerAssetNo: string;
  rimSerial: string;
  size: string;
  fleetNo: string;
  hours: string;
  removedOn: string;
  note: string;
}

/** Displays "63 in - 5 piece" (as the mine sends it) as "63 in — 5-piece" (our house style). */
function normalizeSizeDisplay(raw: string): string | null {
  const m = /^(\d+)\s*in\s*-\s*(\d+)\s*piece$/i.exec(raw.trim().replace(/\s+/g, ' '));
  if (!m) return null;
  return `${m[1]} in — ${m[2]}-piece`;
}

function isKnownSize(raw: string): boolean {
  const norm = normalizeSizeDisplay(raw);
  if (!norm) return false;
  return KNOWN_RIM_SIZES.includes(norm.replace('— ', '— ').replace('-piece', '-piece'))
    || KNOWN_RIM_SIZES.some((k) => k.replace(/\s/g, '').toLowerCase() === norm.replace(/\s/g, '').toLowerCase());
}

function suggestSize(raw: string): string {
  // Same leading "NN in" prefix, closest known size — a plain-English fix, not a guess.
  const lead = /^(\d+)\s*in/i.exec(raw.trim());
  if (lead) {
    const hit = KNOWN_RIM_SIZES.find((k) => k.startsWith(`${lead[1]} in`));
    if (hit) return hit;
  }
  return KNOWN_RIM_SIZES[0];
}

function looksLikeDate(raw: string): boolean {
  return /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(raw.trim());
}

function displayDate(raw: string): string {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
  if (!m) return raw;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${m[1].padStart(2, '0')} ${months[Number(m[2]) - 1]} ${m[3].slice(-2)}`;
}

export interface ParsedIntake {
  fileName: string;
  customer: string;
  rows: IntakeRow[];
  cleanCount: number;
  heldCount: number;
}

export async function parseRimReturnsWorkbook(file: File): Promise<ParsedIntake> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' });
  return parseGrid(grid, file.name);
}

/** Split out so it can be unit-tested against a plain array of rows, no File needed. */
export function parseGrid(grid: string[][], fileName: string): ParsedIntake {
  // Two preamble rows, then the header — hunt for the row that matches most of our columns
  // rather than assuming index 2, so a mine sending one extra banner row doesn't break intake.
  let headerRowIndex = grid.findIndex((row) => row.some((cell) => /asset/i.test(String(cell))) && row.some((cell) => /serial/i.test(String(cell))));
  if (headerRowIndex === -1) headerRowIndex = 2;
  const header = grid[headerRowIndex].map((h) => String(h).trim());
  const colField: Array<keyof RawRow | null> = header.map((h) => {
    const hit = HEADER_MAP.find((m) => m.match.test(h));
    return hit ? hit.field : null;
  });

  const dataRows = grid.slice(headerRowIndex + 1).filter((r) => r.some((c) => String(c).trim() !== ''));

  const raw: RawRow[] = dataRows.map((cells) => {
    const out: RawRow = { customerAssetNo: '', rimSerial: '', size: '', fleetNo: '', hours: '', removedOn: '', note: '' };
    colField.forEach((field, i) => {
      if (field) out[field] = String(cells[i] ?? '').trim();
    });
    out.hours = out.hours.replace(/,/g, '').trim();
    return out;
  });

  const rows = buildRows(raw);
  const heldCount = rows.filter((r) => r.state === 'held').length;
  return {
    fileName,
    customer: 'Kurrajong Coal',
    rows,
    cleanCount: rows.length - heldCount,
    heldCount,
  };
}

/** The same rule set used for an uploaded sheet, run against manually typed rows. */
export function parseManualRows(entries: Array<{
  customerAssetNo: string; rimSerial: string; size: string; fleetNo: string; hours: string; removedOn: string;
}>): ParsedIntake {
  const raw: RawRow[] = entries.map((e) => ({ ...e, note: '', hours: e.hours.replace(/,/g, '').trim() }));
  const rows = buildRows(raw);
  const heldCount = rows.filter((r) => r.state === 'held').length;
  return {
    fileName: 'Typed in by hand', customer: 'Kurrajong Coal', rows, cleanCount: rows.length - heldCount, heldCount,
  };
}

function buildRows(raw: RawRow[]): IntakeRow[] {
  const assetCounts = new Map<string, number>();
  raw.forEach((r) => assetCounts.set(r.customerAssetNo, (assetCounts.get(r.customerAssetNo) ?? 0) + 1));
  const seenAsset = new Set<string>();

  return raw.map((r, i) => {
    const rowNo = i + 1;
    const problems: IntakeProblem[] = [];

    const isDuplicate = (assetCounts.get(r.customerAssetNo) ?? 0) > 1 && seenAsset.has(r.customerAssetNo);
    seenAsset.add(r.customerAssetNo);
    if (isDuplicate) {
      const firstRow = raw.findIndex((x) => x.customerAssetNo === r.customerAssetNo) + 1;
      problems.push({
        code: 'duplicate_asset', field: 'customerAssetNo', needsHuman: true,
        message: `${r.customerAssetNo} appears twice in this list (rows ${firstRow} and ${rowNo}). Keep one.`,
      });
    }

    if (OPEN_RIM_ASSET_NOS.has(r.customerAssetNo)) {
      problems.push({
        code: 'open_job', field: 'customerAssetNo', needsHuman: true,
        message: `${r.customerAssetNo} already has an open job. Confirm before creating another.`,
      });
    }

    if (!r.rimSerial) {
      problems.push({
        code: 'blank_serial', field: 'rimSerial', needsHuman: true,
        message: 'No rim serial in the list. Type it from the rim, or hold this row.',
      });
    } else if (!RIM_REGISTER_SERIALS.has(r.rimSerial)) {
      problems.push({
        code: 'unknown_serial', field: 'rimSerial', needsHuman: true,
        message: `${r.rimSerial} isn't in the rim register for this customer. Confirm before creating a job.`,
      });
    }

    if (r.size && !isKnownSize(r.size)) {
      problems.push({
        code: 'size_typo', field: 'size', needsHuman: false,
        message: `"${r.size}" isn't a size we hold. Did you mean ${suggestSize(r.size)}?`,
      });
    }

    if (!r.hours) {
      problems.push({
        code: 'blank_hours', field: 'hours', needsHuman: false,
        message: "Hours at removal is blank — we can't set the next NDT due without it.",
      });
    } else {
      const n = Number(r.hours);
      if (Number.isFinite(n) && n < RULES.intakeFlags.earlyBelowHours) {
        problems.push({
          code: 'early_hours', field: 'hours', needsHuman: true,
          message: `Back early — ${n.toLocaleString()} h against a 10,000 h interval. Confirm before creating a job.`,
        });
      } else if (Number.isFinite(n) && n > RULES.intakeFlags.overdueAboveHours) {
        problems.push({
          code: 'overdue_hours', field: 'hours', needsHuman: true,
          message: `Overdue — ${n.toLocaleString()} h is more than double the 10,000 h interval. Confirm before creating a job.`,
        });
      }
    }

    if (r.removedOn && !looksLikeDate(r.removedOn)) {
      problems.push({
        code: 'date_as_text', field: 'removedOn', needsHuman: false,
        message: `"${r.removedOn}" isn't a date. Pick the day it came off.`,
      });
    }

    const needsHuman = problems.some((p) => p.needsHuman);
    return {
      row: rowNo,
      customerAssetNo: r.customerAssetNo,
      rimSerial: r.rimSerial,
      size: normalizeSizeDisplay(r.size) ?? r.size,
      fleetNo: r.fleetNo,
      hours: r.hours,
      removedOn: looksLikeDate(r.removedOn) ? displayDate(r.removedOn) : r.removedOn,
      state: needsHuman ? 'held' : 'clean',
      problems,
    };
  });
}
