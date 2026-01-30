const Banner = require('../models/Banner');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');
const { deleteFile } = require('../utils/fileHandler');

// @desc    Get all banners
// @route   GET /api/banners
// @access  Public
exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find({})
            .populate('offer_id', 'title percentage')
            .populate('product_ids', 'title opening_stock')
            .sort({ createdAt: -1 });
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching banners', error: error.message });
    }
};

// @desc    Create banner
// @route   POST /api/banners
// @access  Admin
exports.createBanner = async (req, res) => {
    try {
        const { title, description, offer_id, manual_product_ids, position, textColor, buttonColor, buttonText, buttonLink, showSecondaryButton, badgeText } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Image is required' });
        }

        const image = req.file.path; // Cloudinary URL

        // Logic: Calculate product_ids
        let product_ids = [];

        if (offer_id) {
            // Fetch all products linked to this offer
            const offerProducts = await Product.find({ offer: offer_id }).select('_id');
            product_ids = offerProducts.map(p => p._id);
        } else if (manual_product_ids) {
            // Parse if coming as string/JSON or array
            // If from FormData, it might be a comma separated string
            if (typeof manual_product_ids === 'string') {
                product_ids = manual_product_ids.split(',').filter(id => id.trim() !== '');
            } else if (Array.isArray(manual_product_ids)) {
                product_ids = manual_product_ids;
            }
        }

        const banner = await Banner.create({
            title,
            description,
            image,
            offer_id: offer_id || undefined,
            product_ids,
            position,
            textColor,
            buttonColor,
            buttonText,
            buttonLink,
            showSecondaryButton: showSecondaryButton === 'true' || showSecondaryButton === true,
            badgeText
        });

        res.status(201).json(banner);

    } catch (error) {
        if (req.file) deleteFile(req.file.path); // Cleanup
        res.status(400).json({ message: 'Failed to create banner', error: error.message });
    }
};

// @desc    Update banner
// @route   PUT /api/banners/:id
// @access  Admin
exports.updateBanner = async (req, res) => {
    try {
        console.log('Banner Update Request:', {
            params: req.params,
            body: req.body,
            file: req.file ? 'File present' : 'No file',
            offer_id_type: typeof req.body.offer_id,
            manual_product_ids_type: typeof req.body.manual_product_ids
        });

        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });

        const { title, description, offer_id, manual_product_ids, position, textColor, buttonColor, buttonText, buttonLink, showSecondaryButton, badgeText } = req.body;

        // Update basic fields
        if (title) banner.title = title;
        if (description !== undefined) banner.description = description;
        if (position) banner.position = position;
        if (textColor) banner.textColor = textColor;
        if (buttonColor) banner.buttonColor = buttonColor;
        if (buttonText) banner.buttonText = buttonText;
        if (buttonLink) banner.buttonLink = buttonLink;
        if (showSecondaryButton !== undefined) banner.showSecondaryButton = showSecondaryButton === 'true' || showSecondaryButton === true;
        if (badgeText !== undefined) banner.badgeText = badgeText;

        // Update image if provided
        if (req.file) {
            deleteFile(banner.image);
            banner.image = req.file.path;
        }

        // Logic: Re-calculate product_ids if linking changes
        // If offer_id is explicitly sent. 
        // Handles "null", "undefined", "" strings from FormData
        if (offer_id !== undefined) {
            let cleanOfferId = offer_id;
            if (offer_id === 'null' || offer_id === 'undefined' || offer_id === '') {
                cleanOfferId = null;
            }

            banner.offer_id = cleanOfferId;

            if (cleanOfferId) {
                const offerProducts = await Product.find({ offer: cleanOfferId }).select('_id');
                banner.product_ids = offerProducts.map(p => p._id);
            } else {
                // Determine if we should clear products or rely on manual_product_ids
                // If switching to manual (offer cleared), we expect manual_product_ids to populate it
                // If manual_product_ids is NOT present, we might clear it.
                // But the next block handles manual_product_ids
            }
        }

        if (manual_product_ids !== undefined) {
            // Only update manual products if offer_id is NOT set (or we just cleared it)
            // effective offer_id is checked on the banner instance
            if (!banner.offer_id) {
                if (typeof manual_product_ids === 'string') {
                    // Check for empty string case which means empty array
                    if (!manual_product_ids.trim()) {
                        banner.product_ids = [];
                    } else {
                        banner.product_ids = manual_product_ids.split(',').filter(id => id.trim() !== '');
                    }
                } else if (Array.isArray(manual_product_ids)) {
                    banner.product_ids = manual_product_ids;
                }
            }
        }

        const updatedBanner = await banner.save();
        res.json(updatedBanner);

    } catch (error) {
        console.error('Banner Update Error:', error);

        // Log to file for deep debugging
        const logPath = path.join(__dirname, '../banner_error.log');
        const logEntry = `[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\nBody: ${JSON.stringify(req.body)}\n\n`;
        fs.appendFile(logPath, logEntry, (err) => { if (err) console.error("Log write failed", err) });

        if (req.file) deleteFile(req.file.path);
        res.status(400).json({ message: 'Failed to update banner', error: error.message });
    }
};

// @desc    Delete banner
// @route   DELETE /api/banners/:id
// @access  Admin
exports.deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });

        deleteFile(banner.image);
        await banner.deleteOne();

        res.json({ message: 'Banner deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete banner', error: error.message });
    }
};

// @desc    Remove product from banner
// @route   DELETE /api/banners/:id/products/:productId
// @access  Admin
exports.removeProductFromBanner = async (req, res) => {
    try {
        const { id, productId } = req.params;
        const banner = await Banner.findById(id);
        if (!banner) return res.status(404).json({ message: 'Banner not found' });

        banner.product_ids = banner.product_ids.filter(pid => pid.toString() !== productId);
        await banner.save();

        res.json({ message: 'Product removed from banner', banner });
    } catch (error) {
        res.status(500).json({ message: 'Failed to remove product', error: error.message });
    }
};
