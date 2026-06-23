import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

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
  folder: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `college-erp/${folder}`,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
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

export default cloudinary;
