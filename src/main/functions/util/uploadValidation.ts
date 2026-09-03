import { createReadStream } from 'fs';
import { open } from 'fs/promises';
import { LoggerInstance } from 'winston';

import {
  FILE_UPLOAD_ALLOWED_EXTENSIONS,
  FILE_UPLOAD_ALLOWED_TYPE_RULES,
  FILE_UPLOAD_MAX_SIZE_BYTES,
  FILE_UPLOAD_MAX_SIZE_LABEL,
} from '../../constants/file-upload';

export const FILE_VALIDATION_ERRORS = {
  INVALID_TYPE: 'Your file must be in jpg, png, pdf, docx, or xlsx format',
  TOO_LARGE: `Your file must be smaller than ${FILE_UPLOAD_MAX_SIZE_LABEL}`,
  EMPTY: 'The selected file is empty',
  UPLOAD_FAILED: 'The selected file could not be uploaded - try again',
  NO_FILE: 'You must upload at least one file before continuing',
  PASSWORD_PROTECTED: 'The selected file is password protected',
} as const;

const logger: LoggerInstance = console as unknown as LoggerInstance;

const PDF_ENCRYPTION_MARKER = Buffer.from('/Encrypt');
const COMPOUND_FILE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const OFFICE_ENCRYPTION_MARKERS = [
  Buffer.from('EncryptedPackage', 'utf16le'),
  Buffer.from('EncryptionInfo', 'utf16le'),
];
const ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE = 0x02014b50;
const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_SPANNED_ARCHIVE_SIGNATURE = 0x08074b50;
const ZIP_END_OF_CENTRAL_DIRECTORY_MIN_SIZE = 22;
const ZIP_MAX_COMMENT_SIZE = 0xffff;
const ZIP_CENTRAL_DIRECTORY_FIXED_HEADER_SIZE = 46;
const ZIP_ENCRYPTED_FLAG = 0x1;
const JPEG_SIGNATURE = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PDF_SIGNATURE = Buffer.from('%PDF-');
const OOXML_CONTENT_TYPES_MARKER = Buffer.from('[Content_Types].xml');
const OOXML_DOCX_MARKER = Buffer.from('word/');
const OOXML_XLSX_MARKER = Buffer.from('xl/');
const PDF_EXTENSION = '.pdf';
const DOCX_EXTENSION = '.docx';
const XLSX_EXTENSION = '.xlsx';

type DetectedFileSignature = 'jpg' | 'png' | 'pdf' | 'zip' | 'unknown';

export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.')).toLowerCase();
}

export function isValidFileType(filename: string): boolean {
  const ext = getFileExtension(filename);
  return FILE_UPLOAD_ALLOWED_EXTENSIONS.includes(ext);
}

export function isValidFileSize(sizeInBytes: number): boolean {
  return sizeInBytes > 0 && sizeInBytes <= FILE_UPLOAD_MAX_SIZE_BYTES;
}

export async function validateUploadedFile(files: Express.Multer.File[] | undefined): Promise<string | null> {
  if (!files || files.length === 0) {
    return FILE_VALIDATION_ERRORS.NO_FILE;
  }

  const file = files[0];

  if (file.size === 0) {
    return FILE_VALIDATION_ERRORS.EMPTY;
  }

  if (!isValidFileType(file.originalname)) {
    logger.info('Upload rejected: unsupported file extension', {
      filename: file.originalname,
      extension: getFileExtension(file.originalname),
    });
    return FILE_VALIDATION_ERRORS.INVALID_TYPE;
  }

  if (!isValidFileSize(file.size)) {
    return FILE_VALIDATION_ERRORS.TOO_LARGE;
  }

  try {
    if (!(await isConsistentWithExpectedType(file))) {
      return FILE_VALIDATION_ERRORS.INVALID_TYPE;
    }
  } catch {
    return FILE_VALIDATION_ERRORS.UPLOAD_FAILED;
  }

  try {
    if (await isPasswordProtectedFile(file)) {
      return FILE_VALIDATION_ERRORS.PASSWORD_PROTECTED;
    }
  } catch {
    return FILE_VALIDATION_ERRORS.UPLOAD_FAILED;
  }

  return null;
}

async function isConsistentWithExpectedType(file: Express.Multer.File): Promise<boolean> {
  const fileExtension = getFileExtension(file.originalname);
  if (!mimeTypeMatchesExtension(fileExtension, file.mimetype)) {
    logger.info('Upload rejected: MIME type does not match extension', {
      filename: file.originalname,
      extension: fileExtension,
      mimeType: file.mimetype,
    });

    return false;
  }

  const detectedFileSignature = await detectFileSignature(file);
  if (!signatureMatchesExtension(fileExtension, detectedFileSignature)) {
    logger.info('Upload rejected: file signature does not match extension', {
      filename: file.originalname,
      extension: fileExtension,
      detectedFileSignature,
    });

    return false;
  }

  if (fileExtension === DOCX_EXTENSION) {
    const hasDocxMarkers = await fileContainsAllMarkers(file, [OOXML_CONTENT_TYPES_MARKER, OOXML_DOCX_MARKER]);
    if (!hasDocxMarkers) {
      logger.info('Upload rejected: docx file is missing expected OOXML markers', {
        filename: file.originalname,
      });
    }

    return hasDocxMarkers;
  }

  if (fileExtension === XLSX_EXTENSION) {
    const hasXlsxMarkers = await fileContainsAllMarkers(file, [OOXML_CONTENT_TYPES_MARKER, OOXML_XLSX_MARKER]);
    if (!hasXlsxMarkers) {
      logger.info('Upload rejected: xlsx file is missing expected OOXML markers', {
        filename: file.originalname,
      });
    }

    return hasXlsxMarkers;
  }

  return true;
}

function mimeTypeMatchesExtension(extension: string, mimeType?: string): boolean {
  if (!mimeType) {
    return true;
  }

  const rules = FILE_UPLOAD_ALLOWED_TYPE_RULES[extension as keyof typeof FILE_UPLOAD_ALLOWED_TYPE_RULES];
  if (!rules) {
    return false;
  }

  return (rules.mimeTypes as readonly string[]).includes(mimeType.toLowerCase());
}

async function detectFileSignature(file: Express.Multer.File): Promise<DetectedFileSignature> {
  const header = await readFileRange(file, 0, 8);

  if (bufferStartsWith(header, JPEG_SIGNATURE)) {
    return 'jpg';
  }

  if (bufferStartsWith(header, PNG_SIGNATURE)) {
    return 'png';
  }

  if (bufferStartsWith(header, PDF_SIGNATURE)) {
    return 'pdf';
  }

  if (header.length >= 4) {
    const zipSignature = header.readUInt32LE(0);
    if (
      zipSignature === ZIP_LOCAL_FILE_HEADER_SIGNATURE
      || zipSignature === ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE
      || zipSignature === ZIP_SPANNED_ARCHIVE_SIGNATURE
    ) {
      return 'zip';
    }
  }

  return 'unknown';
}

function signatureMatchesExtension(extension: string, signature: DetectedFileSignature): boolean {
  const fileSignatureRule = FILE_UPLOAD_ALLOWED_TYPE_RULES[extension as keyof typeof FILE_UPLOAD_ALLOWED_TYPE_RULES];

  if (!fileSignatureRule) {
    return false;
  }

  return (fileSignatureRule.signatures as readonly string[]).includes(signature);
}

async function isPasswordProtectedFile(file: Express.Multer.File): Promise<boolean> {
  const ext = getFileExtension(file.originalname);

  if (ext === PDF_EXTENSION) {
    return fileContainsAllMarkers(file, [PDF_ENCRYPTION_MARKER]);
  }

  if (ext === DOCX_EXTENSION || ext === XLSX_EXTENSION) {
    return isPasswordProtectedOfficeFile(file);
  }

  return false;
}

async function isPasswordProtectedOfficeFile(file: Express.Multer.File): Promise<boolean> {
  const header = await readFileRange(file, 0, COMPOUND_FILE_SIGNATURE.length);

  if (bufferStartsWith(header, COMPOUND_FILE_SIGNATURE)) {
    return fileContainsAllMarkers(file, OFFICE_ENCRYPTION_MARKERS);
  }

  return zipHasEncryptedEntry(file);
}

function bufferStartsWith(buffer: Buffer, signature: Buffer): boolean {
  return buffer.length >= signature.length && buffer.subarray(0, signature.length).equals(signature);
}

async function fileContainsAllMarkers(file: Express.Multer.File, markers: Buffer[]): Promise<boolean> {
  if (markers.length === 0) {
    return true;
  }

  if (file.buffer) {
    return markers.every(marker => file.buffer.includes(marker));
  }

  if (!file.path) {
    return false;
  }

  return new Promise((resolve, reject) => {
    const stream = createReadStream(file.path);
    const foundMarkers = new Set<number>();
    const maxMarkerLength = Math.max(...markers.map(marker => marker.length));
    let previous = Buffer.alloc(0);
    let settled = false;

    const settle = (value: boolean): void => {
      if (!settled) {
        settled = true;
        resolve(value);
      }
    };

    const settleWithError = (error: Error): void => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    stream.on('data', (chunk: Buffer | string) => {
      const chunkBuffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      const current = Buffer.concat([previous, chunkBuffer]);

      markers.forEach((marker, index) => {
        if (!foundMarkers.has(index) && current.includes(marker)) {
          foundMarkers.add(index);
        }
      });

      if (foundMarkers.size === markers.length) {
        settle(true);
        stream.destroy();
        return;
      }

      previous = current.subarray(Math.max(0, current.length - maxMarkerLength + 1));
    });

    stream.on('end', () => settle(false));
    stream.on('error', settleWithError);
  });
}

async function zipHasEncryptedEntry(file: Express.Multer.File): Promise<boolean> {
  const fileSize = getInspectableFileSize(file);

  if (fileSize < ZIP_END_OF_CENTRAL_DIRECTORY_MIN_SIZE) {
    return false;
  }

  const tail = await readFileRange(
    file,
    Math.max(0, fileSize - ZIP_END_OF_CENTRAL_DIRECTORY_MIN_SIZE - ZIP_MAX_COMMENT_SIZE),
    ZIP_END_OF_CENTRAL_DIRECTORY_MIN_SIZE + ZIP_MAX_COMMENT_SIZE
  );
  const eocdOffset = findLastSignature(tail, ZIP_END_OF_CENTRAL_DIRECTORY_SIGNATURE);

  if (eocdOffset === -1 || eocdOffset + ZIP_END_OF_CENTRAL_DIRECTORY_MIN_SIZE > tail.length) {
    return false;
  }

  const centralDirectorySize = tail.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = tail.readUInt32LE(eocdOffset + 16);

  if (centralDirectorySize === 0 || centralDirectoryOffset + centralDirectorySize > fileSize) {
    return false;
  }

  return centralDirectoryHasEncryptedEntry(file, centralDirectoryOffset, centralDirectorySize);
}

function findLastSignature(buffer: Buffer, signature: number): number {
  for (let index = buffer.length - 4; index >= 0; index--) {
    if (buffer.readUInt32LE(index) === signature) {
      return index;
    }
  }

  return -1;
}

async function centralDirectoryHasEncryptedEntry(
  file: Express.Multer.File,
  centralDirectoryOffset: number,
  centralDirectorySize: number
): Promise<boolean> {
  if (file.buffer) {
    return centralDirectoryBufferHasEncryptedEntry(file.buffer, centralDirectoryOffset, centralDirectorySize);
  }

  if (!file.path) {
    return false;
  }

  return centralDirectoryPathHasEncryptedEntry(file.path, centralDirectoryOffset, centralDirectorySize);
}

function centralDirectoryBufferHasEncryptedEntry(
  buffer: Buffer,
  centralDirectoryOffset: number,
  centralDirectorySize: number
): boolean {
  let position = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;

  while (position + ZIP_CENTRAL_DIRECTORY_FIXED_HEADER_SIZE <= end) {
    if (buffer.readUInt32LE(position) !== ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE) {
      return false;
    }

    if ((buffer.readUInt16LE(position + 8) & ZIP_ENCRYPTED_FLAG) !== 0) {
      return true;
    }

    position += getNextCentralDirectoryPosition(buffer, position);
  }

  return false;
}

async function centralDirectoryPathHasEncryptedEntry(
  filePath: string,
  centralDirectoryOffset: number,
  centralDirectorySize: number
): Promise<boolean> {
  const handle = await open(filePath, 'r');
  let position = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;
  const fixedHeader = Buffer.alloc(ZIP_CENTRAL_DIRECTORY_FIXED_HEADER_SIZE);

  try {
    while (position + ZIP_CENTRAL_DIRECTORY_FIXED_HEADER_SIZE <= end) {
      const { bytesRead } = await handle.read(
        fixedHeader,
        0,
        ZIP_CENTRAL_DIRECTORY_FIXED_HEADER_SIZE,
        position
      );

      if (bytesRead < ZIP_CENTRAL_DIRECTORY_FIXED_HEADER_SIZE) {
        return false;
      }

      if (fixedHeader.readUInt32LE(0) !== ZIP_CENTRAL_DIRECTORY_HEADER_SIGNATURE) {
        return false;
      }

      if ((fixedHeader.readUInt16LE(8) & ZIP_ENCRYPTED_FLAG) !== 0) {
        return true;
      }

      position += getNextCentralDirectoryPosition(fixedHeader, 0);
    }

    return false;
  } finally {
    await handle.close();
  }
}

function getNextCentralDirectoryPosition(buffer: Buffer, position: number): number {
  return ZIP_CENTRAL_DIRECTORY_FIXED_HEADER_SIZE
    + buffer.readUInt16LE(position + 28)
    + buffer.readUInt16LE(position + 30)
    + buffer.readUInt16LE(position + 32);
}

function getInspectableFileSize(file: Express.Multer.File): number {
  return file.buffer?.length ?? file.size ?? 0;
}

async function readFileRange(file: Express.Multer.File, start: number, length: number): Promise<Buffer> {
  if (length <= 0) {
    return Buffer.alloc(0);
  }

  if (file.buffer) {
    return file.buffer.subarray(start, Math.min(file.buffer.length, start + length));
  }

  if (!file.path) {
    return Buffer.alloc(0);
  }

  const handle = await open(file.path, 'r');
  const buffer = Buffer.alloc(length);

  try {
    const { bytesRead } = await handle.read(buffer, 0, length, start);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}
