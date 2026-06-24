import type { Request } from 'express';

import { CitizenUploadDocument, ListValue } from '../../app/case/definition';
import { DOCUMENT_COMBINED_PDF_FORMATS, DOCUMENT_RENAME_FORMATS } from '../../common-constants';
import documentTypes from '../../models/document-types.json';

interface DocumentType {
  id: number;
  label: string;
  value: string;
  aliases: string[];
}

export interface SelectedDocumentTypeDisplay {
  id: string;
  label: string;
  value: string;
  order: number;
}

const typedDocumentTypes: DocumentType[] = documentTypes as DocumentType[];

export function getDocumentLabel(value: string): string {
  const docType = typedDocumentTypes.find(dt => dt.value === value);
  return docType?.label || '';
}

export function toDocumentTypeKey(documentType: string): string {
  return documentType
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/\//g, '-')
    .replace(/[():,]/g, '')
    .replace(/-+/g, '-');
}

export function shouldAutoRename(documentTypeValue: string): boolean {
  return documentTypeValue in DOCUMENT_RENAME_FORMATS;
}

export function getDocumentRenameFormat(documentTypeValue: string): string {
  return DOCUMENT_RENAME_FORMATS[documentTypeValue] || '';
}

export function shouldCombineIntoPDF(documentTypeValue: string): boolean {
  return documentTypeValue in DOCUMENT_COMBINED_PDF_FORMATS;
}

export function getCombinedPDFFormat(documentTypeValue: string): string {
  return DOCUMENT_COMBINED_PDF_FORMATS[documentTypeValue] || '';
}

export function getSelectedDocumentTypesForDisplay(req: Request): SelectedDocumentTypeDisplay[] {
  const documentDetails = req.session?.DocumentSelection?.documentDetails;
  
  if (!documentDetails || documentDetails.length === 0) {
    return [];
  }
  
  return documentDetails.map((doc: ListValue<Partial<CitizenUploadDocument> | null>, index: number) => ({
    id: doc.id || '',
    label: getDocumentLabel(doc.value?.DocumentType || ''),
    value: doc.value?.DocumentType || '',
    order: index,
  }));
}

export function generateRenamedFilename(documentTypeValue: string, originalFilename: string, caseUserName?: string): string {
  const format = getDocumentRenameFormat(documentTypeValue);
  if (!format) {
    return originalFilename;
  }

  // Extract file extension
  const extension = originalFilename.substring(originalFilename.lastIndexOf('.'));

  // Generate date string DD-MM-YYYY
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}-${month}-${year}`;

  // Format: UserName-DocumentType-DD-MM-YYYY.ext
  const userName = caseUserName || 'UserName';
  return `${userName}-${format}-${dateStr}${extension}`;
}
