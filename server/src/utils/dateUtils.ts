/**
 * Date utility helpers — all date strings are 'YYYY-MM-DD' in UTC.
 * Using UTC consistently prevents timezone-related streak breakage.
 */

export function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7); // 'YYYY-MM'
}

export function getMonthStart(month: string): string {
  return `${month}-01`;
}

export function getMonthEnd(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${String(lastDay).padStart(2, '0')}`;
}

export function isHabitScheduledForDate(
  frequency: string,
  scheduledDays: number[] | undefined,
  dateStr: string
): boolean {
  const day = new Date(dateStr + 'T00:00:00Z').getUTCDay(); // 0=Sun..6=Sat

  switch (frequency) {
    case 'daily':
      return true;
    case 'weekdays':
      return day >= 1 && day <= 5;
    case 'weekends':
      return day === 0 || day === 6;
    case 'custom':
      return scheduledDays ? scheduledDays.includes(day) : false;
    default:
      return true;
  }
}

export function formatDateRange(startDate: string, endDate: string): { start: string; end: string } {
  return { start: startDate, end: endDate };
}

export function getLast30Days(): { start: string; end: string } {
  const end = getTodayDate();
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - 29);
  const start = d.toISOString().slice(0, 10);
  return { start, end };
}
