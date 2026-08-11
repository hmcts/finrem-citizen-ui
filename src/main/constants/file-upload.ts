export const FileUploadInputFieldNames = {
  file: 'file',
} as const;

export const FILE_UPLOAD_ALLOWED_EXTENSIONS: readonly string[] = ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.xlsx'];

export const FILE_UPLOAD_MAX_SIZE_BYTES = 100 * 1024 * 1024;
