import type { Request } from 'express';

import { CitizenUploadDocument, ListValue } from '../../app/case/definition';
import { DOCUMENT_COMBINED_PDF_FORMATS, DOCUMENT_RENAME_FORMATS } from '../../constants';
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

export function generateRenamedFilename(documentTypeValue: string, originalFilename: string, caseUserName?: string, preview=false, existingFilenames: string[] = []): string {
  const format = getDocumentRenameFormat(documentTypeValue);
  if (!format) {
    return originalFilename;
  }

  const lastDotIndex = originalFilename.lastIndexOf('.');
  const extension = lastDotIndex !== -1
    ? originalFilename.substring(lastDotIndex)
    : '';

  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const dateStr = `${day}-${month}-${year}`;

  const userName = (caseUserName || 'UserName').replace(/\s+/g, '');
  if (preview) {
    return `${userName}-${format}-DD-MM-YYYY`;
  }

  let baseFilename = `${userName}-${format}-${dateStr}`;
  let finalFilename = `${baseFilename}${extension}`;

  let counter = 1;
  while (existingFilenames.includes(finalFilename)) {
    finalFilename = `${baseFilename}-${counter}${extension}`;
    counter++;
  }

  return finalFilename;
}

export function makeFilenameUnique(baseFilename: string, existingFilenames: ReadonlySet<string>, now: Date = new Date()): string {
  const dotIndex = baseFilename.lastIndexOf('.');

  const stem = dotIndex === -1
    ? baseFilename
    : baseFilename.slice(0, dotIndex);

  const extension = dotIndex === -1
    ? ''
    : baseFilename.slice(dotIndex);

  //match previously numbered files, regardless of their timestamp.
  //also recognise legacy filenames without parentheses.
  const pattern = new RegExp(
    `^${escapeRegExp(stem)} \\d{2}-\\d{2} (?:\\((\\d+)\\)|(\\d+))${escapeRegExp(extension)}$`
  );

  let hasMatchingFilename = existingFilenames.has(baseFilename);
  let highestSuffix = 0;

  for (const filename of existingFilenames) {
    const match = filename.match(pattern);

    if (match) {
      hasMatchingFilename = true;

      highestSuffix = Math.max(
        highestSuffix,
        Number(match[1] ?? match[2])
      );
    }
  }

  //keep the original naming convention for the first file.
  if (!hasMatchingFilename) {
    return baseFilename;
  }

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timestamp = `${hours}-${minutes}`;

  const nextSuffix = highestSuffix + 1;

  return `${stem} ${timestamp} (${nextSuffix})${extension}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
