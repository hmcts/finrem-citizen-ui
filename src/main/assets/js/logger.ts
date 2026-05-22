/**
 * Simple frontend logger for consistency with backend logging patterns.
 * Uses console methods but provides a consistent interface.
 */
/* eslint-disable no-console */
class Logger {
  constructor(private readonly context: string) {}

  error(message: string, ...args: unknown[]): void {
    console.error(`[${this.context}] ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[${this.context}] ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`[${this.context}] ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    console.debug(`[${this.context}] ${message}`, ...args);
  }
}
/* eslint-enable no-console */

export function getLogger(context: string): Logger {
  return new Logger(context);
}
