// Ultra-fast image compression using Canvas API
// Compresses images before upload to save bandwidth

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1 for JPEG/WebP
  format?: 'jpeg' | 'webp' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  format: 'webp' // WebP is smaller than JPEG with same quality
};

export const isCompressibleImage = (file: File): boolean => {
  const compressibleTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp'];
  return compressibleTypes.includes(file.type.toLowerCase());
};

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  // Skip non-compressible images (GIFs, SVGs, etc.)
  if (!isCompressibleImage(file)) {
    return file;
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > opts.maxWidth! || height > opts.maxHeight!) {
        const ratio = Math.min(opts.maxWidth! / width, opts.maxHeight! / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d', { alpha: false });
      if (!ctx) {
        resolve(file); // Fallback to original
        return;
      }

      // Use faster image smoothing for speed
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';
      
      // Fill with white background (for transparent PNGs)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const mimeType = `image/${opts.format}`;
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file); // Fallback to original
            return;
          }

          // Only use compressed version if it's smaller
          if (blob.size < file.size) {
            const extension = opts.format === 'jpeg' ? 'jpg' : opts.format;
            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File(
              [blob],
              `${baseName}.${extension}`,
              { type: mimeType }
            );
            resolve(compressedFile);
          } else {
            resolve(file); // Keep original if compression didn't help
          }
        },
        mimeType,
        opts.quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback to original on error
    };

    img.src = url;
  });
};

// Batch compress multiple files in parallel
export const compressImages = async (
  files: File[],
  options: CompressionOptions = {},
  concurrency = 8 // Process 8 images at a time
): Promise<File[]> => {
  const results: File[] = [];
  
  for (let i = 0; i < files.length; i += concurrency) {
    const batch = files.slice(i, i + concurrency);
    const compressed = await Promise.all(
      batch.map(file => compressImage(file, options))
    );
    results.push(...compressed);
  }
  
  return results;
};

// Calculate compression stats
export const getCompressionStats = (
  originalFiles: File[],
  compressedFiles: File[]
): { originalSize: number; compressedSize: number; savedBytes: number; savedPercent: number } => {
  const originalSize = originalFiles.reduce((acc, f) => acc + f.size, 0);
  const compressedSize = compressedFiles.reduce((acc, f) => acc + f.size, 0);
  const savedBytes = originalSize - compressedSize;
  const savedPercent = originalSize > 0 ? Math.round((savedBytes / originalSize) * 100) : 0;
  
  return { originalSize, compressedSize, savedBytes, savedPercent };
};
