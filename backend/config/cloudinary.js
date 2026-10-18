import { v2 as cloudinary } from "cloudinary";

const connectCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_SECRET_KEY;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary configuration is incomplete. Check CLOUDINARY_NAME, " +
        "CLOUDINARY_API_KEY, and CLOUDINARY_SECRET_KEY in your backend .env.",
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  console.log("Cloudinary configured ");

  return cloudinary;
};

export default connectCloudinary;
