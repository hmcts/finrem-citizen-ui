import type { Request } from 'express';

import { CitizenUploadDocument, ListValue } from '../../app/case/definition';
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
