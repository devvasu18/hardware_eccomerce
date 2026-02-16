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
            // Robust extraction of public_id using Regex
            // Matches /upload/ optionally followed by v<version>/ then captures the rest until the extension
            // Example: .../upload/v12345/folder/image.jpg -> folder/image
            const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
            const match = filePath.match(regex);

            if (match && match[1]) {
                const publicId = match[1];
                await cloudinary.uploader.destroy(publicId);
                console.log(`Cloudinary image deleted: ${publicId}`);
            } else {
                console.warn(`Could not extract publicId from Cloudinary URL: ${filePath}`);
            }
        } catch (err) {
            console.error(`Failed to delete Cloudinary image: ${filePath}`, err);
        }
    } else {
        // Assume Local File

        // If it is an external URL (not localhost), do nothing
        if (filePath.startsWith('http') && !filePath.includes('localhost')) {
            return;
        }

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
