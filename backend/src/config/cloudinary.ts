import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import fs from "fs";
import path from "path";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary
 * @param buffer - File buffer from multer memoryStorage
 * @param folder - Cloudinary folder (e.g. "tenants", "teachers", "students")
 * @returns Cloudinary secure_url
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
  // When true (default), the image is resized + compressed on upload so only a
  // small optimized copy is stored — keeps Cloudinary storage usage low. Pass
  // false for non-image files (e.g. PDFs/documents) that must stay original.
  optimizeImage: boolean = true
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // Timeout to prevent hanging forever
    const timer = setTimeout(() => {
      reject(new Error("Cloudinary upload timed out after 30s"));
    }, 30000);

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `college-erp/${folder}`,
        resource_type: "auto",
        // Image optimization — only applied to images (resource_type auto
        // detects). Caps dimensions and auto-compresses so each photo is only
        // a few tens of KB instead of multiple MB.
        ...(optimizeImage
          ? {
              transformation: [
                { width: 500, height: 500, crop: "limit" }, // never upscale; cap at 500x500
                { quality: "auto:good" },                    // balanced/average quality compression
                { fetch_format: "auto" },                    // serve webp/avif where supported
              ],
            }
          : {}),
      },
      (error, result) => {
        clearTimeout(timer); // Cancel timeout on completion
        if (error) {
          console.error("[Cloudinary] Upload stream error:", error.message);
          reject(error);
        } else {
          resolve(result!.secure_url);
        }
      }
    );

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
}

/**
 * Delete a file from Cloudinary by URL
 */
export async function deleteFromCloudinary(url: string): Promise<void> {
  try {
    // Extract public_id from URL
    const parts = url.split("/upload/");
    if (parts.length < 2) return;
    const pathPart = parts[1]; // e.g. "v123456/college-erp/tenants/file.png"
    const publicId = pathPart
      .replace(/^v\d+\//, "") // remove version
      .replace(/\.[^.]+$/, ""); // remove extension
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn("Cloudinary delete failed:", err);
  }
}

/**
 * True when all three Cloudinary env vars are present.
 * Use this to decide whether persistent cloud storage is available.
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

/**
 * saveAsset — persist a generated file buffer SAFELY.
 *
 * Primary: upload to Cloudinary (survives Render restarts/deploys).
 * Fallback: if Cloudinary is NOT configured, OR the upload fails, write to
 * the local /uploads/<folder> disk exactly like the old code did, so NOTHING
 * breaks on localhost or during a transient Cloudinary outage.
 *
 * @param buffer       - file contents
 * @param cloudFolder  - Cloudinary sub-folder (e.g. "qr", "signatures")
 * @param fileName     - file name to use for the local fallback
 * @param optimizeImage- pass false for non-photo assets (QR/barcode/signature
 *                       stay crisp — no lossy compression)
 * @returns a URL string: Cloudinary https URL, or "/uploads/<folder>/<file>"
 */
export async function saveAsset(
  buffer: Buffer,
  cloudFolder: string,
  fileName: string,
  optimizeImage: boolean = false
): Promise<string> {
  // Try Cloudinary first when configured
  if (isCloudinaryConfigured()) {
    try {
      return await uploadToCloudinary(buffer, cloudFolder, optimizeImage);
    } catch (err: any) {
      console.error(
        `[saveAsset] Cloudinary upload failed for ${cloudFolder}/${fileName}, falling back to local disk:`,
        err?.message || err
      );
      // fall through to local fallback
    }
  }

  // Local-disk fallback (old behaviour) — keeps localhost + outage working
  const uploadsDir = path.join(__dirname, "../../uploads", cloudFolder);
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  const filePath = path.join(uploadsDir, fileName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/${cloudFolder}/${fileName}`;
}

export default cloudinary;
