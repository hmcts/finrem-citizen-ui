import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { LoggerInstance } from 'winston';
import { deflateSync, inflateRawSync, inflateSync } from 'zlib';

export type ConvertedUploadedFile = Express.Multer.File & {
  originalUploadedName?: string;
  cleanupPaths?: string[];
  convertedFilePath?: string;
};

type ZipEntry = {
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

type PngImage = {
  width: number;
  height: number;
  rgbData: Buffer;
};

export class DocumentConversionService {
  constructor(private readonly logger: LoggerInstance) {
  }

  public async convertUploadedFileToPdfIfNotPdf(file: Express.Multer.File): Promise<ConvertedUploadedFile> {
    const cleanupPaths = this.getCleanupPaths(file);
    const originalUploadedName = file.originalname;

    if (path.extname(file.originalname).toLowerCase() === '.pdf') {
      return {
        ...file,
        originalUploadedName,
        cleanupPaths,
      };
    }

    const convertedFilePath = path.join(tmpdir(), `${randomUUID()}.pdf`);

    try {
      const source = await this.readUploadedFile(file);
      const pdf = convertFileToPdf(file.originalname, source);
      await fs.writeFile(convertedFilePath, pdf);
      const stats = await fs.stat(convertedFilePath);
      const outputName = `${path.parse(file.originalname).name}.pdf`;

      return {
        ...file,
        originalname: outputName,
        mimetype: 'application/pdf',
        destination: tmpdir(),
        filename: path.basename(convertedFilePath),
        path: convertedFilePath,
        size: stats.size,
        originalUploadedName,
        cleanupPaths: [...cleanupPaths, convertedFilePath],
        convertedFilePath,
      };
    } catch (error) {
      this.logger.error('Error converting document to PDF', {
        originalFilename: file.originalname,
        error,
      });
      await this.removeTemporaryFile(convertedFilePath);
      throw error;
    }
  }

  public async cleanupTemporaryConversionFiles(files: ConvertedUploadedFile[]): Promise<void> {
    const convertedPaths = files
      .map(file => file.convertedFilePath)
      .filter((filePath): filePath is string => !!filePath);

    await Promise.all(convertedPaths.map(filePath => this.removeTemporaryFile(filePath)));
  }

  private async readUploadedFile(file: Express.Multer.File): Promise<Buffer> {
    if (file.buffer) {
      return file.buffer;
    }

    if (file.path) {
      return fs.readFile(file.path);
    }

    throw new Error('Uploaded file does not have readable content');
  }

  private getCleanupPaths(file: Express.Multer.File): string[] {
    return file.path ? [file.path] : [];
  }

  private async removeTemporaryFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return;
      }

      this.logger.warn('Failed to remove temporary converted file', {
        filePath,
        error,
      });
    }
  }
}

function convertFileToPdf(filename: string, source: Buffer): Buffer {
  switch (path.extname(filename).toLowerCase()) {
    case '.jpg':
    case '.jpeg':
      return createJpegPdf(source);
    case '.png':
      return createPngPdf(source);
    case '.docx':
      return createTextPdf(path.basename(filename), extractDocxLines(source));
    case '.xlsx':
      return createTextPdf(path.basename(filename), extractXlsxLines(source));
    default:
      throw new Error(`Unsupported file type for PDF conversion: ${filename}`);
  }
}

function createJpegPdf(source: Buffer): Buffer {
  const { width, height } = getJpegDimensions(source);
  const imageObject = Buffer.concat([
    Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${source.length} >>\nstream\n`),
    source,
    Buffer.from('\nendstream'),
  ]);

  return createImagePdf(imageObject, width, height);
}

function createPngPdf(source: Buffer): Buffer {
  const png = parsePng(source);
  const imageObject = Buffer.concat([
    Buffer.from(`<< /Type /XObject /Subtype /Image /Width ${png.width} /Height ${png.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${png.rgbData.length} >>\nstream\n`),
    png.rgbData,
    Buffer.from('\nendstream'),
  ]);

  return createImagePdf(imageObject, png.width, png.height);
}

function createImagePdf(imageObject: Buffer, imageWidth: number, imageHeight: number): Buffer {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 36;
  const scale = Math.min((pageWidth - margin * 2) / imageWidth, (pageHeight - margin * 2) / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const x = (pageWidth - drawWidth) / 2;
  const y = (pageHeight - drawHeight) / 2;
  const objects: (string | Buffer)[] = [];
  const addObject = (object: string | Buffer): number => objects.push(object);
  const imageObjectNumber = addObject(imageObject);
  const content = `q ${drawWidth.toFixed(2)} 0 0 ${drawHeight.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /Im1 Do Q`;
  const contentObjectNumber = addObject(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  const pagesObjectNumber = addObject('');
  const pageObjectNumber = addObject(`<< /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im1 ${imageObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`);
  objects[pagesObjectNumber - 1] = `<< /Type /Pages /Kids [${pageObjectNumber} 0 R] /Count 1 >>`;
  const catalogObjectNumber = addObject(`<< /Type /Catalog /Pages ${pagesObjectNumber} 0 R >>`);

  return buildPdf(objects, catalogObjectNumber);
}

function createTextPdf(title: string, lines: string[]): Buffer {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const fontSize = 10;
  const lineHeight = 14;
  const maxLinesPerPage = 52;
  const wrappedLines = [
    title,
    '',
    ...lines.flatMap(line => wrapLine(line, 92)),
  ];
  const pages: string[][] = [];

  for (let index = 0; index < wrappedLines.length; index += maxLinesPerPage) {
    pages.push(wrappedLines.slice(index, index + maxLinesPerPage));
  }

  if (pages.length === 0) {
    pages.push(['']);
  }

  const objects: (string | Buffer)[] = [];
  const addObject = (object: string | Buffer): number => objects.push(object);
  const fontObjectNumber = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pagesObjectNumber = addObject('');
  const pageObjectNumbers: number[] = [];

  pages.forEach(pageLines => {
    const content = [
      `BT /F1 ${fontSize} Tf 50 790 Td ${lineHeight} TL`,
      ...pageLines.map(line => `(${escapePdfText(line)}) Tj T*`),
      'ET',
    ].join('\n');
    const contentObjectNumber = addObject(`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
    pageObjectNumbers.push(addObject(`<< /Type /Page /Parent ${pagesObjectNumber} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`));
  });

  objects[pagesObjectNumber - 1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map(objectNumber => `${objectNumber} 0 R`).join(' ')}] /Count ${pageObjectNumbers.length} >>`;
  const catalogObjectNumber = addObject(`<< /Type /Catalog /Pages ${pagesObjectNumber} 0 R >>`);

  return buildPdf(objects, catalogObjectNumber);
}

function buildPdf(objects: (string | Buffer)[], rootObjectNumber: number): Buffer {
  const parts: Buffer[] = [Buffer.from('%PDF-1.4\n')];
  const offsets = [0];
  let byteOffset = parts[0].length;

  objects.forEach((object, index) => {
    const objectHeader = Buffer.from(`${index + 1} 0 obj\n`);
    const objectBody = Buffer.isBuffer(object) ? object : Buffer.from(object);
    const objectFooter = Buffer.from('\nendobj\n');
    offsets.push(byteOffset);
    parts.push(objectHeader, objectBody, objectFooter);
    byteOffset += objectHeader.length + objectBody.length + objectFooter.length;
  });

  const xrefOffset = byteOffset;
  const xref = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${objects.length + 1} /Root ${rootObjectNumber} 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
    '',
  ].join('\n');

  parts.push(Buffer.from(xref));

  return Buffer.concat(parts);
}

function getJpegDimensions(source: Buffer): { width: number; height: number } {
  if (source.readUInt16BE(0) !== 0xffd8) {
    throw new Error('Invalid JPEG file');
  }

  let offset = 2;
  while (offset < source.length) {
    if (source[offset] !== 0xff) {
      offset++;
      continue;
    }

    const marker = source[offset + 1];
    offset += 2;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const length = source.readUInt16BE(offset);
    if (marker >= 0xc0 && marker <= 0xc3) {
      return {
        height: source.readUInt16BE(offset + 3),
        width: source.readUInt16BE(offset + 5),
      };
    }

    offset += length;
  }

  throw new Error('Unable to read JPEG dimensions');
}

function parsePng(source: Buffer): PngImage {
  const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!source.subarray(0, pngSignature.length).equals(pngSignature)) {
    throw new Error('Invalid PNG file');
  }

  let offset = pngSignature.length;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlaceMethod = 0;
  const idatChunks: Buffer[] = [];
  let palette: Buffer | undefined;

  while (offset < source.length) {
    const length = source.readUInt32BE(offset);
    const type = source.subarray(offset + 4, offset + 8).toString('ascii');
    const data = source.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      interlaceMethod = data[12];
    } else if (type === 'PLTE') {
      palette = data;
    } else if (type === 'IDAT') {
      idatChunks.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (bitDepth !== 8 || interlaceMethod !== 0) {
    throw new Error('Only 8-bit non-interlaced PNG files can be converted');
  }

  const inflated = inflateSync(Buffer.concat(idatChunks));
  const rgb = unfilterPngRows(inflated, width, height, colorType, palette);

  return {
    width,
    height,
    rgbData: deflateSync(rgb),
  };
}

function unfilterPngRows(
  inflated: Buffer,
  width: number,
  height: number,
  colorType: number,
  palette: Buffer | undefined
): Buffer {
  const bytesPerPixel = getPngBytesPerPixel(colorType);
  const rowLength = width * bytesPerPixel;
  const rgb = Buffer.alloc(width * height * 3);
  let inflatedOffset = 0;
  let rgbOffset = 0;
  let previousRow = Buffer.alloc(rowLength);

  for (let rowIndex = 0; rowIndex < height; rowIndex++) {
    const filterType = inflated[inflatedOffset++];
    const row = Buffer.alloc(rowLength);

    for (let index = 0; index < rowLength; index++) {
      const value = inflated[inflatedOffset++];
      const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
      const up = previousRow[index] ?? 0;
      const upperLeft = index >= bytesPerPixel ? previousRow[index - bytesPerPixel] : 0;
      row[index] = (value + pngFilterValue(filterType, left, up, upperLeft)) & 0xff;
    }

    rgbOffset = copyPngRowToRgb(row, width, colorType, palette, rgb, rgbOffset);
    previousRow = row;
  }

  return rgb;
}

function getPngBytesPerPixel(colorType: number): number {
  switch (colorType) {
    case 0:
    case 3:
      return 1;
    case 2:
      return 3;
    case 4:
      return 2;
    case 6:
      return 4;
    default:
      throw new Error('Unsupported PNG colour type');
  }
}

function pngFilterValue(filterType: number, left: number, up: number, upperLeft: number): number {
  switch (filterType) {
    case 0:
      return 0;
    case 1:
      return left;
    case 2:
      return up;
    case 3:
      return Math.floor((left + up) / 2);
    case 4:
      return paethPredictor(left, up, upperLeft);
    default:
      throw new Error('Unsupported PNG filter type');
  }
}

function paethPredictor(left: number, up: number, upperLeft: number): number {
  const estimate = left + up - upperLeft;
  const leftDistance = Math.abs(estimate - left);
  const upDistance = Math.abs(estimate - up);
  const upperLeftDistance = Math.abs(estimate - upperLeft);

  if (leftDistance <= upDistance && leftDistance <= upperLeftDistance) {
    return left;
  }

  return upDistance <= upperLeftDistance ? up : upperLeft;
}

function copyPngRowToRgb(
  row: Buffer,
  width: number,
  colorType: number,
  palette: Buffer | undefined,
  rgb: Buffer,
  rgbOffset: number
): number {
  for (let pixel = 0; pixel < width; pixel++) {
    if (colorType === 0) {
      const value = row[pixel];
      rgb[rgbOffset++] = value;
      rgb[rgbOffset++] = value;
      rgb[rgbOffset++] = value;
    } else if (colorType === 2) {
      const rowOffset = pixel * 3;
      rgb[rgbOffset++] = row[rowOffset];
      rgb[rgbOffset++] = row[rowOffset + 1];
      rgb[rgbOffset++] = row[rowOffset + 2];
    } else if (colorType === 3) {
      const paletteOffset = row[pixel] * 3;
      rgb[rgbOffset++] = palette?.[paletteOffset] ?? 0;
      rgb[rgbOffset++] = palette?.[paletteOffset + 1] ?? 0;
      rgb[rgbOffset++] = palette?.[paletteOffset + 2] ?? 0;
    } else if (colorType === 4) {
      const value = row[pixel * 2];
      rgb[rgbOffset++] = value;
      rgb[rgbOffset++] = value;
      rgb[rgbOffset++] = value;
    } else if (colorType === 6) {
      const rowOffset = pixel * 4;
      rgb[rgbOffset++] = row[rowOffset];
      rgb[rgbOffset++] = row[rowOffset + 1];
      rgb[rgbOffset++] = row[rowOffset + 2];
    }
  }

  return rgbOffset;
}

function extractDocxLines(source: Buffer): string[] {
  const documentXml = readZipFile(source, 'word/document.xml');
  const lines = documentXml
    .split(/<\/w:p>/)
    .map(paragraph => extractTextFromXmlRuns(paragraph))
    .filter(line => line.length > 0);

  return lines.length ? lines : [''];
}

function extractXlsxLines(source: Buffer): string[] {
  const entries = readZipEntries(source);
  const sharedStrings = parseSharedStrings(readZipEntry(source, entries, 'xl/sharedStrings.xml')?.toString() ?? '');
  const worksheetNames = [...entries.keys()]
    .filter(name => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
  const lines: string[] = [];

  worksheetNames.forEach((worksheetName, index) => {
    const worksheet = readZipEntry(source, entries, worksheetName)?.toString();
    if (!worksheet) {
      return;
    }

    lines.push(`Sheet ${index + 1}`);
    for (const row of worksheet.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = [...row[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)]
        .map(cell => extractXlsxCellValue(cell[1], cell[2], sharedStrings))
        .filter(value => value.length > 0);

      if (cells.length) {
        lines.push(cells.join('    '));
      }
    }
    lines.push('');
  });

  return lines.length ? lines : [''];
}

function parseSharedStrings(sharedStringsXml: string): string[] {
  return [...sharedStringsXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)]
    .map(match => extractTextFromXmlRuns(match[1]));
}

function extractXlsxCellValue(attributes: string, cellXml: string, sharedStrings: string[]): string {
  const typeMatch = attributes.match(/\bt="([^"]+)"/);
  const type = typeMatch?.[1];

  if (type === 's') {
    const sharedStringIndex = Number(extractFirstTagValue(cellXml, 'v'));
    return sharedStrings[sharedStringIndex] ?? '';
  }

  if (type === 'inlineStr') {
    return extractTextFromXmlRuns(cellXml);
  }

  return decodeXmlEntities(extractFirstTagValue(cellXml, 'v'));
}

function extractTextFromXmlRuns(xml: string): string {
  const textParts: string[] = [];

  for (const match of xml.matchAll(/<[^:>]+:t\b[^>]*>([\s\S]*?)<\/[^:>]+:t>|<[^:>]+:tab\b[^>]*\/>/g)) {
    textParts.push(match[1] === undefined ? ' ' : decodeXmlEntities(match[1]));
  }

  return textParts.join('').trim();
}

function extractFirstTagValue(xml: string, tagName: string): string {
  const match = xml.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`));
  return match?.[1] ?? '';
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, '\'');
}

function readZipFile(source: Buffer, filename: string): string {
  const entries = readZipEntries(source);
  const content = readZipEntry(source, entries, filename);

  if (!content) {
    throw new Error(`Unable to find ${filename} in uploaded Office document`);
  }

  return content.toString();
}

function readZipEntries(source: Buffer): Map<string, ZipEntry> {
  const endOfCentralDirectoryOffset = findEndOfCentralDirectory(source);
  const totalEntries = source.readUInt16LE(endOfCentralDirectoryOffset + 10);
  let offset = source.readUInt32LE(endOfCentralDirectoryOffset + 16);
  const entries = new Map<string, ZipEntry>();

  for (let index = 0; index < totalEntries; index++) {
    if (source.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error('Invalid ZIP central directory');
    }

    const compressionMethod = source.readUInt16LE(offset + 10);
    const compressedSize = source.readUInt32LE(offset + 20);
    const filenameLength = source.readUInt16LE(offset + 28);
    const extraLength = source.readUInt16LE(offset + 30);
    const commentLength = source.readUInt16LE(offset + 32);
    const localHeaderOffset = source.readUInt32LE(offset + 42);
    const filename = source.subarray(offset + 46, offset + 46 + filenameLength).toString();

    entries.set(filename, {
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset += 46 + filenameLength + extraLength + commentLength;
  }

  return entries;
}

function readZipEntry(source: Buffer, entries: Map<string, ZipEntry>, filename: string): Buffer | undefined {
  const entry = entries.get(filename);
  if (!entry) {
    return undefined;
  }

  const localHeaderOffset = entry.localHeaderOffset;
  if (source.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
    throw new Error('Invalid ZIP local file header');
  }

  const filenameLength = source.readUInt16LE(localHeaderOffset + 26);
  const extraLength = source.readUInt16LE(localHeaderOffset + 28);
  const dataOffset = localHeaderOffset + 30 + filenameLength + extraLength;
  const compressedData = source.subarray(dataOffset, dataOffset + entry.compressedSize);

  if (entry.compressionMethod === 0) {
    return compressedData;
  }

  if (entry.compressionMethod === 8) {
    return inflateRawSync(compressedData);
  }

  throw new Error('Unsupported ZIP compression method');
}

function findEndOfCentralDirectory(source: Buffer): number {
  for (let offset = source.length - 22; offset >= 0; offset--) {
    if (source.readUInt32LE(offset) === 0x06054b50) {
      return offset;
    }
  }

  throw new Error('Invalid ZIP file');
}

function wrapLine(line: string, maxLength: number): string[] {
  const text = sanitisePdfText(line);
  if (text.length <= maxLength) {
    return [text];
  }

  const wrapped: string[] = [];
  let remaining = text;

  while (remaining.length > maxLength) {
    const breakAt = Math.max(1, remaining.lastIndexOf(' ', maxLength));
    wrapped.push(remaining.slice(0, breakAt));
    remaining = remaining.slice(breakAt).trimStart();
  }

  wrapped.push(remaining);
  return wrapped;
}

function sanitisePdfText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/g, '?');
}

function escapePdfText(value: string): string {
  return sanitisePdfText(value)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}
