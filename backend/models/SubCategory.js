const mongoose = require('mongoose');

const subCategorySchema = new mongoose.Schema({
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('SubCategory', subCategorySchema);
