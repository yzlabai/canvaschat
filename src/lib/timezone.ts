/**
 * Timezone utility functions for long-term research projects
 */

/**
 * Utility to map collection frequency to cron pattern
 */
export function frequencyToCronPattern(frequency: string): string {
  switch (frequency) {
    case "weekly":
      return "0 9 * * 1"; // Every Monday at 9 AM UTC
    case "bi-weekly":
      return "0 9 * * 1/2"; // Every other Monday at 9 AM UTC
    case "monthly":
      return "0 9 1 * *"; // First day of every month at 9 AM UTC
    default:
      return "0 9 * * *"; // Every day at 9 AM UTC
  }
}

/**
 * Get the user's detected timezone using Intl.DateTimeFormat
 * This is the most reliable way to detect user timezone in modern browsers
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (error) {
    console.warn("Failed to detect user timezone, falling back to UTC:", error);
    return "UTC";
  }
}

/**
 * Get timezone offset in hours from UTC
 */
export function getTimezoneOffset(): number {
  return -new Date().getTimezoneOffset() / 60;
}

/**
 * Format timezone for display (e.g., "America/New_York (UTC-5)")
 */
export function formatTimezoneDisplay(timezone?: string): string {
  const tz = timezone || getUserTimezone();
  const offset = getTimezoneOffsetForTimezone(tz);
  const sign = offset >= 0 ? "+" : "";
  return `${tz} (UTC${sign}${offset})`;
}

/**
 * Get timezone offset for a specific timezone
 */
export function getTimezoneOffsetForTimezone(timezone: string): number {
  try {
    const now = new Date();
    
    // Use toLocaleString to get the time in the target timezone
    const utcTime = now.getTime();
    const localTime = new Date(now.toLocaleString('en-US', { timeZone: timezone })).getTime();
    const utcTimeString = now.toLocaleString('en-US', { timeZone: 'UTC' });
    const utcTimeMs = new Date(utcTimeString).getTime();
    
    // Calculate the difference in hours
    const offsetMs = localTime - utcTimeMs;
    const offsetHours = offsetMs / (1000 * 60 * 60);
    
    return Math.round(offsetHours);
  } catch (error) {
    console.warn(`Failed to get offset for timezone ${timezone}:`, error);
    return 0;
  }
}

/**
 * Convert a time from one timezone to another
 */
export function convertTimezone(date: Date, fromTimezone: string, toTimezone: string): Date {
  try {
    // Convert to target timezone
    const utc = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
    return new Date(utc.toLocaleString("en-US", { timeZone: toTimezone }));
  } catch (error) {
    console.warn(`Failed to convert timezone from ${fromTimezone} to ${toTimezone}:`, error);
    return date;
  }
}

/**
 * Get next collection time in user's timezone
 */
export function getNextCollectionTime(
  frequency: "daily" | "weekly" | "bi-weekly" | "monthly",
  timezone: string = getUserTimezone(),
  baseTime: { hour: number; minute: number } = { hour: 9, minute: 0 }
): Date {
  const now = new Date();
  const next = new Date(now);
  
  // Set to the base time (default 9:00 AM)
  next.setHours(baseTime.hour, baseTime.minute, 0, 0);
  
  switch (frequency) {
    case "weekly":
      // Next Monday
      const daysUntilMonday = (1 - now.getDay() + 7) % 7;
      next.setDate(now.getDate() + (daysUntilMonday || 7));
      break;
    case "bi-weekly":
      // Next Monday, but every other week
      const daysUntilMondayBi = (1 - now.getDay() + 7) % 7;
      next.setDate(now.getDate() + (daysUntilMondayBi || 14));
      break;
    case "monthly":
      // First day of next month
      next.setMonth(now.getMonth() + 1, 1);
      break;
    default: // daily
      // Tomorrow if past the time today, otherwise today
      if (now.getHours() >= baseTime.hour && now.getMinutes() >= baseTime.minute) {
        next.setDate(now.getDate() + 1);
      }
      break;
  }
  
  return next;
}

/**
 * Common timezone options for dropdowns
 */
export const COMMON_TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Europe/Moscow", label: "Moscow Time (MSK)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Asia/Shanghai", label: "China Standard Time (CST)" },
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
  { value: "Pacific/Auckland", label: "New Zealand Time (NZST)" },
  { value: "UTC", label: "Coordinated Universal Time (UTC)" },
];

/**
 * Get timezone suggestions based on user's detected timezone
 */
export function getTimezoneSuggestions(): typeof COMMON_TIMEZONES {
  const userTz = getUserTimezone();
  const suggestions: { value: string; label: string; }[] = [];
  // Add common timezones
  COMMON_TIMEZONES.forEach(tz => {
    suggestions.push({
      value: tz.value,
      label: tz.label
    });
  });

  // Add user's timezone if not in common list
  if (!suggestions.some(tz => tz.value === userTz)) {
    suggestions.unshift({
      value: userTz,
      label: `${userTz} (Your timezone)`
    });
  } else {
    // Mark user's timezone
    const userTzIndex = COMMON_TIMEZONES.findIndex(tz => tz.value === userTz);
    console.log('userTzIndex', userTzIndex);
    console.log('COMMON_TIMEZONES[userTzIndex]', COMMON_TIMEZONES[userTzIndex]);
    if (userTzIndex !== -1) {
      suggestions[userTzIndex].label = COMMON_TIMEZONES[userTzIndex].label + " (Your timezone)";
    }
  }
  
  return suggestions;
}
