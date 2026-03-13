import { Server } from 'http';
import { AddressInfo } from 'net';

import type { Express } from 'express';
import supertest from 'supertest';

import { app } from '../../main/app';

const pa11y = require('pa11y');

jest.mock('../../main/modules/oidc', () => ({
  OIDCModule: class {
    enableFor(): void {
      // Prevent outbound OIDC discovery calls in test runtime.
    }
  },
}));

let app: Express;
let server: Server;
let port: number;

beforeAll(() => {
  app = require('../../main/app').app as Express;
  server = app.listen(0);
  const address = server.address();
  if (address && typeof address !== 'string') {
    port = (address as AddressInfo).port;
  } else {
    throw new Error('Server address is not available');
  }
});

afterAll(async () => {
  if (!server?.listening) {
    return;
  }

  if ('closeAllConnections' in server && typeof server.closeAllConnections === 'function') {
    server.closeAllConnections();
  }

  await new Promise<void>((resolve, reject) => {
    server.close(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
});

class Pa11yResult {
  documentTitle: string;
  pageUrl: string;
  issues: PallyIssue[];
  constructor(documentTitle: string, pageUrl: string, issues: PallyIssue[]) {
    this.documentTitle = documentTitle;
    this.pageUrl = pageUrl;
    this.issues = issues;
  }
}

class PallyIssue {
  code: string;
  context: string;
  message: string;
  selector: string;
  type: string;
  typeCode: number;
  constructor(code: string, context: string, message: string, selector: string, type: string, typeCode: number) {
    this.code = code;
    this.context = context;
    this.message = message;
    this.selector = selector;
    this.type = type;
    this.typeCode = typeCode;
  }
}

function ensurePageCallWillSucceed(url: string): Promise<void> {
  return supertest(server)
    .get(url)
    .set('Connection', 'close')
    .then((res: supertest.Response) => {
      if (res.status >= 400) {
        throw new Error(`Call to ${url} failed with status: ${res.status}`);
      }
    });
}

function runPally(url: string): Promise<Pa11yResult> {
  const fullUrl = `http://localhost:${port}${url}`;
  return pa11y(fullUrl, {
    hideElements: '.govuk-footer__licence-logo, .govuk-header__logotype-crown, .govuk-footer__crown',
    timeout: 120000,
    chromeLaunchConfig: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
  });
}

function expectNoErrors(messages: PallyIssue[]): void {
  const errors = messages.filter(m => m.type === 'error');
  if (errors.length > 0) {
    const errorsAsJson = `${JSON.stringify(errors, null, 2)}`;
    throw new Error(`There are accessibility issues: \n${errorsAsJson}\n`);
  }
}

function testAccessibility(url: string): void {
  describe(`Page ${url}`, () => {
    test('should have no accessibility errors', async () => {
      await ensurePageCallWillSucceed(url);
      const result = await runPally(url);
      expect(result.issues).toEqual(expect.any(Array));
      expectNoErrors(result.issues);
    }, 150000);
  });
}

testAccessibility('/');
