/**
 * Every date in this prototype is measured against a pinned "today" rather than the
 * real clock. The seed claims have fixed June 2026 remittance dates, so a live clock
 * would make the deadline countdown drift and eventually read as expired — the
 * deadline-override story would stop working a few weeks after it was built.
 *
 * Pinned so that Claim B's appeal deadline always lands 11 days out.
 * Change this one constant to re-point the whole demo.
 */
export const DEMO_TODAY = '2026-09-06'

/** Claims within this many days of their appeal deadline jump the queue. */
export const DEADLINE_OVERRIDE_DAYS = 14

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** Parse an ISO date as UTC midnight, so day arithmetic never crosses a DST seam. */
function parseIsoDate(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const result = new Date(parseIsoDate(iso) + days * MS_PER_DAY)
  return result.toISOString().slice(0, 10)
}

/** Whole days from `from` to `to`. Negative once the target is in the past. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseIsoDate(to) - parseIsoDate(from)) / MS_PER_DAY)
}

export function daysFromDemoToday(iso: string): number {
  return daysBetween(DEMO_TODAY, iso)
}

/** "Jun 19, 2026" — long enough to read from the back of a room. */
export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ]
  return `${months[m - 1]} ${d}, ${y}`
}

export function formatCurrency(amount: number | null): string {
  if (amount === null) return '—'
  return amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  })
}
