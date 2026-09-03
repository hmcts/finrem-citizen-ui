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

export const FILE_UPLOAD_ALLOWED_TYPE_RULES = {
  '.jpg': {
    signatures: [FILE_SIGNATURES.JPG],
    mimeTypes: ['image/jpeg', 'image/pjpeg'],
  },
  '.jpeg': {
    signatures: [FILE_SIGNATURES.JPG],
    mimeTypes: ['image/jpeg', 'image/pjpeg'],
  },
  '.png': {
    signatures: [FILE_SIGNATURES.PNG],
    mimeTypes: ['image/png'],
  },
  '.pdf': {
    signatures: [FILE_SIGNATURES.PDF],
    mimeTypes: ['application/pdf'],
  },
  '.docx': {
    signatures: [FILE_SIGNATURES.ZIP],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/octet-stream',
    ],
  },
  '.xlsx': {
    signatures: [FILE_SIGNATURES.ZIP],
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/octet-stream',
    ],
  },
} as const;

export const FILE_UPLOAD_ALLOWED_EXTENSIONS: readonly string[] = Object.keys(FILE_UPLOAD_ALLOWED_TYPE_RULES);

export const ONE_MEGABYTE_IN_BYTES = 1024 * 1024;

export const FILE_UPLOAD_MAX_SIZE_MEGABYTES = 100;
export const FILE_UPLOAD_MAX_SIZE_BYTES = FILE_UPLOAD_MAX_SIZE_MEGABYTES * ONE_MEGABYTE_IN_BYTES;
export const FILE_UPLOAD_MAX_SIZE_LABEL = `${FILE_UPLOAD_MAX_SIZE_MEGABYTES}MB`;
