import { Application, Response } from 'express';
import config from 'config';
import { AppRequest } from '../types/session';
import { exchangeCodeForTokens, extractUserDetails } from '../services/idamService';
import {
  SIGN_IN_URL,
  SIGN_OUT_URL,
  CALLBACK_URL,
  DASHBOARD_URL,
  UNAUTHORISED_URL,
  HOME_URL,
} from '../constants/urls';

export default function (app: Application): void {
  // Read IDAM configuration
  const useMockIdam = config.get<boolean>('services.idam.useMockIdam');
  const loginUrl = config.get<string>('services.idam.authorizationURL');
  const clientId = config.get<string>('services.idam.clientID');
  const callbackUrl = config.get<string>('services.idam.callbackURL');
  const scope = config.get<string>('services.idam.scope');
  const signOutUrl = config.get<string>('services.idam.signOutURL');
  const citizenRole = config.get<string>('services.idam.citizenRole');

  /**
   * Login route - Redirects to IDAM (real or mock) for authentication
   */
  app.get(SIGN_IN_URL, (_req, res: Response) => {
    // Use mock IDAM if enabled
    if (useMockIdam) {
      const mockIdamAuthUrl = `/mock-idam/login?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}${scope}`;
      console.log('Redirecting to Mock IDAM login (development mode)');
      return res.redirect(mockIdamAuthUrl);
    }

    // Use real IDAM
    const idamAuthUrl = `${loginUrl}?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(callbackUrl)}${scope}`;
    console.log('Redirecting to Real IDAM login');
    res.redirect(idamAuthUrl);
  });

  /**
   * OAuth2 callback route - Handles authorization code and creates session
   */
  app.get(CALLBACK_URL, async (req: AppRequest, res: Response) => {
    const code = req.query.code as string;

    // Validate authorization code exists
    if (!code) {
      console.error('No authorization code received');
      return res.redirect(SIGN_IN_URL);
    }

    try {
      console.log('Processing OAuth2 callback');

      // Exchange authorization code for tokens
      const tokens = await exchangeCodeForTokens(code);

      // Extract user details from JWT
      const user = extractUserDetails(tokens);

      // Store user in session
      req.session.user = user;

      console.log(`User logged in: ${user.id}`);

      // Check if user has required role
      if (user.roles.includes(citizenRole)) {
        return res.redirect(DASHBOARD_URL);
      } else {
        console.warn(`User ${user.id} lacks citizen role`);
        return res.redirect(UNAUTHORISED_URL);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      return res.redirect(SIGN_IN_URL);
    }
  });

  /**
   * Logout route - Destroys session and redirects to IDAM (real or mock) sign-out
   */
  app.get(SIGN_OUT_URL, (req: AppRequest, res: Response) => {
    const token = req.session.user?.accessToken || '';

    console.log('User signing out');

    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Error destroying session:', err);
      }

      // Use mock IDAM if enabled
      if (useMockIdam) {
        const params = new URLSearchParams({
          post_logout_redirect_uri: `https://localhost:3100${HOME_URL}`,
        });
        console.log('Redirecting to Mock IDAM sign-out');
        return res.redirect(`/mock-idam/o/endSession?${params.toString()}`);
      }

      // Build real IDAM sign-out URL with parameters
      const params = new URLSearchParams({
        id_token_hint: token,
        post_logout_redirect_uri: `https://localhost:3100${HOME_URL}`,
      });

      console.log('Redirecting to Real IDAM sign-out');
      res.redirect(`${signOutUrl}?${params.toString()}`);
    });
  });

  /**
   * Unauthorised route - Shows error for users without citizen role
   */
  app.get(UNAUTHORISED_URL, (_req, res: Response) => {
    console.log('Unauthorised access attempt');
    res.render('unauthorised', {
      pageTitle: 'Unauthorised - Financial Remedy',
    });
  });
}
