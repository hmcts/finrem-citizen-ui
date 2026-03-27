/**
 * Environment-specific test data configuration
 */
export const envTestData = {
  // Document URLs for testing (AAT)
  DOCUMENT_URL: process.env.DOCUMENT_URL || 'http://dm-store-aat.service.core-compute-aat.internal/documents/14159821-7a8a-41d6-b46d-91dbb0339867',
  DOCUMENT_BINARY_URL: process.env.DOCUMENT_BINARY_URL || 'http://dm-store-aat.service.core-compute-aat.internal/documents/14159821-7a8a-41d6-b46d-91dbb0339867/binary',
  
  // Organization IDs (AAT PRD)
  ORG_ID_1: 'Y707HZM',  // FinRem-1-Org
  ORG_ID_2: '95V5X7X',  // FinRem-2-Org
  
  // Court details
  EXPRESS_PILOT_COURT_ID: 'FR_s_CFCList_11',
  EXPRESS_PILOT_COURT_NAME: 'Birmingham Civil and Family Justice Centre',
  
  // Default solicitor org
  SOLICITOR_ORG_ID: process.env.SOLICITOR_ORG_ID || 'Y707HZM',
  SOLICITOR_ORG_NAME: process.env.SOLICITOR_ORG_NAME || 'FinRem-1-Org',
  
  // PBA
  PBA_NUMBER: 'PBA0089162',
  PBA_ACCOUNT_NAME: 'Bag End',
};
