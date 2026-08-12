export const FileUploadInputFieldNames = {
  file: 'file',
} as const;

export const FILE_UPLOAD_ALLOWED_EXTENSIONS: readonly string[] = ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.xlsx'];

export const ONE_MEGABYTE_IN_BYTES = 1024 * 1024;

export const FILE_UPLOAD_MAX_SIZE_MEGABYTES = 100;
export const FILE_UPLOAD_MAX_SIZE_BYTES = FILE_UPLOAD_MAX_SIZE_MEGABYTES * ONE_MEGABYTE_IN_BYTES;
export const FILE_UPLOAD_MAX_SIZE_LABEL = `${FILE_UPLOAD_MAX_SIZE_MEGABYTES}MB`;
