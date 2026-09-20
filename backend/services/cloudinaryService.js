const cloudinary = require("../config/cloudinary");

/**
 * Uploads an image buffer directly to Cloudinary using upload_stream
 * @param {Buffer} buffer - Image file buffer from multer
 * @param {string} folder - Cloudinary folder name (default: "campusMart/products")
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadImageBuffer = (buffer, folder = "campusMart/products") => {
    return new Promise((resolve, reject) => {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            return reject(new Error("Cloudinary credentials are not configured in backend/.env"));
        }

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
                quality: "auto",
                fetch_format: "auto",
            },
            (error, result) => {
                if (error) {
                    console.error("[Cloudinary] Upload Stream Error:", error);
                    return reject(error);
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );

        uploadStream.end(buffer);
    });
};

/**
 * Deletes an image from Cloudinary by its public ID
 * @param {string} publicId - Cloudinary asset public_id
 * @returns {Promise<boolean>}
 */
const deleteCloudinaryImage = async (publicId) => {
    if (!publicId || typeof publicId !== "string") {
        return false;
    }

    // Do not attempt deletion if credentials are missing
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        console.warn("[Cloudinary] Credentials missing, skipping deletion of:", publicId);
        return false;
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId);
        console.log(`[Cloudinary] Deleted old asset "${publicId}":`, result?.result || result);
        return result?.result === "ok";
    } catch (error) {
        console.error(`[Cloudinary] Failed to delete asset "${publicId}":`, error.message);
        return false;
    }
};

module.exports = {
    uploadImageBuffer,
    deleteCloudinaryImage,
};
