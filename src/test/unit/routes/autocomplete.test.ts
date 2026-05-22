import { beforeEach, describe, expect, it } from '@jest/globals';
import express, { Application } from 'express';
import request from 'supertest';

import { PublicRoutes } from '../../../main/common-constants';
import autocompleteRoute from '../../../main/routes/autocomplete';

describe('Autocomplete Route', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    autocompleteRoute(app);
  });

  describe('GET /autocomplete', () => {
    it('should return empty array when query is empty', async () => {
      const response = await request(app).get(PublicRoutes.autocomplete).query({ q: '' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return matching documents by label', async () => {
      const response = await request(app).get(PublicRoutes.autocomplete).query({ q: 'bank' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 39,
            label: 'Bank statements',
            value: 'bank-statements',
          }),
        ])
      );
    });

    it('should return matching documents by alias', async () => {
      const response = await request(app).get(PublicRoutes.autocomplete).query({ q: 'FP9' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return "Other document" when no matches found', async () => {
      const response = await request(app).get(PublicRoutes.autocomplete).query({ q: 'xyz123nonexistent' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          id: 99,
          label: 'Other document',
          value: 'other-document',
        },
      ]);
    });
  });
});
