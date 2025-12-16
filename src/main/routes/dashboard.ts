import { Application, Response } from 'express';
import { AppRequest } from '../types/session';
import { DASHBOARD_URL, SIGN_IN_URL, ENTER_CASE_NUMBER_URL } from '../constants/urls';

export default function (app: Application): void {
  /**
   * Dashboard route - Shows user's cases and information
   * Requires authentication and case linking
   */
  app.get(DASHBOARD_URL, (req: AppRequest, res: Response) => {
    // Check if user is authenticated
    if (!req.session.user) {
      console.log('Unauthenticated access to dashboard, redirecting to login');
      return res.redirect(SIGN_IN_URL);
    }

    const user = req.session.user;

    console.log(`Dashboard accessed by user: ${user.id}`);

    // Check if case is linked
    if (!req.session.caseLinked) {
      console.log('No case linked, redirecting to case number entry');
      return res.redirect(ENTER_CASE_NUMBER_URL);
    }

    // Render dashboard view with user data and case data
    res.render('dashboard', {
      user,
      caseData: req.session.caseData,
      pageTitle: 'Your cases - Financial Remedy',
    });
  });
}
