import { describe, expect, it } from '@jest/globals';

import { formatUploadDate } from '../../../../main/functions/util/dateUtils';

  describe('formatUploadDate', () => {
    it.each([
      [
        'treats a timezone-less timestamp as UTC and converts to BST',
        '2026-10-08T09:06:36.867328000',
        '8 October 2026 at 10:06am',
      ],
      [
        'uses GMT in winter',
        '2026-01-08T09:06:00',
        '8 January 2026 at 9:06am',
      ],
      [
        'preserves an explicit UTC suffix',
        '2026-10-08T09:06:00Z',
        '8 October 2026 at 10:06am',
      ],
      [
        'respects an explicit timezone offset',
        '2026-10-08T11:06:00+02:00',
        '8 October 2026 at 10:06am',
      ],
      [
        'displays noon as 12pm rather than 0pm',
        '2026-10-08T11:04:00Z',
        '8 October 2026 at 12:04pm',
      ],
      [
        'displays midnight as 12am and advances the date',
        '2026-10-08T23:04:00Z',
        '9 October 2026 at 12:04am',
      ],
    ])('%s', (_description, timestamp, expected) => {
      expect(formatUploadDate(timestamp)).toBe(expected);
    });
  });