import React from 'react';
import {
    FiImage,
    FiGrid,
    FiLayers,
    FiShoppingBag,
    FiTag,
    FiStar,
    FiClock,
    FiAward,
    FiMessageCircle,
    FiCheckCircle,
    FiList,
    FiTarget,
} from 'react-icons/fi';

export interface ComponentDefinition {
    type: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    category: 'Layout' | 'Product' | 'Content' | 'Marketing';
    defaultConfig?: any;
    origin: 'Home' | 'Product' | 'Global';
}

export const COMPONENT_LIBRARY: ComponentDefinition[] = [
    // --- Layout Components ---
    {
        type: 'HERO_SLIDER',
        name: 'Hero Main Slider',
        description: 'Large, full-width image slider for main announcements.',
        icon: <FiLayers size={24} />,
        category: 'Layout',
        origin: 'Home'
    },
    {
        type: 'CATEGORIES',
        name: 'Categories Circle Slider',
        description: 'Horizontal scrollable list of category icons.',
        icon: <FiGrid size={24} />,
        category: 'Layout',
        origin: 'Home'
    },
    {
        type: 'BRANDS',
        name: 'Brand Partners Grid',
        description: 'Grid layout of partner brand logos.',
        icon: <FiCheckCircle size={24} />,
        category: 'Layout',
        origin: 'Home'
    },

    // --- Product Components ---
    {
        type: 'FEATURED_PRODUCTS',
        name: 'Featured Products Grid',
        description: 'Grid of manually selected or top-rated products.',
        icon: <FiStar size={24} />,
        category: 'Product',
        origin: 'Home'
    },
    {
        type: 'NEW_ARRIVALS',
        name: 'New Arrivals Slider',
        description: 'Slider showing the most recently added products.',
        icon: <FiClock size={24} />,
        category: 'Product',
        origin: 'Home'
    },
    {
        type: 'CATEGORY_PRODUCTS',
        name: 'Category Product Listing',
        description: 'Display products from a specific category.',
        icon: <FiShoppingBag size={24} />,
        category: 'Product',
        origin: 'Home',
        defaultConfig: { limit: 4, sortBy: 'newest' }
    },
    {
        type: 'RECENTLY_VIEWED',
        name: 'Recently Viewed Products',
        description: 'Personalized list showing products user just visited.',
        icon: <FiList size={24} />,
        category: 'Product',
        origin: 'Product'
    },
    {
        type: 'RECOMMENDED',
        name: 'Recommended For You',
        description: 'AI-based recommendations based on viewing history.',
        icon: <FiTarget size={24} />, // FiTarget is now imported
        category: 'Product',
        origin: 'Product'
    },

    // --- Marketing Components ---
    {
        type: 'SPECIAL_OFFERS',
        name: 'Special Offers & Deals',
        description: 'Highlight specific discounts or promotions.',
        icon: <FiTag size={24} />,
        category: 'Marketing',
        origin: 'Home'
    },
    {
        type: 'FLASH_SALE',
        name: 'Flash Sale Countdown',
        description: 'Urgency-inducing countdown timer for specific deals.',
        icon: <FiClock size={24} />,
        category: 'Marketing',
        origin: 'Home'
    },
    {
        type: 'DEAL_OF_THE_DAY',
        name: 'Deal of the Day',
        description: 'Prominent single-product feature with discount.',
        icon: <FiAward size={24} />,
        category: 'Marketing',
        origin: 'Home'
    },

    // --- Content Components ---
    {
        type: 'WHY_CHOOSE_US',
        name: 'Why Choose Us / Trust Badges',
        description: 'Grid of value proposition icons (Fast Shipping, etc).',
        icon: <FiCheckCircle size={24} />,
        category: 'Content',
        origin: 'Global'
    },
    {
        type: 'TESTIMONIALS',
        name: 'Customer Testimonials',
        description: 'Slider or grid of customer reviews.',
        icon: <FiMessageCircle size={24} />,
        category: 'Content',
        origin: 'Global'
    },
    {
        type: 'IMAGE_BANNER',
        name: 'Single Image Banner',
        description: 'Responsive standard graphical banner.',
        icon: <FiImage size={24} />,
        category: 'Content',
        origin: 'Global'
    },
    {
        type: 'ALL_CATEGORIES',
        name: 'Full Categories List',
        description: 'Complete grid of all active product categories.',
        icon: <FiGrid size={24} />,
        category: 'Layout',
        origin: 'Global'
    },
    {
        type: 'PRODUCT_CATALOG',
        name: 'Product Catalog with Filters',
        description: 'The main product listing with sidebar filters and search results.',
        icon: <FiList size={24} />,
        category: 'Product',
        origin: 'Global'
    }
];

// Helper to get definition by type
export const getComponentDefinition = (type: string) =>
    COMPONENT_LIBRARY.find(c => c.type === type);
