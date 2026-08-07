import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { Readable } from 'stream';
import { LoggerInstance } from 'winston';

import { DocumentConversionService } from '../../../../main/app/document/DocumentConversionService';

describe('DocumentConversionService', () => {
  let mockLogger: LoggerInstance;
  let service: DocumentConversionService;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      error: jest.fn(),
      warn: jest.fn(),
    } as unknown as LoggerInstance;

    service = new DocumentConversionService(mockLogger);
  });

  test('does not convert PDF files', async () => {
    const file = buildUploadedFile({
      originalname: 'statement.pdf',
      mimetype: 'application/pdf',
      path: '/tmp/statement.pdf',
      size: 100,
    });

    const result = await service.convertUploadedFileToPdfIfNotPdf(file);

    expect(result).toEqual({
      ...file,
      originalUploadedName: 'statement.pdf',
      cleanupPaths: ['/tmp/statement.pdf'],
    });
  });

  test('converts DOCX content to a local PDF file', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'finrem-doc-conversion-test-'));
    const sourceFilePath = path.join(tempDir, 'statement.docx');
    await fs.writeFile(sourceFilePath, createZip({
      'word/document.xml': '<w:document><w:body><w:p><w:r><w:t>Hello citizen upload</w:t></w:r></w:p></w:body></w:document>',
    }));

    const file = buildUploadedFile({
      originalname: 'statement.docx',
      mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      path: sourceFilePath,
      size: 12,
    });

    try {
      const result = await service.convertUploadedFileToPdfIfNotPdf(file);

      expect(result.originalname).toBe('statement.pdf');
      expect(result.mimetype).toBe('application/pdf');
      expect(result.originalUploadedName).toBe('statement.docx');
      expect(result.cleanupPaths).toEqual([sourceFilePath, result.path]);
      await expect(fs.readFile(result.path)).resolves.toEqual(expect.objectContaining(Buffer.from('%PDF-1.4')));
      await fs.unlink(result.path);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  test('converts XLSX content to a local PDF file', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'finrem-xlsx-conversion-test-'));
    const sourceFilePath = path.join(tempDir, 'schedule.xlsx');
    await fs.writeFile(sourceFilePath, createZip({
      'xl/sharedStrings.xml': '<sst><si><t>Mortgage</t></si><si><t>1000</t></si></sst>',
      'xl/worksheets/sheet1.xml': '<worksheet><sheetData><row><c t="s"><v>0</v></c><c t="s"><v>1</v></c></row></sheetData></worksheet>',
    }));

    const file = buildUploadedFile({
      originalname: 'schedule.xlsx',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      path: sourceFilePath,
      size: 12,
    });

    try {
      const result = await service.convertUploadedFileToPdfIfNotPdf(file);

      expect(result.originalname).toBe('schedule.pdf');
      expect(result.mimetype).toBe('application/pdf');
      await expect(fs.readFile(result.path)).resolves.toEqual(expect.objectContaining(Buffer.from('%PDF-1.4')));
      await fs.unlink(result.path);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  test('rejects when an uploaded file has no readable content', async () => {
    const file = buildUploadedFile({
      originalname: 'statement.xlsx',
      mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      path: '',
      size: 12,
    });

    await expect(service.convertUploadedFileToPdfIfNotPdf(file)).rejects.toThrow(
      'Uploaded file does not have readable content'
    );
  });
});

function buildUploadedFile(overrides: Partial<Express.Multer.File>): Express.Multer.File {
  return {
    fieldname: 'files',
    originalname: 'file.docx',
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: 1,
    buffer: undefined as unknown as Buffer,
    stream: Readable.from([]),
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

function createZip(entries: Record<string, string>): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  Object.entries(entries).forEach(([filename, content]) => {
    const filenameBuffer = Buffer.from(filename);
    const contentBuffer = Buffer.from(content);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt32LE(contentBuffer.length, 18);
    localHeader.writeUInt32LE(contentBuffer.length, 22);
    localHeader.writeUInt16LE(filenameBuffer.length, 26);
    localParts.push(localHeader, filenameBuffer, contentBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt32LE(contentBuffer.length, 20);
    centralHeader.writeUInt32LE(contentBuffer.length, 24);
    centralHeader.writeUInt16LE(filenameBuffer.length, 28);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, filenameBuffer);

    offset += localHeader.length + filenameBuffer.length + contentBuffer.length;
  });

  const centralDirectory = Buffer.concat(centralParts);
  const localFiles = Buffer.concat(localParts);
  const endOfCentralDirectory = Buffer.alloc(22);
  endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
  endOfCentralDirectory.writeUInt16LE(Object.keys(entries).length, 8);
  endOfCentralDirectory.writeUInt16LE(Object.keys(entries).length, 10);
  endOfCentralDirectory.writeUInt32LE(centralDirectory.length, 12);
  endOfCentralDirectory.writeUInt32LE(localFiles.length, 16);

  return Buffer.concat([localFiles, centralDirectory, endOfCentralDirectory]);
}
