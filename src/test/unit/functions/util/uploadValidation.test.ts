import {
  FILE_VALIDATION_ERRORS,
  getFileExtension,
  isValidFileSize,
  isValidFileType,
  validateUploadedFile,
} from '../../../../main/functions/util/uploadValidation';

describe('uploadValidation', () => {
  describe('FILE_VALIDATION_ERRORS', () => {
    it('should have all required error messages', () => {
      expect(FILE_VALIDATION_ERRORS.INVALID_TYPE).toBe('Your file must be in jpg, png, pdf, docx, or xlsx format');
      expect(FILE_VALIDATION_ERRORS.TOO_LARGE).toBe('Your file must be smaller than 100MB');
      expect(FILE_VALIDATION_ERRORS.EMPTY).toBe('The selected file is empty');
      expect(FILE_VALIDATION_ERRORS.UPLOAD_FAILED).toBe('The selected file could not be uploaded - try again');
      expect(FILE_VALIDATION_ERRORS.NO_FILE).toBe('You must upload at least one file before continuing');
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
    it('should return null when no files provided', () => {
      expect(validateUploadedFile(undefined)).toBeNull();
      expect(validateUploadedFile([])).toBeNull();
    });

    it('should return EMPTY error for zero-byte files', () => {
      const files = [
        { originalname: 'test.pdf', size: 0, buffer: Buffer.from('') } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.EMPTY);
    });

    it('should return INVALID_TYPE error for unsupported file types', () => {
      const files = [
        { originalname: 'test.txt', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should return INVALID_TYPE error for executable files', () => {
      const files = [
        { originalname: 'malware.exe', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should return TOO_LARGE error for files over 100MB', () => {
      const files = [
        { 
          originalname: 'test.pdf', 
          size: 101 * 1024 * 1024,
          buffer: Buffer.from('test')
        } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.TOO_LARGE);
    });

    it('should return null for valid PDF files', () => {
      const files = [
        { originalname: 'test.pdf', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBeNull();
    });

    it('should return null for valid image files', () => {
      const files = [
        { originalname: 'image.jpg', size: 2048, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBeNull();
    });

    it('should return null for valid document files', () => {
      const files = [
        { originalname: 'document.docx', size: 5 * 1024 * 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBeNull();
    });

    it('should return null for valid spreadsheet files', () => {
      const files = [
        { originalname: 'spreadsheet.xlsx', size: 10 * 1024 * 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBeNull();
    });

    it('should validate only the first file when multiple files provided', () => {
      const files = [
        { originalname: 'valid.pdf', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
        { originalname: 'invalid.txt', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBeNull();
    });

    it('should check empty before type validation', () => {
      const files = [
        { originalname: 'test.txt', size: 0, buffer: Buffer.from('') } as Express.Multer.File,
      ];
      // Should return EMPTY, not INVALID_TYPE
      expect(validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.EMPTY);
    });

    it('should check type before size validation', () => {
      const files = [
        { 
          originalname: 'test.txt', 
          size: 200 * 1024 * 1024,
          buffer: Buffer.from('test')
        } as Express.Multer.File,
      ];
      // Should return INVALID_TYPE, not TOO_LARGE
      expect(validateUploadedFile(files)).toBe(FILE_VALIDATION_ERRORS.INVALID_TYPE);
    });

    it('should handle mixed case file extensions', () => {
      const files = [
        { originalname: 'Document.PdF', size: 1024, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBeNull();
    });

    it('should validate JPEG files', () => {
      const files = [
        { originalname: 'photo.jpeg', size: 2048, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBeNull();
    });

    it('should validate PNG files', () => {
      const files = [
        { originalname: 'screenshot.png', size: 3072, buffer: Buffer.from('test') } as Express.Multer.File,
      ];
      expect(validateUploadedFile(files)).toBeNull();
    });
  });
});
