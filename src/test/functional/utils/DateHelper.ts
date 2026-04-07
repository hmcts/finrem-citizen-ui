/**
 * Date helper utilities for test data
 */
export class DateHelper {
  /**
   * Get current date in YYYY-MM-DD format
   */
  static getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get current timestamp in ISO format
   */
  static async getCurrentTimestamp(): Promise<string> {
    return new Date().toISOString();
  }

  /**
   * Get a date N weeks from now
   */
  static getDateWeeksFromNow(weeks: number): string {
    const date = new Date();
    date.setDate(date.getDate() + weeks * 7);
    return date.toISOString().split('T')[0];
  }

  /**
   * Get hearing date 12 weeks from now in ISO format
   */
  static async getHearingDateTwelveWeeksLaterInISOFormat(): Promise<string> {
    return this.getDateWeeksFromNow(12);
  }

  /**
   * Get formatted hearing date with current date and future hearing date
   */
  static async getFormattedHearingDate(): Promise<{ currentDate: string; hearingDate: string }> {
    const currentDate = this.getCurrentDate();
    const hearingDate = this.getDateWeeksFromNow(14); // 12-16 weeks
    return { currentDate, hearingDate };
  }

  /**
   * Format date as DD MMM YYYY (e.g., "25 Mar 2026")
   */
  static formatDateForDisplay(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
