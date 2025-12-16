import { Application, Request, Response } from 'express';
import {
  generateMockAuthCode,
  validateMockCredentials,
  mockTokenExchange
} from '../services/mockIdamService';

/**
 * Mock IDAM Routes
 * These routes simulate the IDAM OAuth2 flow for local development
 */

export default function (app: Application): void {
  /**
   * Mock IDAM Login Page
   * Simulates: http://localhost:9002/login
   */
  app.get('/mock-idam/login', (req: Request, res: Response) => {
    const { client_id, redirect_uri, response_type, state } = req.query;

    console.log('Mock IDAM: Login page accessed');
    console.log('  client_id:', client_id);
    console.log('  redirect_uri:', redirect_uri);

    res.render('mock-idam-login', {
      client_id,
      redirect_uri,
      state,
      response_type,
      pageTitle: 'Sign in or create an account - GOV.UK'
    });
  });

  /**
   * Mock IDAM Authentication Handler
   * Processes login form submission
   */
  app.post('/mock-idam/authenticate', (req: Request, res: Response) => {
    const { email, password, redirect_uri, state, client_id } = req.body;

    console.log('Mock IDAM: Authentication attempt');
    console.log('  email:', email);
    console.log('  redirect_uri:', redirect_uri);

    // Validate credentials
    if (!validateMockCredentials(email, password)) {
      console.log('Mock IDAM: Invalid credentials');
      return res.render('mock-idam-login', {
        error: 'Incorrect email or password',
        email,
        client_id,
        redirect_uri,
        state,
        pageTitle: 'Sign in or create an account - GOV.UK'
      });
    }

    // Generate mock authorization code
    const authCode = generateMockAuthCode();

    // Store email in session for token exchange (temporary)
    if (req.session) {
      (req.session as any).mockIdamEmail = email;
    }

    console.log('Mock IDAM: Authentication successful');
    console.log('  Generated auth code:', authCode);

    // Redirect back to callback URL with authorization code
    const callbackUrl = new URL(redirect_uri as string);
    callbackUrl.searchParams.set('code', authCode);
    if (state) {
      callbackUrl.searchParams.set('state', state as string);
    }

    console.log('Mock IDAM: Redirecting to:', callbackUrl.toString());
    res.redirect(callbackUrl.toString());
  });

  /**
   * Mock IDAM Token Exchange Endpoint
   * Simulates: http://localhost:5000/o/token
   */
  app.post('/mock-idam/o/token', (req: Request, res: Response) => {
    const { code, grant_type } = req.body;

    console.log('Mock IDAM: Token exchange request');
    console.log('  code:', code);
    console.log('  grant_type:', grant_type);

    // Get email from session (stored during authentication)
    const email = (req.session as any)?.mockIdamEmail || 'test-cred@hmcts.org';

    // Generate mock tokens
    const tokens = mockTokenExchange(email);

    console.log('Mock IDAM: Tokens generated for:', email);

    // Clean up session
    if (req.session) {
      delete (req.session as any).mockIdamEmail;
    }

    res.json(tokens);
  });

  /**
   * Mock IDAM End Session (Logout)
   * Simulates: http://localhost:9002/o/endSession
   */
  app.get('/mock-idam/o/endSession', (req: Request, res: Response) => {
    const { post_logout_redirect_uri } = req.query;

    console.log('Mock IDAM: End session requested');
    console.log('  post_logout_redirect_uri:', post_logout_redirect_uri);

    // Redirect to the specified URL or home
    const redirectUrl = (post_logout_redirect_uri as string) || 'http://localhost:3100/';
    res.redirect(redirectUrl);
  });

  /**
   * Mock IDAM User Info Endpoint (optional, for completeness)
   * Simulates: http://localhost:5000/o/userinfo
   */
  app.get('/mock-idam/o/userinfo', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Return mock user info
    res.json({
      uid: 'mock-user-' + Date.now(),
      sub: 'test-cred@hmcts.org',
      given_name: 'Test',
      family_name: 'User',
      roles: ['citizen']
    });
  });
}
