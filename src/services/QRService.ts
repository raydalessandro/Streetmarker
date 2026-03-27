// src/services/QRService.ts
import QRCode from 'qrcode';
import LZString from 'lz-string';
import type { Spot } from '../types/spot';

const MAX_CHUNK_DATA_SIZE = 2000; // bytes per chunk data (safe limit for QR encoding with metadata)

export interface QRExportData {
  version: string;
  spots: Spot[];
}

export interface QRChunk {
  index: number;
  total: number;
  data: string;
}

export class QRService {
  /**
   * Export spots to QR code(s)
   * Returns array of QR data URLs - single QR if small, multiple if large
   */
  async exportToQR(spots: Spot[]): Promise<string[]> {
    const exportData: QRExportData = {
      version: '1.0',
      spots,
    };

    const json = JSON.stringify(exportData);

    // If small enough, generate single QR
    if (json.length < 2800) {
      const qrDataUrl = await QRCode.toDataURL(json, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 500,
      });
      return [qrDataUrl];
    }

    // Compress and chunk for large data
    const compressed = LZString.compressToBase64(json);
    const chunks = this.chunkString(compressed, MAX_CHUNK_DATA_SIZE);

    // Generate QR for each chunk with metadata
    const qrCodes: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk: QRChunk = {
        index: i,
        total: chunks.length,
        data: chunks[i],
      };
      const chunkJson = JSON.stringify(chunk);
      const qrDataUrl = await QRCode.toDataURL(chunkJson, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 500,
      });
      qrCodes.push(qrDataUrl);
    }

    return qrCodes;
  }

  /**
   * Parse QR code data
   * Handles both single QR and chunked multi-QR sequences
   */
  parseQRData(qrData: string): { isChunk: boolean; chunk?: QRChunk; data?: QRExportData } {
    try {
      const parsed = JSON.parse(qrData);

      // Check if it's a chunk
      if (parsed.index !== undefined && parsed.total !== undefined && parsed.data !== undefined) {
        return {
          isChunk: true,
          chunk: parsed as QRChunk,
        };
      }

      // It's a complete export data
      return {
        isChunk: false,
        data: parsed as QRExportData,
      };
    } catch (error) {
      throw new Error('Invalid QR data format');
    }
  }

  /**
   * Assemble chunks into complete export data
   */
  assembleChunks(chunks: QRChunk[]): QRExportData {
    // Sort by index
    const sorted = chunks.sort((a, b) => a.index - b.index);

    // Validate sequence
    if (sorted.length === 0) {
      throw new Error('No chunks to assemble');
    }

    const total = sorted[0].total;
    if (sorted.length !== total) {
      throw new Error(`Missing chunks: expected ${total}, got ${sorted.length}`);
    }

    for (let i = 0; i < sorted.length; i++) {
      if (sorted[i].index !== i) {
        throw new Error(`Invalid chunk sequence at index ${i}`);
      }
      if (sorted[i].total !== total) {
        throw new Error(`Inconsistent total count at index ${i}`);
      }
    }

    // Concatenate data and decompress
    const concatenated = sorted.map(c => c.data).join('');
    const decompressed = LZString.decompressFromBase64(concatenated);

    if (!decompressed) {
      throw new Error('Failed to decompress data');
    }

    try {
      return JSON.parse(decompressed) as QRExportData;
    } catch (error) {
      throw new Error('Invalid decompressed data format');
    }
  }

  /**
   * Chunk string into fixed-size pieces
   */
  private chunkString(str: string, size: number): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < str.length; i += size) {
      chunks.push(str.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Check if chunks array is complete
   */
  isChunkSequenceComplete(chunks: QRChunk[]): boolean {
    if (chunks.length === 0) return false;

    const total = chunks[0].total;
    if (chunks.length !== total) return false;

    const indices = new Set(chunks.map(c => c.index));
    for (let i = 0; i < total; i++) {
      if (!indices.has(i)) return false;
    }

    return true;
  }
}
