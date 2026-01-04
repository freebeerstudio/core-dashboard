import { format } from 'date-fns'
import { formatInTimeZone } from 'date-fns-tz'

/**
 * Format a date/time string to Central Time (America/Chicago)
 * @param dateString - ISO date string from API
 * @param formatString - date-fns format string (default: 'MMM d, h:mm a')
 * @returns Formatted date string in CST/CDT with timezone label
 */
export function formatCentralTime(dateString: string, formatString: string = 'MMM d, h:mm a'): string {
  const timezone = 'America/Chicago'
  const formatted = formatInTimeZone(new Date(dateString), timezone, formatString)

  // Determine if we're in CST or CDT
  const date = new Date(dateString)
  const tzAbbr = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'short'
  }).formatToParts(date).find(part => part.type === 'timeZoneName')?.value || 'CST'

  return `${formatted} ${tzAbbr}`
}
