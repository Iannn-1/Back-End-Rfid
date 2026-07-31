import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a base64 image string to Cloudinary and returns the secure URL.
 * Returns null if the input is not a valid base64 image.
 */
export async function uploadPhoto(base64OrUrl: string): Promise<string | null> {
  if (!base64OrUrl) return null;

  // Already a URL (Cloudinary or external) — return as-is
  if (base64OrUrl.startsWith('http')) return base64OrUrl;

  // Must be a base64 data URI
  if (!base64OrUrl.startsWith('data:image/')) return null;

  try {
    const result = await cloudinary.uploader.upload(base64OrUrl, {
      folder: 'rfid-students',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
    return result.secure_url;
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    return null;
  }
}
