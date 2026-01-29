const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

/**
 * Deletes a file from either Cloudinary or Local Filesystem
 * @param {string} filePath - The URL or path of the file to delete
 */
const deleteFile = async (filePath) => {
    if (!filePath) return;

    // Check if it's a Cloudinary URL
    if (filePath.includes('cloudinary.com')) {
        try {
            // Extract Public ID (folder/filename without extension)
            // URL format: https://res.cloudinary.com/cloud_name/image/upload/v12345/hardware-store/filename.jpg
            const splitUrl = filePath.split('/');
            const filename = splitUrl[splitUrl.length - 1]; // filename.jpg
            const folder = splitUrl[splitUrl.length - 2];   // hardware-store (or other folder)
            const publicIdWithExt = `${folder}/${filename}`;
            const publicId = publicIdWithExt.split('.')[0]; // Remove extension

            await cloudinary.uploader.destroy(publicId);
            console.log(`Cloudinary image deleted: ${publicId}`);
        } catch (err) {
            console.error(`Failed to delete Cloudinary image: ${filePath}`, err);
        }
    } else {
        // Assume Local File
        // Adjust for potential relative/absolute path differences
        // If it starts with 'uploads/', it's relative to project root usually
        // If passed as full URL from previous fix (http://localhost...), we need to strip domain

        let localPath = filePath;
        if (filePath.startsWith('http://localhost')) {
            const urlParts = filePath.split('/');
            // assuming http://localhost:5000/uploads/file.jpg
            // parts: [http:, '', localhost:5000, uploads, file.jpg]
            // We want uploads/file.jpg -> index 3 onwards
            localPath = urlParts.slice(3).join('/');
        }

        const fullPath = path.join(__dirname, '..', localPath);

        fs.unlink(fullPath, (err) => {
            if (err && err.code !== 'ENOENT') { // Ignore file not found
                console.error(`Failed to delete local file: ${fullPath}`, err);
            }
        });
    }
};

module.exports = { deleteFile };
