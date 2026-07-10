import { beforeEach, describe, expect, it } from '@jest/globals';
import express, { Application } from 'express';
import session from 'express-session';
import request from 'supertest';

import { PublicRoutes } from '../../../main/common-constants';
import autocompleteRoute from '../../../main/routes/generalUpload/autocomplete';

describe('Autocomplete Route', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: true,
      })
    );
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

    it('should exclude already-selected document types from results', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: true,
        })
      );
      testApp.use((req, _res, next) => {
        (req.session as unknown as Record<string, unknown>).DocumentSelection = {
          documentDetails: [
            {
              id: 'uuid-1',
              value: {
                DocumentType: 'bank-statements',
              },
            },
          ],
        };
        next();
      });
      autocompleteRoute(testApp);

      const response = await request(testApp).get(PublicRoutes.autocomplete).query({ q: 'bank' });

      expect(response.status).toBe(200);
      const bankStatements = response.body.find((doc: { value: string }) => doc.value === 'bank-statements');
      expect(bankStatements).toBeUndefined();
    });

    it('should return all matching results when no documents are selected', async () => {
      const response = await request(app).get(PublicRoutes.autocomplete).query({ q: 'payslip' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Payslips',
            value: 'payslips',
          }),
        ])
      );
    });

    it('should handle empty DocumentSelection in session', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: true,
        })
      );
      testApp.use((req, _res, next) => {
        (req.session as unknown as Record<string, unknown>).DocumentSelection = {};
        next();
      });
      autocompleteRoute(testApp);

      const response = await request(testApp).get(PublicRoutes.autocomplete).query({ q: 'bank' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should handle malformed session data gracefully', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: true,
        })
      );
      testApp.use((req, _res, next) => {
        (req.session as unknown as Record<string, unknown>).DocumentSelection = {
          documentDetails: [
            {
              id: 'uuid-1',
              value: null,
            },
            {
              id: 'uuid-2',
              value: {},
            },
          ],
        };
        next();
      });
      autocompleteRoute(testApp);

      const response = await request(testApp).get(PublicRoutes.autocomplete).query({ q: 'bank' });

      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should exclude multiple selected document types', async () => {
      const testApp = express();
      testApp.use(express.json());
      testApp.use(
        session({
          secret: 'test-secret',
          resave: false,
          saveUninitialized: true,
        })
      );
      testApp.use((req, _res, next) => {
        (req.session as unknown as Record<string, unknown>).DocumentSelection = {
          documentDetails: [
            {
              id: 'uuid-1',
              value: {
                DocumentType: 'payslips',
              },
            },
            {
              id: 'uuid-2',
              value: {
                DocumentType: 'bank-statements',
              },
            },
          ],
        };
        next();
      });
      autocompleteRoute(testApp);

      const responsePayslips = await request(testApp).get(PublicRoutes.autocomplete).query({ q: 'pay' });
      const responseBank = await request(testApp).get(PublicRoutes.autocomplete).query({ q: 'bank' });

      expect(responsePayslips.status).toBe(200);
      const payslips = responsePayslips.body.find((doc: { value: string }) => doc.value === 'payslips');
      expect(payslips).toBeUndefined();

      expect(responseBank.status).toBe(200);
      const bankStatements = responseBank.body.find((doc: { value: string }) => doc.value === 'bank-statements');
      expect(bankStatements).toBeUndefined();
    });
  });
});
