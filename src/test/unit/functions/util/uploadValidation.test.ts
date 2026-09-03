import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import { FILE_UPLOAD_MAX_SIZE_BYTES } from '../../../../main/constants/file-upload';
import {
  FILE_VALIDATION_ERRORS,
  getFileExtension,
  isValidFileSize,
  isValidFileType,
  validateUploadedFile,
} from '../../../../main/functions/util/uploadValidation';

describe('uploadValidation', () => {
  function createPdfBuffer(): Buffer {
    return Buffer.from('%PDF-1.7\n1 0 obj\n<< /Type /Catalog >>\nendobj');
  }

  function createJpegBuffer(): Buffer {
    return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  }

  function createPngBuffer(): Buffer {
    return Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  }

  function createZipBufferWithCentralDirectory(encrypted: boolean): Buffer {
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);

    const centralDirectoryHeader = Buffer.alloc(46);
    centralDirectoryHeader.writeUInt32LE(0x02014b50, 0);
    centralDirectoryHeader.writeUInt16LE(encrypted ? 1 : 0, 8);

    const endOfCentralDirectory = Buffer.alloc(22);
    endOfCentralDirectory.writeUInt32LE(0x06054b50, 0);
    endOfCentralDirectory.writeUInt16LE(1, 8);
    endOfCentralDirectory.writeUInt16LE(1, 10);
    endOfCentralDirectory.writeUInt32LE(centralDirectoryHeader.length, 12);
    endOfCentralDirectory.writeUInt32LE(localHeader.length, 16);

    return Buffer.concat([localHeader, centralDirectoryHeader, endOfCentralDirectory]);
  }

  function createOoxmlBuffer(type: 'docx' | 'xlsx', encrypted = false): Buffer {
    const markers = type === 'docx'
      ? Buffer.from('[Content_Types].xml word/document.xml word/')
      : Buffer.from('[Content_Types].xml xl/workbook.xml xl/');

    return Buffer.concat([createZipBufferWithCentralDirectory(encrypted), markers]);
  }

  describe('FILE_VALIDATION_ERRORS', () => {
    it('should have all required error messages', () => {
      expect(FILE_VALIDATION_ERRORS.INVALID_TYPE).toBe('Your file must be in jpg, png, pdf, docx, or xlsx format');
      expect(FILE_VALIDATION_ERRORS.TOO_LARGE).toBe('Your file must be smaller than 100MB');
      expect(FILE_VALIDATION_ERRORS.EMPTY).toBe('The selected file is empty');
      expect(FILE_VALIDATION_ERRORS.UPLOAD_FAILED).toBe('The selected file could not be uploaded - try again');
      expect(FILE_VALIDATION_ERRORS.NO_FILE).toBe('You must upload at least one file before continuing');
      expect(FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED).toBe('The selected file is password protected');
    });
  });

  describe('getFileExtension', () => {
    it('should extract file extension in lowercase', () => {
      expect(getFileExtension('document.PDF')).toBe('.pdf');
      expect(getFileExtension('image.JPG')).toBe('.jpg');
      expect(getFileExtension('file.name.with.dots.docx')).toBe('.docx');
    });

    it('should handle files with no extension', () => {
      expect(getFileExtension('noextension')).toBe('noextension');
    });

    it('should handle lowercase extensions', () => {
      expect(getFileExtension('file.pdf')).toBe('.pdf');
      expect(getFileExtension('file.xlsx')).toBe('.xlsx');
    });
  });

  describe('isValidFileType', () => {
    it('should return true for valid file types', () => {
      expect(isValidFileType('file.jpg')).toBe(true);
      expect(isValidFileType('file.jpeg')).toBe(true);
      expect(isValidFileType('file.png')).toBe(true);
      expect(isValidFileType('file.pdf')).toBe(true);
      expect(isValidFileType('file.docx')).toBe(true);
      expect(isValidFileType('file.xlsx')).toBe(true);
    });

    it('should return true for uppercase extensions', () => {
      expect(isValidFileType('file.PDF')).toBe(true);
      expect(isValidFileType('file.DOCX')).toBe(true);
      expect(isValidFileType('FILE.JPEG')).toBe(true);
    });

    it('should return false for invalid file types', () => {
      expect(isValidFileType('file.txt')).toBe(false);
      expect(isValidFileType('file.exe')).toBe(false);
      expect(isValidFileType('file.zip')).toBe(false);
      expect(isValidFileType('file.doc')).toBe(false);
      expect(isValidFileType('file.xls')).toBe(false);
      expect(isValidFileType('file.csv')).toBe(false);
    });

    it('should return false for files with no extension', () => {
      expect(isValidFileType('noextension')).toBe(false);
    });
  });

  describe('isValidFileSize', () => {
    it('should return true for valid file sizes', () => {
      expect(isValidFileSize(1)).toBe(true);
      expect(isValidFileSize(1024)).toBe(true);
      expect(isValidFileSize(50 * 1024 * 1024)).toBe(true); // 50MB
      expect(isValidFileSize(FILE_UPLOAD_MAX_SIZE_BYTES)).toBe(true); // max size exactly
    });

    it('should return false for empty files', () => {
      expect(isValidFileSize(0)).toBe(false);
    });

    it('should return false for files over 100MB', () => {
      expect(isValidFileSize(FILE_UPLOAD_MAX_SIZE_BYTES + 1)).toBe(false);
      expect(isValidFileSize(200 * 1024 * 1024)).toBe(false);
      expect(isValidFileSize(500 * 1024 * 1024)).toBe(false);
    });

    it('should return false for negative sizes', () => {
      expect(isValidFileSize(-1)).toBe(false);
    });
  });

  describe('validateUploadedFile', () => {
    it('should return NO_FILE error when no files provided', async () => {
      expect(await validateUploadedFile(undefined)).toBe(FILE_VALIDATION_ERRORS.NO_FILE);
      expect(await validateUploadedFile([])).toBe(FILE_VALIDATION_ERRORS.NO_FILE);
    });

    it('should return EMPTY error for zero-byte files', async () => {
      const files = [
        { originalname: 'test.pdf', size: 0, buffer: Buffer.from('') } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.EMPTY);
    });

    it('should return INVALID_TYPE error for unsupported file types', async () => {
      const files = [
        { originalname: 'test.txt', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should return INVALID_TYPE error for executable files', async () => {
      const files = [
        { originalname: 'malware.exe', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should check file type before password-protection detection', async () => {
      const files = [
        {
          originalname: 'document.txt',
          size: 1024,
          buffer: createPdfBuffer(),
        } as Express.Multer.File,
      ];

      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should return TOO_LARGE error for files over 100MB', async () => {
      const files = [
        {
          originalname: 'test.pdf',
          size: FILE_UPLOAD_MAX_SIZE_BYTES + 1,
          buffer: Buffer.from('test')
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.TOO_LARGE);
    });

    it('should return PASSWORD_PROTECTED error for encrypted PDF files', async () => {
      const files = [
        {
          originalname: 'test.pdf',
          size: 1024,
          mimetype: 'application/pdf',
          buffer: Buffer.from('%PDF-1.7\n1 0 obj\n<< /Encrypt 2 0 R >>\nendobj'),
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED);
    });

    it('should detect password protected files from disk-backed uploads', async () => {
      const tempDirectory = await mkdtemp(join(tmpdir(), 'upload-validation-'));
      const filePath = join(tempDirectory, 'encrypted.pdf');

      try {
        await writeFile(filePath, Buffer.from('%PDF-1.7\n1 0 obj\n<< /Encrypt 2 0 R >>\nendobj'));

        const files = [
          {
            originalname: 'encrypted.pdf',
            size: 1024,
            mimetype: 'application/pdf',
            path: filePath,
          } as Express.Multer.File,
        ];

        expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED);
      } finally {
        await rm(tempDirectory, { recursive: true, force: true });
      }
    });

    it('should return PASSWORD_PROTECTED error for encrypted OOXML docx files', async () => {
      const files = [
        {
          originalname: 'document.docx',
          size: 1024,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: createOoxmlBuffer('docx', true),
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED);
    });

    it('should return PASSWORD_PROTECTED error for encrypted OOXML docx files read from disk', async () => {
      const tempDirectory = await mkdtemp(join(tmpdir(), 'upload-validation-'));
      const filePath = join(tempDirectory, 'encrypted.docx');

      try {
        const encryptedDocxBuffer = createOoxmlBuffer('docx', true);
        await writeFile(filePath, encryptedDocxBuffer);

        const files = [
          {
            originalname: 'encrypted.docx',
            size: 1024,
            mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            path: filePath,
          } as Express.Multer.File,
        ];

        expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED);
      } finally {
        await rm(tempDirectory, { recursive: true, force: true });
      }
    });

    it('should return PASSWORD_PROTECTED error for encrypted OOXML ZIP entries', async () => {
      const files = [
        {
          originalname: 'spreadsheet.xlsx',
          size: 1024,
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: createOoxmlBuffer('xlsx', true),
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED);
    });

    it('should return null for valid PDF files', async () => {
      const files = [
        { originalname: 'test.pdf', size: 1024, mimetype: 'application/pdf', buffer: createPdfBuffer() } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should return null for valid image files', async () => {
      const files = [
        { originalname: 'image.jpg', size: 2048, mimetype: 'image/jpeg', buffer: createJpegBuffer() } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should return null for valid document files', async () => {
      const files = [
        {
          originalname: 'document.docx',
          size: 5 * 1024 * 1024,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: createOoxmlBuffer('docx', false),
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should return null for valid spreadsheet files', async () => {
      const files = [
        {
          originalname: 'spreadsheet.xlsx',
          size: 10 * 1024 * 1024,
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: createOoxmlBuffer('xlsx', false),
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should validate only the first file when multiple files provided', async () => {
      const files = [
        { originalname: 'valid.pdf', size: 1024, buffer: createPdfBuffer() } as Express.Multer.File,
        { originalname: 'invalid.txt', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should validate only the first file even if a later file is password protected', async () => {
      const files = [
        { originalname: 'valid.pdf', size: 1024, buffer: createPdfBuffer() } as Express.Multer.File,
        {
          originalname: 'encrypted.pdf',
          size: 1024,
          buffer: Buffer.from('%PDF-1.7\n1 0 obj\n<< /Encrypt 2 0 R >>\nendobj'),
        } as Express.Multer.File,
      ];

      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should check empty before type validation', async () => {
      const files = [
        { originalname: 'test.txt', size: 0, buffer: Buffer.from('') } as Express.Multer.File,
      ];
      // Should return EMPTY, not INVALID_TYPE
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.EMPTY);
    });

    it('should check type before size validation', async () => {
      const files = [
        {
          originalname: 'test.txt',
          size: 200 * 1024 * 1024,
          buffer: Buffer.from('test')
        } as Express.Multer.File,
      ];
      // Should return INVALID_TYPE, not TOO_LARGE
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should handle mixed case file extensions', async () => {
      const files = [
        { originalname: 'Document.PdF', size: 1024, buffer: createPdfBuffer() } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should validate JPEG files', async () => {
      const files = [
        { originalname: 'photo.jpeg', size: 2048, buffer: createJpegBuffer() } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should validate PNG files', async () => {
      const files = [
        { originalname: 'screenshot.png', size: 3072, buffer: createPngBuffer() } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should reject executable content renamed as .pdf', async () => {
      const files = [
        { originalname: 'malicious.pdf', size: 2048, mimetype: 'application/pdf', buffer: Buffer.from('MZ\u0000\u0002payload') } as Express.Multer.File,
      ];

      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should reject script content renamed as .jpg', async () => {
      const files = [
        { originalname: 'payload.jpg', size: 2048, mimetype: 'image/jpeg', buffer: Buffer.from('#!/bin/bash\necho hacked') } as Express.Multer.File,
      ];

      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should reject script content renamed as .docx', async () => {
      const files = [
        {
          originalname: 'payload.docx',
          size: 2048,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: Buffer.from('<script>alert(1)</script>'),
        } as Express.Multer.File,
      ];

      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should reject executable content renamed as .xlsx', async () => {
      const files = [
        {
          originalname: 'payload.xlsx',
          size: 2048,
          mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          buffer: Buffer.from('MZ\u0000\u0002payload'),
        } as Express.Multer.File,
      ];

      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should reject mismatch between extension and MIME type', async () => {
      const files = [
        { originalname: 'document.pdf', size: 1024, mimetype: 'image/jpeg', buffer: createPdfBuffer() } as Express.Multer.File,
      ];

      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should reject mismatch between extension and signature for OOXML formats', async () => {
      const files = [
        {
          originalname: 'document.docx',
          size: 1024,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: createPdfBuffer(),
        } as Express.Multer.File,
      ];

      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should return UPLOAD_FAILED when disk-backed PDF cannot be read', async () => {
      const files = [
        {
          originalname: 'test.pdf',
          size: 1024,
          path: '/nonexistent/path/that/does/not/exist.pdf',
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.UPLOAD_FAILED);
    });

    it('should return null for disk-backed PDF without encryption marker', async () => {
      const tempDirectory = await mkdtemp(join(tmpdir(), 'upload-validation-'));
      const filePath = join(tempDirectory, 'plain.pdf');

      try {
        await writeFile(filePath, Buffer.from('%PDF-1.7 this is a plain PDF document with no encryption'));

        const files = [
          {
            originalname: 'plain.pdf',
            size: 1024,
            mimetype: 'application/pdf',
            path: filePath,
          } as Express.Multer.File,
        ];

        expect(await validateUploadedFile(files)).toBeNull();
      } finally {
        await rm(tempDirectory, { recursive: true, force: true });
      }
    });

    it('should return INVALID_TYPE for docx buffer with no ZIP signature', async () => {
      const files = [
        {
          originalname: 'document.docx',
          size: 100,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: Buffer.alloc(100),
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should return INVALID_TYPE for docx with missing OOXML markers', async () => {
      const buffer = Buffer.alloc(100);
      buffer.writeUInt32LE(0x04034b50, 0); // ZIP local header signature

      const files = [
        {
          originalname: 'document.docx',
          size: 100,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer,
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should return INVALID_TYPE for docx with invalid central directory entry signature', async () => {
      const centralDirectory = Buffer.alloc(46);
      centralDirectory.writeUInt32LE(0xdeadbeef, 0); // wrong signature (expected 0x02014b50)

      const eocd = Buffer.alloc(22);
      eocd.writeUInt32LE(0x06054b50, 0);             // EOCD signature
      eocd.writeUInt32LE(centralDirectory.length, 12); // centralDirectorySize = 46
      eocd.writeUInt32LE(0, 16);                      // centralDirectoryOffset = 0

      const buffer = Buffer.concat([centralDirectory, eocd]);

      const files = [
        {
          originalname: 'document.docx',
          size: buffer.length,
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer,
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should detect password protected xlsx from disk path', async () => {
      const tempDirectory = await mkdtemp(join(tmpdir(), 'upload-validation-'));
      const filePath = join(tempDirectory, 'encrypted.xlsx');

      try {
        const zipBuffer = createZipBufferWithCentralDirectory(true);
        const encryptedXlsxBuffer = Buffer.concat([zipBuffer, Buffer.from('[Content_Types].xml xl/workbook.xml xl/')]);
        await writeFile(filePath, encryptedXlsxBuffer);

        const files = [
          {
            originalname: 'encrypted.xlsx',
            size: encryptedXlsxBuffer.length,
            mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            path: filePath,
          } as Express.Multer.File,
        ];

        expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED);
      } finally {
        await rm(tempDirectory, { recursive: true, force: true });
      }
    });

    it('should return null for disk-backed xlsx without encryption', async () => {
      const tempDirectory = await mkdtemp(join(tmpdir(), 'upload-validation-'));
      const filePath = join(tempDirectory, 'plain.xlsx');

      try {
        const plainXlsxBuffer = createOoxmlBuffer('xlsx', false);
        await writeFile(filePath, plainXlsxBuffer);

        const files = [
          {
            originalname: 'plain.xlsx',
            size: plainXlsxBuffer.length,
            mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            path: filePath,
          } as Express.Multer.File,
        ];

        expect(await validateUploadedFile(files)).toBeNull();
      } finally {
        await rm(tempDirectory, { recursive: true, force: true });
      }
    });

    it('should return INVALID_TYPE for docx with neither buffer nor path', async () => {
      const files = [
        {
          originalname: 'document.docx',
          size: 1024,
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });
  });
});
