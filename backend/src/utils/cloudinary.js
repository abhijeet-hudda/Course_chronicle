import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { ApiError } from "./ApiError.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


/**
 * Uploads a file that already exists on local disk (e.g. written there by
 * multer's diskStorage) to Cloudinary, then removes the local copy either way.
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    // Remove the locally saved temp file even if the upload failed
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
    console.error("Cloudinary upload failed:", error?.message || error);
    return null;
  }
};


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const deleteFromCloudinary = async (publicId, resource_type = "image") => {
  if (!publicId) {
    throw new ApiError(400, "publicId is required for deletion");
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type });

    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error(`Cloudinary deletion failed: ${result.result}`);
    }

    return result;
  } catch (error) {
    throw new ApiError(500, "Failed to delete asset from Cloudinary", [error?.message || String(error)]);
  }
};


export {
    uploadOnCloudinary,
    deleteFromCloudinary
 };