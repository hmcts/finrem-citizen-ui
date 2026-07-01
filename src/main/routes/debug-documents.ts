/* eslint-disable @typescript-eslint/no-explicit-any */
/* istanbul ignore file */
import type { Request, Response, Router } from 'express';

import { CaseRole } from '../app/case/definition';
import { oidcMiddleware } from '../middleware/oidc';

export default function setupDebugDocumentsRoute(app: Router): void {
  app.get('/debug/documents', oidcMiddleware, (req: Request, res: Response) => {
    const user = req.session?.user;
    const caseRole = user?.caseRole;
    
    const documentsKey = caseRole === CaseRole.APPLICANT 
      ? 'citizenApplicantDocument' 
      : 'citizenRespondentDocument';
    
    const caseDocuments = (req.session?.caseData?.[documentsKey] as any[]) || [];
    const sessionDocuments = req.session?.documents?.documentDetails || [];
    
    const debugInfo = {
      caseNumber: req.session?.caseNumber,
      caseRole,
      documentsKey,
      caseDocumentsCount: caseDocuments.length,
      sessionDocumentsCount: sessionDocuments.length,
      caseDocuments: caseDocuments.map((doc: any) => ({
        id: doc.id,
        filename: doc.value?.DocumentFileName,
        type: doc.value?.DocumentType,
        isFDR: doc.value?.isFDR,
      })),
      sessionDocuments: sessionDocuments.map((doc: any) => ({
        id: doc.id,
        filename: doc.value?.DocumentFileName,
        type: doc.value?.DocumentType,
      })),
    };
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Document Debug Info</title>
        <style>
          body { font-family: monospace; padding: 20px; background: #f5f5f5; }
          h1 { color: #333; }
          h2 { color: #666; margin-top: 30px; }
          pre { background: white; padding: 15px; border: 1px solid #ddd; overflow-x: auto; }
          .count { color: #0066cc; font-weight: bold; }
          .warning { color: #cc0000; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>📄 Document Debug Information</h1>
        <p><strong>Case Number:</strong> ${debugInfo.caseNumber || 'N/A'}</p>
        <p><strong>Case Role:</strong> ${debugInfo.caseRole || 'N/A'}</p>
        <p><strong>Documents Key:</strong> ${debugInfo.documentsKey}</p>
        
        <h2>Documents in CCD (caseData)</h2>
        <p class="count">Count: ${debugInfo.caseDocumentsCount}</p>
        <pre>${JSON.stringify(debugInfo.caseDocuments, null, 2)}</pre>
        
        <h2>Documents in Session (session.documents)</h2>
        <p class="count">Count: ${debugInfo.sessionDocumentsCount}</p>
        <pre>${JSON.stringify(debugInfo.sessionDocuments, null, 2)}</pre>
        
        ${debugInfo.caseDocumentsCount > debugInfo.sessionDocumentsCount + 2 ? 
          '<p class="warning">⚠️ WARNING: Possible duplicates detected in CCD!</p>' : ''}
        
        <p style="margin-top: 40px;">
          <a href="/upload/previously-uploaded-documents">← Back to Previously Uploaded Documents</a>
        </p>
      </body>
      </html>
    `);
  });
}
