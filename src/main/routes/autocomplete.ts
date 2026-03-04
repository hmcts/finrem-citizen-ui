import { Application, Request, Response } from 'express';

import documentTypes from '../models/document-types.json';

interface DocumentType {
  label: string;
  value: string;
  aliases: string[];
}

const typedDocumentTypes: DocumentType[] = documentTypes as DocumentType[];

function searchDocumentTypes(query: string): DocumentType[] {
  if (!query || query.trim().length === 0) {
    return typedDocumentTypes;
  }

  const searchTerm = query.toLowerCase().trim();

  const matches = typedDocumentTypes.filter(docType => {
    const labelMatch = docType.label.toLowerCase().includes(searchTerm);
    const aliasMatch = docType.aliases.some(alias => alias.toLowerCase().includes(searchTerm));
    return labelMatch || aliasMatch;
  });

  if (matches.length === 0) {
    const otherDocument = typedDocumentTypes.find(dt => dt.value === 'other-document');
    return otherDocument ? [otherDocument] : [];
  }

  return matches;
}

export default (app: Application): void => {
  app.get('/autocomplete', (req: Request, res: Response) => {
    const query = req.query.q as string || '';
    const results = searchDocumentTypes(query);

    res.json(
      results.map(docType => ({
        label: docType.label,
        value: docType.value,
      }))
    );
  });
};
