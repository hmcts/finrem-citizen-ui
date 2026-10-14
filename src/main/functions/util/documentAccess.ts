import { CaseRole } from '../../app/case/definition';

const DUMMY_BASE_URL = 'http://localhost';
const DOCUMENT_PATH_SEGMENT = 'documents';

type CaseRoleDocumentCollections<T> = {
  applicantDocCollection?: T[];
  respondentDocCollection?: T[];
  fdrApplicantDocCollection?: T[];
  fdrRespondentDocCollection?: T[];
  divorceApplicantDocCollection?: T[];
  divorceRespondentDocCollection?: T[];
  hearingApplicantDocCollection?: T[];
  hearingRespondentDocCollection?: T[];
};

export function getCaseDocumentsByRole<T>(
  caseRole: CaseRole,
  caseData?: CaseRoleDocumentCollections<T>
): T[] {
  var previousDocs: Array<T> = [];
  if (caseRole === CaseRole.APPLICANT) {
    return previousDocs.concat(
      caseData?.applicantDocCollection ?? [], 
      caseData?.fdrApplicantDocCollection ?? [], 
      caseData?.divorceApplicantDocCollection ?? [], 
      caseData?.hearingApplicantDocCollection ?? []
    );
  } else if (caseRole === CaseRole.RESPONDENT) {
    return previousDocs.concat(
      caseData?.respondentDocCollection ?? [], 
      caseData?.fdrRespondentDocCollection ?? [], 
      caseData?.divorceRespondentDocCollection ?? [], 
      caseData?.hearingRespondentDocCollection ?? []
    );
  }

  throw new Error(`Unsupported case role: ${caseRole}`);
}

export function extractDocumentIdFromUrl(documentUrl?: string): string | undefined {
  if (!documentUrl) {
    return;
  }

  try {
    const pathname = new URL(documentUrl, DUMMY_BASE_URL).pathname;
    const pathSegments = pathname.split('/').filter(Boolean);
    const documentSegmentIndex = pathSegments.findIndex(segment => segment === DOCUMENT_PATH_SEGMENT);

    if (documentSegmentIndex >= 0) {
      return pathSegments[documentSegmentIndex + 1];
    }

    return pathSegments[pathSegments.length - 1];
  } catch {
    return;
  }
}
