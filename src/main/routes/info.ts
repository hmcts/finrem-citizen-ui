import * as os from 'node:os';

import { infoRequestHandler } from '@hmcts/info-provider';
import { Router } from 'express';

import { RouteNames } from '../common-constants';

export default function info(app: Router): void {
  app.get(
    RouteNames.info,
    infoRequestHandler({
      extraBuildInfo: {
        host: os.hostname(),
        name: 'expressjs-template',
        uptime: process.uptime(),
      },
      info: {},
    })
  );
}
