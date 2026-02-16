const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'test_cloud',
    api_key: process.env.CLOUDINARY_API_KEY || 'test_key',
    api_secret: process.env.CLOUDINARY_API_SECRET || 'test_secret'
});

// Configure Storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'hardware-store', // The folder in cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp3', 'wav'],
        resource_type: 'auto' // Allow both image and raw/video (audio)
    }
});

const fileFilter = (req, file, cb) => {
    // Determine allowed types
    const allowedTypes = /jpeg|jpg|png|webp|gif|mp3|wav|mpeg/;
    // For Cloudinary storage, file.originalname is available
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype.startsWith('audio/');

    if (extname || mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Only images and audio files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024,
        fieldSize: 25 * 1024 * 1024 // Increase non-file field limit to 25MB
    }, // 50MB limit per file
    fileFilter: fileFilter
});

module.exports = upload;
