import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// CONFIG
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        console.log("Uploading file:", localFilePath);

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });


        console.log("Cloudinary upload success:", response.secure_url);

        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        console.log("❌ Cloudinary error:", error);

        // safe delete
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }

        return null;
    }
};

export default uploadOnCloudinary;