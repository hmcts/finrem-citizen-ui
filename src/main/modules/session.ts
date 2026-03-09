import config = require('config');
import { Application } from 'express';
import session from 'express-session';

export class Session {
  public enableFor(app: Application): void {
    const sessionSecret = config.has('session.secret') 
      ? config.get<string>('session.secret')
      : process.env.SESSION_SECRET || 'change-this-secret-in-production';

    app.use(
      session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
          httpOnly: true,
          maxAge: 3600000, // 1 hour
          secure: process.env.NODE_ENV === 'production',
        },
      })
    );
  }
}
