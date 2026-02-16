/**
 * Utility to generate and ensure unique slugs across models
 */

/**
 * Standard slugify function
 * @param {string} text - The text to slugify
 * @returns {string} - The slugified text
 */
const slugify = (text) => {
    if (!text) return '';
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-')   // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start
        .replace(/-+$/, '');      // Trim - from end
};

/**
 * Ensures a slug is unique within a Mongoose model
 * @param {Object} Model - The Mongoose model to check against
 * @param {string} baseSlug - The proposed slug
 * @param {string|null} currentId - The ID of the document being updated (to exclude it from uniqueness check)
 * @returns {Promise<string>} - A unique slug
 */
const makeUniqueSlug = async (Model, baseSlug, currentId = null) => {
    // If baseSlug is empty, we might need a default, but usually validation handles this
    if (!baseSlug) {
        baseSlug = 'untitled';
    }

    // Escape regex special characters in baseSlug
    const escapedBaseSlug = baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Find all slugs that match baseSlug or baseSlug followed by -number
    const slugRegex = new RegExp(`^${escapedBaseSlug}(-[0-9]+)?$`, 'i');

    const query = { slug: slugRegex };
    if (currentId) {
        query._id = { $ne: currentId };
    }

    const existingDocs = await Model.find(query).select('slug').lean();

    if (existingDocs.length === 0) {
        return baseSlug;
    }

    const slugSet = new Set(existingDocs.map(d => d.slug.toLowerCase()));

    if (!slugSet.has(baseSlug.toLowerCase())) {
        return baseSlug;
    }

    let counter = 1;
    while (slugSet.has(`${baseSlug.toLowerCase()}-${counter}`)) {
        counter++;
    }

    return `${baseSlug}-${counter}`;
};

module.exports = { slugify, makeUniqueSlug };
