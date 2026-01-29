const Brand = require('../models/Brand');
const { deleteFile } = require('../utils/fileHandler');

// @desc    Get all brands
// @route   GET /api/brands
// @access  Public
exports.getBrands = async (req, res) => {
    try {
        const brands = await Brand.find({}).sort({ name: 1 });
        res.json(brands);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching brands', error: error.message });
    }
};

// @desc    Create brand
// @route   POST /api/brands
// @access  Admin
exports.createBrand = async (req, res) => {
    try {
        const { name, slug } = req.body;
        const logo_image = req.file ? req.file.path : undefined;

        const brand = await Brand.create({
            name,
            slug,
            logo_image
        });

        res.status(201).json(brand);
    } catch (error) {
        if (req.file) deleteFile(req.file.path);
        res.status(400).json({ message: 'Failed to create brand', error: error.message });
    }
};

// @desc    Update brand
// @route   PUT /api/brands/:id
// @access  Admin
exports.updateBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) return res.status(404).json({ message: 'Brand not found' });

        const { name, slug } = req.body;

        if (name) brand.name = name;
        if (slug) brand.slug = slug;

        if (req.file) {
            // Delete old logo if it exists
            if (brand.logo_image) deleteFile(brand.logo_image);
            brand.logo_image = req.file.path;
        }

        const updatedBrand = await brand.save();
        res.json(updatedBrand);
    } catch (error) {
        if (req.file) deleteFile(req.file.path);
        res.status(400).json({ message: 'Failed to update brand', error: error.message });
    }
};

// @desc    Delete brand
// @route   DELETE /api/brands/:id
// @access  Admin
exports.deleteBrand = async (req, res) => {
    try {
        const brand = await Brand.findById(req.params.id);
        if (!brand) return res.status(404).json({ message: 'Brand not found' });

        if (brand.logo_image) deleteFile(brand.logo_image);

        await brand.deleteOne();
        res.json({ message: 'Brand deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete brand', error: error.message });
    }
};
