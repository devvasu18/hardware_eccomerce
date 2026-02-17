'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import { useLanguage } from '../../context/LanguageContext';
import './ProductFilters.css';

interface Category {
    _id: string;
    name: string;
    slug: string;
}

interface Brand {
    _id: string;
    name: string;
    slug: string;
}

interface SubCategory {
    _id: string;
    name: string;
    slug: string;
}

interface ProductFiltersProps {
    initialCategories: Category[];
    initialBrands: Brand[];
}

export default function ProductFilters({ initialCategories = [], initialBrands = [] }: ProductFiltersProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { t } = useLanguage();

    // State from URL
    const currentCategory = searchParams.get('category');
    const currentSubCategory = searchParams.get('subcategory');
    const currentBrand = searchParams.get('brand');
    const currentKeyword = searchParams.get('keyword');

    // Local state
    const [localSearch, setLocalSearch] = useState(currentKeyword || '');
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [inStock, setInStock] = useState(searchParams.get('inStock') === 'true');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'newest');

    // Use props directly
    const categories = initialCategories;
    const brands = initialBrands;

    // Sync local search with URL
    useEffect(() => {
        setLocalSearch(currentKeyword || '');
    }, [currentKeyword]);

    // Fetch Subcategories when category is selected
    useEffect(() => {
        const fetchSubcategories = async () => {
            if (currentCategory) {
                try {
                    const res = await fetch(`/api/categories/${currentCategory}/subcategories`);
                    if (res.ok) {
                        const data = await res.json();
                        setSubcategories(data);
                    } else {
                        setSubcategories([]);
                    }
                } catch (e) {
                    console.error("Failed to fetch subcategories", e);
                    setSubcategories([]);
                }
            } else {
                setSubcategories([]);
            }
        };
        fetchSubcategories();
    }, [currentCategory]);

    const updateFilter = (type: string, value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value !== null && value !== '') {
            params.set(type, value);
        } else {
            params.delete(type);
        }

        // If changing category, reset subcategory
        if (type === 'category') {
            params.delete('subcategory');
        }

        // Reset page on filter change
        params.delete('page');

        router.push(`/products?${params.toString()}`);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateFilter('keyword', localSearch);
    };

    return (
        <>
            {/* Mobile Filter Toggle */}
            <button className="mobile-filter-toggle" onClick={() => setIsMobileOpen(true)}>
                <FiFilter /> {t('filters')}
            </button>

            <aside className={`filters-sidebar ${isMobileOpen ? 'open' : ''}`}>
                <div className="filters-header">
                    <h3>{t('filters')}</h3>
                    <button className="close-filters" onClick={() => setIsMobileOpen(false)}>
                        <FiX />
                    </button>
                </div>

                {/* 1. Refine Search (The "Second" Search Bar) */}
                <div className="filter-group search-group">
                    <form onSubmit={handleSearchSubmit} className="refine-search-form">
                        <input
                            type="text"
                            placeholder={t('refine_results')}
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="refine-input"
                        />
                        <button type="submit" className="refine-btn">{t('go')}</button>
                    </form>
                </div>

                {/* Sort By */}
                <div className="filter-group">
                    <h4>{t('sort_by')}</h4>
                    <select
                        className="filter-select"
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value);
                            updateFilter('sort', e.target.value);
                        }}
                    >
                        <option value="newest">{t('sort_newest')}</option>
                        <option value="price_asc">{t('sort_price_low_high')}</option>
                        <option value="price_desc">{t('sort_price_high_low')}</option>
                        <option value="name_asc">{t('sort_name_az')}</option>
                    </select>
                </div>

                {/* Availability */}
                <div className="filter-group">
                    <h4>{t('availability')}</h4>
                    <div
                        className="availability-toggle"
                        onClick={() => {
                            const newValue = !inStock;
                            setInStock(newValue);
                            updateFilter('inStock', newValue ? 'true' : null);
                        }}
                    >
                        <span className="toggle-label">{t('in_stock_only')}</span>
                        <div className={`toggle-switch ${inStock ? 'on' : ''}`}>
                            <div className="toggle-knob"></div>
                        </div>
                    </div>
                </div>

                {/* Price Range */}
                <div className="filter-group">
                    <h4>{t('price_range')}</h4>
                    <div className="price-range-container">
                        <div className="price-inputs">
                            <div className="price-input-field">
                                <label>{t('min')}</label>
                                <input
                                    type="number"
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    onBlur={() => updateFilter('minPrice', minPrice)}
                                    placeholder="0"
                                />
                            </div>
                            <span className="price-separator">-</span>
                            <div className="price-input-field">
                                <label>{t('max')}</label>
                                <input
                                    type="number"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    onBlur={() => updateFilter('maxPrice', maxPrice)}
                                    placeholder="50000"
                                />
                            </div>
                        </div>
                        {/* Simple range slider for visual feedback */}
                        <div className="price-slider-wrapper">
                            <input
                                type="range"
                                min="0"
                                max="50000"
                                step="100"
                                value={maxPrice || 50000}
                                onChange={(e) => {
                                    setMaxPrice(e.target.value);
                                }}
                                onMouseUp={() => updateFilter('maxPrice', maxPrice)}
                                onTouchEnd={() => updateFilter('maxPrice', maxPrice)}
                                className="range-slider"
                            />
                        </div>
                    </div>
                </div>

                {/* 2. Categories */}
                <div className="filter-group">
                    <h4>{t('categories')}</h4>
                    <div className="filter-list">
                        <label className={`filter-item ${!currentCategory ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="category"
                                checked={!currentCategory}
                                onChange={() => updateFilter('category', null)}
                            />
                            <span>{t('all_categories')}</span>
                        </label>
                        {categories.map(cat => (
                            <React.Fragment key={cat._id}>
                                <label className={`filter-item ${currentCategory === cat.slug ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={currentCategory === cat.slug}
                                        onChange={() => { }}
                                        onClick={() => updateFilter('category', currentCategory === cat.slug ? null : cat.slug)}
                                    />
                                    <span>{cat.name}</span>
                                </label>

                                {/* Render Subcategories if this category is selected */}
                                {currentCategory === cat.slug && subcategories.length > 0 && (
                                    <div className="sub-category-list">
                                        {subcategories.map(sub => (
                                            <label key={sub._id} className={`filter-item sub-item ${currentSubCategory === sub.slug ? 'active' : ''}`}>
                                                <input
                                                    type="radio"
                                                    name="subcategory"
                                                    checked={currentSubCategory === sub.slug}
                                                    onChange={() => { }}
                                                    onClick={() => updateFilter('subcategory', currentSubCategory === sub.slug ? null : sub.slug)}
                                                />
                                                <span>{sub.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                {/* 3. Brands */}
                <div className="filter-group">
                    <h4>{t('brands')}</h4>
                    <div className="filter-list">
                        <label className={`filter-item ${!currentBrand ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="brand"
                                checked={!currentBrand}
                                onChange={() => updateFilter('brand', null)}
                            />
                            <span>{t('all_brands')}</span>
                        </label>
                        {brands.map(brand => (
                            <label key={brand._id} className={`filter-item ${currentBrand === (brand.slug || brand.name) || currentBrand === brand._id ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="brand"
                                    checked={currentBrand === (brand.slug || brand.name) || currentBrand === brand._id}
                                    onChange={() => { }}
                                    onClick={() => {
                                        const isSelected = currentBrand === (brand.slug || brand.name) || currentBrand === brand._id;
                                        updateFilter('brand', isSelected ? null : (brand.slug || brand.name));
                                    }}
                                />
                                <span>{brand.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileOpen && <div className="filters-overlay" onClick={() => setIsMobileOpen(false)}></div>}
        </>
    );
}
