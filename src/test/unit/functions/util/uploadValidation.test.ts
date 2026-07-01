import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

import {
  FILE_VALIDATION_ERRORS,
  getFileExtension,
  isValidFileSize,
  isValidFileType,
  validateUploadedFile,
} from '../../../../main/functions/util/uploadValidation';

describe('uploadValidation', () => {
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

  describe('FILE_VALIDATION_ERRORS', () => {
    it('should have all required error messages', () => {
      expect(FILE_VALIDATION_ERRORS.INVALID_TYPE).toBe('Your file must be in jpg, png, pdf, docx, or xlsx format');
      expect(FILE_VALIDATION_ERRORS.TOO_LARGE).toBe('Your file must be smaller than 100MB');
      expect(FILE_VALIDATION_ERRORS.EMPTY).toBe('The selected file is empty');
      expect(FILE_VALIDATION_ERRORS.UPLOAD_FAILED).toBe('The selected file could not be uploaded - try again');
      expect(FILE_VALIDATION_ERRORS.NO_FILE).toBe('You must upload at least one file before continuing');
      expect(FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED).toBe('The selected file must not be password protected');
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
      expect(isValidFileSize(100 * 1024 * 1024)).toBe(true); // 100MB exactly
    });

    it('should return false for empty files', () => {
      expect(isValidFileSize(0)).toBe(false);
    });

    it('should return false for files over 100MB', () => {
      expect(isValidFileSize(101 * 1024 * 1024)).toBe(false);
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

    it('should return TOO_LARGE error for files over 100MB', async () => {
      const files = [
        { 
          originalname: 'test.pdf', 
          size: 101 * 1024 * 1024,
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
            path: filePath,
          } as Express.Multer.File,
        ];

        expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED);
      } finally {
        await rm(tempDirectory, { recursive: true, force: true });
      }
    });

    it('should return PASSWORD_PROTECTED error for encrypted Office compound files', async () => {
      const files = [
        {
          originalname: 'document.docx',
          size: 1024,
          buffer: Buffer.concat([
            Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
            Buffer.from('EncryptedPackage', 'utf16le'),
            Buffer.from('EncryptionInfo', 'utf16le'),
          ]),
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED);
    });

    it('should return PASSWORD_PROTECTED error for encrypted OOXML ZIP entries', async () => {
      const files = [
        {
          originalname: 'spreadsheet.xlsx',
          size: 1024,
          buffer: createZipBufferWithCentralDirectory(true),
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED);
    });

    it('should return null for valid PDF files', async () => {
      const files = [
        { originalname: 'test.pdf', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should return null for valid image files', async () => {
      const files = [
        { originalname: 'image.jpg', size: 2048, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should return null for valid document files', async () => {
      const files = [
        {
          originalname: 'document.docx',
          size: 5 * 1024 * 1024,
          buffer: createZipBufferWithCentralDirectory(false),
        } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should return null for valid spreadsheet files', async () => {
      const files = [
        { originalname: 'spreadsheet.xlsx', size: 10 * 1024 * 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should validate only the first file when multiple files provided', async () => {
      const files = [
        { originalname: 'valid.pdf', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
        { originalname: 'invalid.txt', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
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
        { originalname: 'Document.PdF', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should validate JPEG files', async () => {
      const files = [
        { originalname: 'photo.jpeg', size: 2048, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });

    it('should validate PNG files', async () => {
      const files = [
        { originalname: 'screenshot.png', size: 3072, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(await validateUploadedFile(files)).toBeNull();
    });
  });
});
