import { addDays, differenceInCalendarDays, parseISO, format } from "date-fns";

export interface PeriodRange {
  start: string;
  end: string;
}

export function groupPeriodDays(sortedDates: string[]): PeriodRange[] {
  if (sortedDates.length === 0) return [];
  const ranges: PeriodRange[] = [];
  let rangeStart = sortedDates[0];
  let prev = sortedDates[0];
  for (let i = 1; i < sortedDates.length; i++) {
    const cur = sortedDates[i];
    if (differenceInCalendarDays(parseISO(cur), parseISO(prev)) > 1) {
      ranges.push({ start: rangeStart, end: prev });
      rangeStart = cur;
    }
    prev = cur;
  }
  ranges.push({ start: rangeStart, end: prev });
  return ranges;
}

export interface CycleStats {
  avgCycleLength: number;
  avgPeriodLength: number;
  ranges: PeriodRange[];
  predictedRanges: PeriodRange[];
}

export function computeCycleStats(periodDates: string[]): CycleStats {
  const sorted = [...periodDates].sort();
  const ranges = groupPeriodDays(sorted);

  if (ranges.length === 0) {
    return { avgCycleLength: 28, avgPeriodLength: 5, ranges: [], predictedRanges: [] };
  }

  const periodLengths = ranges.map(
    (r) => differenceInCalendarDays(parseISO(r.end), parseISO(r.start)) + 1
  );
  const avgPeriodLength = Math.round(
    periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length
  );

  let avgCycleLength = 28;
  if (ranges.length >= 2) {
    const cycleLengths: number[] = [];
    for (let i = 1; i < ranges.length; i++) {
      cycleLengths.push(
        differenceInCalendarDays(parseISO(ranges[i].start), parseISO(ranges[i - 1].start))
      );
    }
    avgCycleLength = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);
  }

  const lastStart = ranges[ranges.length - 1].start;
  const predictedRanges: PeriodRange[] = [];
  let nextStart = addDays(parseISO(lastStart), avgCycleLength);
  for (let i = 0; i < 6; i++) {
    const start = format(nextStart, "yyyy-MM-dd");
    const end = format(addDays(nextStart, avgPeriodLength - 1), "yyyy-MM-dd");
    predictedRanges.push({ start, end });
    nextStart = addDays(nextStart, avgCycleLength);
  }

  return { avgCycleLength, avgPeriodLength, ranges, predictedRanges };
}

export function expandRangeToDates(range: PeriodRange): string[] {
  const days: string[] = [];
  let cur = parseISO(range.start);
  const end = parseISO(range.end);
  while (cur <= end) {
    days.push(format(cur, "yyyy-MM-dd"));
    cur = addDays(cur, 1);
  }
  return days;
}
