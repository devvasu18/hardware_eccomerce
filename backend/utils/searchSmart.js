/**
 * Smart Search Utility for Product Discovery
 * Implements Fuzzy Search and Relevance Ranking
 */
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

/**
 * Fuzzy search logic for improving result quality
 */
async function advancedSearch(keyword, queryOptions = {}) {
    if (!keyword) return { products: [], count: 0 };

    const { limit = 20, page = 1 } = queryOptions;
    const skip = (page - 1) * limit;

    // Normalize keyword
    const cleanKeyword = keyword.trim();

    // Stage 1: Try Text Search (Handles Stemming & Weights)
    // We use the text index defined in Product.js
    let searchResults = await Product.find(
        {
            $text: { $search: cleanKeyword },
            isVisible: true
        },
        { score: { $meta: "textScore" } }
    )
        .sort({ score: { $meta: "textScore" } })
        .populate('category', 'name')
        .populate('brand', 'name')
        .limit(limit)
        .skip(skip);

    let count = await Product.countDocuments({ $text: { $search: cleanKeyword }, isVisible: true });

    // Stage 2: Fallback to Fuzzy Regex if stage 1 yielded poor results
    // Useful for partial words or terms not handled well by stemming (like "dril" for "drill")
    if (searchResults.length < 5) {
        // Create fuzzy patterns
        // 1. Partial Match (contains)
        const partialRegex = new RegExp(cleanKeyword, 'i');

        // 2. Character skipping (simple typo tolerance)
        // e.g. "drill" matches "dril"
        const fuzzyPattern = cleanKeyword.split('').join('.*');
        const fuzzyRegex = new RegExp(fuzzyPattern, 'i');

        const existingIds = searchResults.map(p => p._id);

        const fuzzyResults = await Product.find({
            _id: { $nin: existingIds },
            isVisible: true,
            $or: [
                { title: partialRegex },
                { title: fuzzyRegex },
                { keywords: partialRegex }
            ]
        })
            .populate('category', 'name')
            .populate('brand', 'name')
            .limit(limit - searchResults.length);

        searchResults = [...searchResults, ...fuzzyResults];

        // Update count estimate (rough)
        if (count < 5) {
            count += fuzzyResults.length;
        }
    }

    // Stage 3: Suggestions if nothing found (Trending Products)
    let suggested = false;
    if (searchResults.length === 0) {
        suggested = true;
        searchResults = await Product.find({ isVisible: true, isFeatured: true })
            .populate('category', 'name')
            .populate('brand', 'name')
            .limit(4);
    }

    return {
        products: searchResults,
        count: count,
        suggested: suggested
    };
}

/**
 * Simple Recommendation Engine (Content-Based)
 * Recommends products based on similarity to a reference product
 */
async function getRecommendations(productId, limit = 4) {
    try {
        const product = await Product.findById(productId);
        if (!product) return [];

        // Find products in same category or brand, excluding current one
        const recommended = await Product.find({
            _id: { $ne: productId },
            isVisible: true,
            $or: [
                { category: product.category },
                { brand: product.brand },
                { keywords: { $in: product.keywords || [] } }
            ]
        })
            .limit(limit)
            .populate('category', 'name')
            .populate('brand', 'name');

        return recommended;
    } catch (error) {
        console.error('Recommendation Error:', error);
        return [];
    }
}

module.exports = {
    advancedSearch,
    getRecommendations
};
