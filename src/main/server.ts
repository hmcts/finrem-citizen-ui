#!/usr/bin/env node
import 'dotenv/config';

import * as fs from 'node:fs';
import * as http from 'node:http';
import * as https from 'node:https';
import * as path from 'node:path';

// @ts-ignore
import { Logger } from '@hmcts/nodejs-logging';

import { app } from './app';

const logger = Logger.getLogger('server');

// Standard startup logic (No Mock S2S)
function startApp() {
  let server: http.Server | https.Server;
  app.locals.shutdown = false;
  const port: number = parseInt(process.env.PORT || '3100', 10);

  if (app.locals.ENV === 'development') {
    // Respect the PROTOCOL env var to allow HTTP locally (fixes IDAM redirects)
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
    // Production/Cloud configuration
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

startApp();
