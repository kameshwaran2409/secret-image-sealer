// LSB Steganography Implementation - Cross-Environment Compatible

const DELIMITER = '$$END$$';
const MAGIC_HEADER = 'STEGO1'; // Version identifier for compatibility

/**
 * Converts text to binary string using UTF-8 encoding
 * This ensures consistent encoding across all environments
 */
function textToBinary(text: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += bytes[i].toString(2).padStart(8, '0');
  }
  return binary;
}

/**
 * Converts binary string back to text using UTF-8 decoding
 */
function binaryToText(binary: string): string {
  const bytes = binary.match(/.{1,8}/g);
  if (!bytes) return '';
  
  const byteArray = new Uint8Array(bytes.map((byte) => parseInt(byte, 2)));
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(byteArray);
}

/**
 * Calculates the maximum text capacity for an image
 */
export function calculateCapacity(width: number, height: number): number {
  // Each pixel has 4 channels (RGBA), we use 3 (RGB)
  // Each channel stores 1 bit of data
  // 8 bits = 1 byte (UTF-8 can be multi-byte)
  const totalBits = width * height * 3;
  const headerBits = (MAGIC_HEADER.length + 4) * 8; // Header + length prefix
  const delimiterBits = DELIMITER.length * 8;
  // Conservative estimate for UTF-8 (assuming mostly ASCII)
  return Math.floor((totalBits - headerBits - delimiterBits) / 8);
}

/**
 * Creates a consistent ImageData without browser-specific color management
 */
function createRawCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d', {
    willReadFrequently: true,
    colorSpace: 'srgb',
    // Disable alpha premultiplication for consistent pixel values
  });
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Disable image smoothing for exact pixel values
  ctx.imageSmoothingEnabled = false;
  
  return { canvas, ctx };
}

/**
 * Encodes secret text into image data using LSB steganography
 * Uses a header-based format for reliable cross-environment decoding
 */
export function encodeText(
  imageData: ImageData,
  secretText: string
): ImageData {
  // Create message with header: MAGIC + length (4 bytes) + message + delimiter
  const fullMessage = secretText + DELIMITER;
  const encoder = new TextEncoder();
  const messageBytes = encoder.encode(fullMessage);
  
  // Create header: magic + 4-byte length
  const headerBytes = encoder.encode(MAGIC_HEADER);
  const lengthBytes = new Uint8Array(4);
  const dataView = new DataView(lengthBytes.buffer);
  dataView.setUint32(0, messageBytes.length, false); // Big-endian for consistency
  
  // Combine all bytes
  const totalBytes = new Uint8Array(headerBytes.length + lengthBytes.length + messageBytes.length);
  totalBytes.set(headerBytes, 0);
  totalBytes.set(lengthBytes, headerBytes.length);
  totalBytes.set(messageBytes, headerBytes.length + lengthBytes.length);
  
  // Convert to binary
  let binaryText = '';
  for (let i = 0; i < totalBytes.length; i++) {
    binaryText += totalBytes[i].toString(2).padStart(8, '0');
  }
  
  const maxBits = imageData.width * imageData.height * 3;
  if (binaryText.length > maxBits) {
    const maxChars = Math.floor((maxBits / 8) - headerBytes.length - lengthBytes.length - DELIMITER.length);
    throw new Error(`Text too long. Maximum capacity: ${maxChars} characters`);
  }

  // Create a new array to avoid modifying the original
  const data = new Uint8ClampedArray(imageData.data);
  let binaryIndex = 0;

  for (let i = 0; i < data.length && binaryIndex < binaryText.length; i++) {
    // Skip alpha channel (every 4th value starting from index 3)
    if ((i + 1) % 4 === 0) continue;

    // Get the bit to encode
    const bit = parseInt(binaryText[binaryIndex], 10);
    
    // Clear the LSB and set it to our bit
    data[i] = (data[i] & 0xFE) | bit;
    
    binaryIndex++;
  }

  return new ImageData(data, imageData.width, imageData.height);
}

/**
 * Decodes hidden text from image data using LSB steganography
 * Uses header-based format for reliable cross-environment decoding
 */
export function decodeText(imageData: ImageData): string {
  const data = imageData.data;
  let binaryText = '';
  let extractedBytes: number[] = [];

  // First, extract enough bits for the header (MAGIC + 4 bytes length)
  const headerSize = MAGIC_HEADER.length + 4;
  const headerBits = headerSize * 8;
  
  for (let i = 0; i < data.length && binaryText.length < headerBits; i++) {
    // Skip alpha channel
    if ((i + 1) % 4 === 0) continue;
    binaryText += (data[i] & 1).toString();
  }
  
  // Convert header bits to bytes
  const headerBytes = binaryText.match(/.{1,8}/g);
  if (!headerBytes || headerBytes.length < headerSize) {
    throw new Error('No hidden message found in this image');
  }
  
  for (let j = 0; j < headerSize; j++) {
    extractedBytes.push(parseInt(headerBytes[j], 2));
  }
  
  // Check magic header
  const decoder = new TextDecoder('utf-8');
  const magicBytes = new Uint8Array(extractedBytes.slice(0, MAGIC_HEADER.length));
  const magic = decoder.decode(magicBytes);
  
  if (magic !== MAGIC_HEADER) {
    // Fallback: Try legacy format (no header, just message with delimiter)
    return decodeLegacyFormat(imageData);
  }
  
  // Read message length
  const lengthBytes = new Uint8Array(extractedBytes.slice(MAGIC_HEADER.length, MAGIC_HEADER.length + 4));
  const lengthView = new DataView(lengthBytes.buffer);
  const messageLength = lengthView.getUint32(0, false);
  
  // Validate length
  const maxPossibleLength = Math.floor((data.length * 3) / (4 * 8));
  if (messageLength > maxPossibleLength || messageLength > 10000000) {
    throw new Error('Invalid message length detected');
  }
  
  // Continue extracting the message
  const totalBitsNeeded = (headerSize + messageLength) * 8;
  let bitIndex = 0;
  binaryText = '';
  
  for (let i = 0; i < data.length && binaryText.length < totalBitsNeeded; i++) {
    if ((i + 1) % 4 === 0) continue;
    binaryText += (data[i] & 1).toString();
    bitIndex++;
  }
  
  // Extract message bytes
  const allBytes = binaryText.match(/.{1,8}/g);
  if (!allBytes) {
    throw new Error('Failed to extract message');
  }
  
  const messageStartIndex = headerSize;
  const messageEndIndex = headerSize + messageLength;
  const messageByteStrings = allBytes.slice(messageStartIndex, messageEndIndex);
  
  const messageBytes = new Uint8Array(messageByteStrings.map(b => parseInt(b, 2)));
  let message = decoder.decode(messageBytes);
  
  // Remove delimiter if present
  if (message.endsWith(DELIMITER)) {
    message = message.slice(0, -DELIMITER.length);
  }
  
  return message;
}

/**
 * Fallback decoder for images encoded without the header format
 * Maintains backward compatibility
 */
function decodeLegacyFormat(imageData: ImageData): string {
  const data = imageData.data;
  let binaryText = '';
  let text = '';

  for (let i = 0; i < data.length; i++) {
    // Skip alpha channel
    if ((i + 1) % 4 === 0) continue;

    // Extract the LSB
    binaryText += (data[i] & 1).toString();

    // Every 8 bits, convert to character and check for delimiter
    if (binaryText.length % 8 === 0) {
      const byte = binaryText.slice(-8);
      const charCode = parseInt(byte, 2);
      
      // Only accept printable ASCII and common Unicode
      if (charCode >= 32 && charCode <= 126) {
        text += String.fromCharCode(charCode);
      } else if (charCode > 0) {
        // Try UTF-8 aware decoding for non-ASCII
        try {
          const decoder = new TextDecoder('utf-8', { fatal: true });
          const bytes = new Uint8Array([charCode]);
          text += decoder.decode(bytes);
        } catch {
          text += String.fromCharCode(charCode);
        }
      }
      
      // Check if we've found the delimiter
      if (text.endsWith(DELIMITER)) {
        return text.slice(0, -DELIMITER.length);
      }
      
      // Safety limit to prevent infinite loops
      if (text.length > 1000000) {
        break;
      }
    }
  }

  throw new Error('No hidden message found in this image');
}

/**
 * Loads an image file and returns its ImageData with consistent processing
 */
export function loadImage(file: File): Promise<{ imageData: ImageData; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    // Use createImageBitmap for more consistent cross-browser behavior when available
    if (typeof createImageBitmap !== 'undefined' && file.type !== 'image/gif') {
      createImageBitmap(file, {
        premultiplyAlpha: 'none',
        colorSpaceConversion: 'none',
      })
        .then((bitmap) => {
          const { canvas, ctx } = createRawCanvas(bitmap.width, bitmap.height);
          ctx.drawImage(bitmap, 0, 0);
          const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
          bitmap.close();
          resolve({
            imageData,
            width: bitmap.width,
            height: bitmap.height,
          });
        })
        .catch(() => {
          // Fallback to Image element
          loadImageFallback(file).then(resolve).catch(reject);
        });
    } else {
      loadImageFallback(file).then(resolve).catch(reject);
    }
  });
}

/**
 * Fallback image loading using Image element
 */
function loadImageFallback(file: File): Promise<{ imageData: ImageData; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const { canvas, ctx } = createRawCanvas(img.width, img.height);
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        
        resolve({
          imageData,
          width: img.width,
          height: img.height,
        });
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts ImageData to a downloadable PNG blob with lossless encoding
 */
export function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const { canvas, ctx } = createRawCanvas(imageData.width, imageData.height);
    ctx.putImageData(imageData, 0, 0);
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/png', // PNG is lossless, preserving LSB data
      1.0
    );
  });
}

/**
 * Downloads a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
