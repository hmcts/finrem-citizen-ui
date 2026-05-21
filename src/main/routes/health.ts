import { Logger } from '@hmcts/nodejs-logging';
import config from 'config';
import { Application } from 'express';
import { Redis } from 'ioredis';

import { app as myApp } from '../app';

const healthcheck = require('@hmcts/nodejs-healthcheck');

type AppWithRedis = Application & {
  locals: Application['locals'] & {
    shutdown?: boolean;
    redisClient?: Redis;
  };
};

function shutdownCheck(): boolean {
  return Boolean(myApp.locals.shutdown);
}

export default function health(app: Application): void {
  const logger = Logger.getLogger('health');
  const typedApp = app as AppWithRedis;
  const isRedisEnabled = config.get<string>('features.redis') === 'true';
  const caseServiceHealthUrl = `${config.get<string>('services.case.url').replace(/\/$/, '')}/health`;
  const orchestrationServiceHealthUrl = `${config.get<string>('services.orchestrationService.url').replace(/\/$/, '')}/health`;

  const healthCheckConfig = {
    checks: {
      ccd: healthcheck.web(caseServiceHealthUrl),
      orchestrationService: healthcheck.web(orchestrationServiceHealthUrl),
      redis: healthcheck.raw(async () => {
        if (!isRedisEnabled) {
          return healthcheck.up();
        }

        const redisClient = typedApp.locals.redisClient;

        if (!redisClient) {
          logger.error('Redis health check failed: redisClient missing from app.locals');
          return healthcheck.down();
        }

        try {
          const result: string = await redisClient.ping();
          return result === 'PONG' ? healthcheck.up() : healthcheck.down();
        } catch (error: unknown) {
          logger.error('Redis health check failed', error);
          return healthcheck.down();
        }
      }),
    },
    readinessChecks: {
      shutdownCheck: healthcheck.raw(() => {
        return shutdownCheck() ? healthcheck.down() : healthcheck.up();
      }),
    },
  };

  healthcheck.addTo(app, healthCheckConfig);
}
