#!/usr/bin/env node
import 'dotenv/config';

import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import * as path from 'node:path';

const { Logger } = require('@hmcts/nodejs-logging');
const logger = Logger.getLogger('server');

function startMockS2SAndApp() {
  const mockPort = 9000;

  const mockServer = http.createServer((req, res) => {
    logger.info(`Mock S2S received: ${req.method} ${req.url}`);

    if (req.url && req.url.includes('/lease')) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      // Payload contains {"sub":"finrem_citizen_ui", "exp": 4800000000}
      const validMockToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmaW5yZW1fY2l0aXplbl91aSIsImV4cCI6NDgwMDAwMDAwMH0.mock_signature';
      res.end(validMockToken);
      return;
    }

    if (req.url && req.url.includes('/health')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'UP' }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  mockServer.listen(mockPort, '127.0.0.1', () => {
    logger.info(`Mock S2S Server running on http://127.0.0.1:${mockPort}`);
    process.env.S2S_SERVICE = `http://127.0.0.1:${mockPort}`;
    startMainApp();
  });
}

function startMainApp() {
  const { app } = require('./app');
  let server: http.Server | https.Server;
  app.locals.shutdown = false;
  const port: number = parseInt(process.env.PORT || '3100', 10);

  if (app.locals.ENV === 'development') {
    if (process.env.PROTOCOL === 'http') {
      server = app.listen(port, () => {
        logger.info(`Application started: http://localhost:${port}`);
      });
    } else {
      const sslDirectory = path.join(__dirname, 'resources', 'localhost-ssl');
      try {
        const sslOptions = {
          cert: fs.readFileSync(path.join(sslDirectory, 'localhost.crt')),
          key: fs.readFileSync(path.join(sslDirectory, 'localhost.key')),
        };
        server = https.createServer(sslOptions, app);
        server.listen(port, () => {
          logger.info(`Application started: https://localhost:${port}`);
        });
      } catch (e) {
        logger.error(`Failed to load SSL keys: ${e}`);
        logger.error('Starting in HTTP mode as fallback.');
        server = app.listen(port, () => {
          logger.info(`Application started: http://localhost:${port}`);
        });
      }
    }
  } else {
    server = app.listen(port, () => {
      logger.info(`Application started: http://localhost:${port}`);
    });
  }

  function gracefulShutdownHandler(signal: string) {
    logger.info(`Caught ${signal}, gracefully shutting down.`);
    app.locals.shutdown = true;

    setTimeout(() => {
      if (server) {
        server.close();
      }
      process.exit(0);
    }, 4000);
  }

  process.on('SIGINT', gracefulShutdownHandler);
  process.on('SIGTERM', gracefulShutdownHandler);
}

const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
  startMockS2SAndApp();
} else {
  startMainApp();
}
