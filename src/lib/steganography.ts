// LSB Steganography Implementation

const DELIMITER = '$$END$$';

/**
 * Converts text to binary string
 */
function textToBinary(text: string): string {
  return text
    .split('')
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, '0'))
    .join('');
}

/**
 * Converts binary string back to text
 */
function binaryToText(binary: string): string {
  const bytes = binary.match(/.{1,8}/g);
  if (!bytes) return '';
  return bytes.map((byte) => String.fromCharCode(parseInt(byte, 2))).join('');
}

/**
 * Calculates the maximum text capacity for an image
 */
export function calculateCapacity(width: number, height: number): number {
  // Each pixel has 4 channels (RGBA), we use 3 (RGB)
  // Each channel stores 1 bit of data
  // 8 bits = 1 character
  const totalBits = width * height * 3;
  const delimiterBits = DELIMITER.length * 8;
  return Math.floor((totalBits - delimiterBits) / 8);
}

/**
 * Encodes secret text into image data using LSB steganography
 */
export function encodeText(
  imageData: ImageData,
  secretText: string
): ImageData {
  const textWithDelimiter = secretText + DELIMITER;
  const binaryText = textToBinary(textWithDelimiter);
  
  const maxCapacity = calculateCapacity(imageData.width, imageData.height);
  if (textWithDelimiter.length > maxCapacity) {
    throw new Error(`Text too long. Maximum capacity: ${maxCapacity} characters`);
  }

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
 */
export function decodeText(imageData: ImageData): string {
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
      const char = binaryToText(binaryText.slice(-8));
      text += char;
      
      // Check if we've found the delimiter
      if (text.endsWith(DELIMITER)) {
        return text.slice(0, -DELIMITER.length);
      }
    }
  }

  throw new Error('No hidden message found in this image');
}

/**
 * Loads an image file and returns its ImageData
 */
export function loadImage(file: File): Promise<{ imageData: ImageData; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
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
 * Converts ImageData to a downloadable PNG blob
 */
export function imageDataToBlob(imageData: ImageData): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/png',
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
