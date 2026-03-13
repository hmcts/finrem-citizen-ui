import * as propertiesVolume from '@hmcts/properties-volume';
import config from 'config';
import { Application } from 'express';
import { get, set } from 'lodash';

export class PropertiesVolume {
  enableFor(server: Application): void {
    if (server.locals.ENV !== 'development') {
      propertiesVolume.addTo(config);

      this.setSecret('secrets.finrem.finrem-system-update-username', 'services.idam.systemUsername');
      this.setSecret('secrets.finrem.finrem-system-update-password', 'services.idam.systemPassword');
      this.setSecret('secrets.finrem.finrem-citizen-ui-idam-client-secret', 'services.idam.clientSecret');
      this.setSecret('secrets.finrem.finrem-citizen-s2s-client-secret', 'services.authProvider.secret');
      this.setSecret('secrets.rpe.AppInsightsInstrumentationKey', 'appInsights.instrumentationKey');
    }
  }

  private setSecret(fromPath: string, toPath: string): void {
    if (config.has(fromPath)) {
      set(config, toPath, get(config, fromPath));
    }
  }
}
