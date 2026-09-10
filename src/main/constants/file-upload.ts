export const FileUploadInputFieldNames = {
  file: 'file',
} as const;

export const FILE_SIGNATURES = {
  JPG: 'jpg',
  PNG: 'png',
  PDF: 'pdf',
  ZIP: 'zip',
  UNKNOWN: 'unknown',
} as const;

export const FILE_EXTENSIONS = {
  JPG: '.jpg',
  JPEG: '.jpeg',
  PNG: '.png',
  PDF: '.pdf',
  DOCX: '.docx',
  XLSX: '.xlsx',
} as const;

export const FILE_UPLOAD_ALLOWED_EXTENSION_TYPE_RULES = {
  [FILE_EXTENSIONS.JPG]: {
    signatures: [FILE_SIGNATURES.JPG],
    mimeTypes: ['image/jpeg', 'image/pjpeg'],
  },
  [FILE_EXTENSIONS.JPEG]: {
    signatures: [FILE_SIGNATURES.JPG],
    mimeTypes: ['image/jpeg', 'image/pjpeg'],
  },
  [FILE_EXTENSIONS.PNG]: {
    signatures: [FILE_SIGNATURES.PNG],
    mimeTypes: ['image/png'],
  },
  [FILE_EXTENSIONS.PDF]: {
    signatures: [FILE_SIGNATURES.PDF],
    mimeTypes: ['application/pdf'],
  },
  [FILE_EXTENSIONS.DOCX]: {
    signatures: [FILE_SIGNATURES.ZIP],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/octet-stream',
    ],
  },
  [FILE_EXTENSIONS.XLSX]: {
    signatures: [FILE_SIGNATURES.ZIP],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/octet-stream',
    ],
  },
} as const;

export const FILE_UPLOAD_ALLOWED_EXTENSIONS: readonly string[] = Object.values(FILE_EXTENSIONS);

export const ONE_MEGABYTE_IN_BYTES = 1024 * 1024;

export const FILE_UPLOAD_MAX_SIZE_MEGABYTES = 100;
export const FILE_UPLOAD_MAX_SIZE_BYTES = FILE_UPLOAD_MAX_SIZE_MEGABYTES * ONE_MEGABYTE_IN_BYTES;
export const FILE_UPLOAD_MAX_SIZE_LABEL = `${FILE_UPLOAD_MAX_SIZE_MEGABYTES}MB`;
