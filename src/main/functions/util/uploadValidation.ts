export const FILE_VALIDATION_ERRORS = {
  INVALID_TYPE: 'Your file must be in jpg, png, pdf, docx, or xlsx format',
  TOO_LARGE: 'Your file must be smaller than 100MB',
  EMPTY: 'The selected file is empty',
  UPLOAD_FAILED: 'The selected file could not be uploaded - try again',
  NO_FILE: 'You must upload at least one file before continuing',
} as const;

const ALLOWED_FILE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.xlsx'];
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100MB

export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.')).toLowerCase();
}

export function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return ALLOWED_FILE_EXTENSIONS.includes(ext);
}

export function isValidFileSize(sizeInBytes: number): boolean {
  return sizeInBytes > 0 && sizeInBytes <= MAX_FILE_SIZE_BYTES;
}

export function validateUploadedFile(files: Express.Multer.File[] | undefined): string | null {
  
  if (!files || files.length === 0) {
    return FILE_VALIDATION_ERRORS.NO_FILE;
  }

  const file = files[0];

  if (file.size === 0) {
    return FILE_VALIDATION_ERRORS.EMPTY;
  }

  if (!isValidFileType(file.originalname)) {
    return FILE_VALIDATION_ERRORS.INVALID_TYPE;
  }

  if (!isValidFileSize(file.size)) {
    return FILE_VALIDATION_ERRORS.TOO_LARGE;
  }

  return null;
}
