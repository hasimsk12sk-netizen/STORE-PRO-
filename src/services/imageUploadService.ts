import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../firebase/firebaseClient';

export type WebsiteUploadFolder = 'app_icons' | 'app_screenshots' | 'banners';

interface CompressOptions {
  maxDimension: number;
  quality: number;
}

async function compressImageToBlobAndDataUrl(
  file: File,
  { maxDimension, quality }: CompressOptions
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid image file selected.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context unavailable.'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const mimeType = 'image/webp';
        let dataUrl = canvas.toDataURL(mimeType, quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to encode compressed image.'));
              return;
            }
            resolve({ blob, dataUrl });
          },
          mimeType,
          quality
        );
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file selected from an Android phone file manager or desktop
 * into the isolated `website/<folder>/` Firebase Storage path.
 * Automatically compresses and gracefully falls back to an optimized Data URL
 * if Firebase Storage bucket rules reject direct client upload.
 */
export async function uploadWebsiteImage(
  file: File,
  folder: WebsiteUploadFolder
): Promise<{ url: string; storageMode: 'firebase-storage' | 'optimized-inline' }> {
  const options: CompressOptions =
    folder === 'app_icons'
      ? { maxDimension: 384, quality: 0.85 }
      : folder === 'banners'
      ? { maxDimension: 1280, quality: 0.82 }
      : { maxDimension: 960, quality: 0.8 };

  const { blob, dataUrl } = await compressImageToBlobAndDataUrl(file, options);

  const safeFileName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const storagePath = `website/${folder}/${Date.now()}-${safeFileName || 'asset'}.webp`;

  try {
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/webp',
      cacheControl: 'public, max-age=31536000',
    });
    const downloadUrl = await getDownloadURL(storageRef);
    return { url: downloadUrl, storageMode: 'firebase-storage' };
  } catch {
    // Fallback ensures mobile/file-manager uploads succeed even if Storage rules aren't configured yet.
    if (dataUrl.length > 340000) {
      const tighter = await compressImageToBlobAndDataUrl(file, {
        maxDimension: folder === 'app_icons' ? 256 : 720,
        quality: 0.68,
      });
      return { url: tighter.dataUrl, storageMode: 'optimized-inline' };
    }
    return { url: dataUrl, storageMode: 'optimized-inline' };
  }
}
