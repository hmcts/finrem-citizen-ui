import { Application, Response } from 'express';
import config from 'config';
import { AppRequest } from '../types/session';
import {
  ENTER_CASE_NUMBER_URL,
  ENTER_ACCESS_CODE_URL,
  DASHBOARD_URL,
  SIGN_IN_URL,
} from '../constants/urls';

/**
 * Case Access Routes
 * Handles case number and access code entry for linking cases to users
 */

export default function (app: Application): void {
  const useMockIdam = config.get<boolean>('services.idam.useMockIdam');

  /**
   * Enter Case Number - GET
   * Shows form to enter 16-digit case reference
   */
  app.get(ENTER_CASE_NUMBER_URL, (req: AppRequest, res: Response) => {
    // Check if user is authenticated
    if (!req.session.user) {
      console.log('Unauthenticated access to case number page, redirecting to login');
      return res.redirect(SIGN_IN_URL);
    }

    console.log('Case number entry page accessed');

    res.render('enter-case-number', {
      pageTitle: 'Enter case number - Dividing your money and property',
      useMockIdam,
    });
  });

  /**
   * Enter Case Number - POST
   * Validates and stores case number
   */
  app.post(ENTER_CASE_NUMBER_URL, (req: AppRequest, res: Response) => {
    // Check if user is authenticated
    if (!req.session.user) {
      return res.redirect(SIGN_IN_URL);
    }

    const { caseNumber } = req.body;

    console.log('Case number submission:', caseNumber);

    // Validate case number
    const validation = validateCaseNumber(caseNumber);
    if (!validation.valid) {
      console.log('Invalid case number:', validation.error);
      return res.render('enter-case-number', {
        error: validation.error,
        caseNumber,
        pageTitle: 'Enter case number - Dividing your money and property',
        useMockIdam,
      });
    }

    // Normalize case number (remove hyphens/spaces)
    const normalizedCaseNumber = normalizeCaseNumber(caseNumber);

    // Store case number in session
    req.session.caseNumber = normalizedCaseNumber;

    console.log('Case number stored in session:', normalizedCaseNumber);

    // Redirect to access code entry
    res.redirect(ENTER_ACCESS_CODE_URL);
  });

  /**
   * Enter Access Code - GET
   * Shows form to enter 8-digit access code
   */
  app.get(ENTER_ACCESS_CODE_URL, (req: AppRequest, res: Response) => {
    // Check if user is authenticated
    if (!req.session.user) {
      console.log('Unauthenticated access to access code page, redirecting to login');
      return res.redirect(SIGN_IN_URL);
    }

    // Check if case number has been entered
    if (!req.session.caseNumber) {
      console.log('No case number in session, redirecting to case number entry');
      return res.redirect(ENTER_CASE_NUMBER_URL);
    }

    console.log('Access code entry page accessed');

    res.render('enter-access-code', {
      pageTitle: 'Enter access code - Dividing your money and property',
      useMockIdam,
    });
  });

  /**
   * Enter Access Code - POST
   * Validates and links case to user
   */
  app.post(ENTER_ACCESS_CODE_URL, (req: AppRequest, res: Response) => {
    // Check if user is authenticated
    if (!req.session.user) {
      return res.redirect(SIGN_IN_URL);
    }

    // Check if case number exists in session
    if (!req.session.caseNumber) {
      return res.redirect(ENTER_CASE_NUMBER_URL);
    }

    const { accessCode } = req.body;

    console.log('Access code submission:', accessCode);

    // Validate access code
    const validation = validateAccessCode(accessCode);
    if (!validation.valid) {
      console.log('Invalid access code:', validation.error);
      return res.render('enter-access-code', {
        error: validation.error,
        accessCode,
        pageTitle: 'Enter access code - Dividing your money and property',
        useMockIdam,
      });
    }

    // Normalize access code (remove hyphens/spaces)
    const normalizedAccessCode = normalizeAccessCode(accessCode);

    // In mock mode, accept any valid format
    // In real mode, this would validate against the backend API
    if (useMockIdam) {
      // Mock: Generate fake case data
      req.session.caseData = generateMockCaseData(req.session.caseNumber, normalizedAccessCode);
      console.log('Mock case data generated:', req.session.caseData);
    } else {
      // Real mode: Validate with backend API (to be implemented)
      // For now, just store the access code
      req.session.accessCode = normalizedAccessCode;
      console.log('Access code stored (real IDAM mode)');
    }

    // Mark case as linked
    req.session.caseLinked = true;

    console.log('Case successfully linked to user');

    // Redirect to dashboard
    res.redirect(DASHBOARD_URL);
  });
}

/**
 * Validate case number format
 * Accepts: 16 digits with optional hyphens/spaces
 * Examples: 1234-5678-9123-4567, 1234567891234567
 */
function validateCaseNumber(caseNumber: string): { valid: boolean; error?: string } {
  if (!caseNumber || typeof caseNumber !== 'string') {
    return { valid: false, error: 'Enter a case number' };
  }

  // Remove hyphens and spaces
  const cleaned = caseNumber.replace(/[-\s]/g, '');

  // Check if it's exactly 16 digits
  if (!/^\d{16}$/.test(cleaned)) {
    return {
      valid: false,
      error: 'Case number must be 16 digits, for example 1234-5678-9123-4567',
    };
  }

  return { valid: true };
}

/**
 * Validate access code format
 * Accepts: 8 characters (letters/numbers) with optional hyphens
 * Examples: ABCD-EF23, ABCDEF23
 */
function validateAccessCode(accessCode: string): { valid: boolean; error?: string } {
  if (!accessCode || typeof accessCode !== 'string') {
    return { valid: false, error: 'Enter an access code' };
  }

  // Remove hyphens and spaces
  const cleaned = accessCode.replace(/[-\s]/g, '');

  // Check if it's exactly 8 alphanumeric characters
  if (!/^[A-Z0-9]{8}$/i.test(cleaned)) {
    return {
      valid: false,
      error: 'Access code must be 8 characters, for example ABCD-EF23',
    };
  }

  return { valid: true };
}

/**
 * Normalize case number (remove formatting)
 */
function normalizeCaseNumber(caseNumber: string): string {
  return caseNumber.replace(/[-\s]/g, '');
}

/**
 * Normalize access code (remove formatting, uppercase)
 */
function normalizeAccessCode(accessCode: string): string {
  return accessCode.replace(/[-\s]/g, '').toUpperCase();
}

/**
 * Generate mock case data for testing
 */
function generateMockCaseData(caseNumber: string, accessCode: string) {
  return {
    caseNumber,
    accessCode,
    caseId: 'case-' + caseNumber,
    caseType: 'Financial Remedy',
    applicantName: 'Sam Thompson',
    respondentName: 'Morgan Thompson',
    caseStatus: 'In Progress',
    createdDate: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };
}
