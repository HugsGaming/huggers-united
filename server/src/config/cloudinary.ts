import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { logger } from "./logger";

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

logger.info("Cloudinary connected...");

export default cloudinary;
