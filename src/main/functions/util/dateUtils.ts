/**
   * Formats a case_data API timestamp for display in UK local time.
   *
   * Treats timestamps without a timezone suffix as UTC and preserves explicit
   * offsets. Converts to Europe/London time (BST in summer, GMT in winter),
   * using hours 1–12 so noon and midnight display as 12 rather than 0.
   *
   * @param timestamp - API timestamp, assumed UTC if no timezone is specified.
   * @returns Formatted date and time, e.g. "8 October 2026 at 10:06am".
   */
  export function formatUploadDate(timestamp: string): string {
    const utcTimestamp = /(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp)
      ? timestamp
      : `${timestamp}Z`;

    return new Date(utcTimestamp)
      .toLocaleString('en-GB', {
        timeZone: 'Europe/London',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hourCycle: 'h12',
      })
      .replace(',', ' at')
      .replace(' am', 'am')
      .replace(' pm', 'pm');
  }