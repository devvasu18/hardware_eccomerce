'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
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

    // State from URL
    const currentCategory = searchParams.get('category');
    const currentSubCategory = searchParams.get('subcategory');
    const currentBrand = searchParams.get('brand');
    const currentKeyword = searchParams.get('keyword');

    // Local state
    const [localSearch, setLocalSearch] = useState(currentKeyword || '');
    const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

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
                    const res = await fetch(`http://localhost:5000/api/categories/${currentCategory}/subcategories`);
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

    const updateFilter = (type: 'category' | 'subcategory' | 'brand' | 'keyword', value: string | null) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
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
                <FiFilter /> Filters
            </button>

            <aside className={`filters-sidebar ${isMobileOpen ? 'open' : ''}`}>
                <div className="filters-header">
                    <h3>Filters</h3>
                    <button className="close-filters" onClick={() => setIsMobileOpen(false)}>
                        <FiX />
                    </button>
                </div>

                {/* 1. Refine Search (The "Second" Search Bar) */}
                <div className="filter-group search-group">
                    <form onSubmit={handleSearchSubmit} className="refine-search-form">
                        <input
                            type="text"
                            placeholder="Refine results..."
                            value={localSearch}
                            onChange={(e) => setLocalSearch(e.target.value)}
                            className="refine-input"
                        />
                        <button type="submit" className="refine-btn">Go</button>
                    </form>
                </div>

                {/* 2. Categories */}
                <div className="filter-group">
                    <h4>Categories</h4>
                    <div className="filter-list">
                        <label className={`filter-item ${!currentCategory ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="category"
                                checked={!currentCategory}
                                onChange={() => updateFilter('category', null)}
                            />
                            <span>All Categories</span>
                        </label>
                        {categories.map(cat => (
                            <React.Fragment key={cat._id}>
                                <label className={`filter-item ${currentCategory === cat.slug ? 'active' : ''}`}>
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={currentCategory === cat.slug}
                                        onChange={() => updateFilter('category', cat.slug)}
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
                                                    onChange={() => updateFilter('subcategory', sub.slug)}
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
                    <h4>Brands</h4>
                    <div className="filter-list">
                        <label className={`filter-item ${!currentBrand ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="brand"
                                checked={!currentBrand}
                                onChange={() => updateFilter('brand', null)}
                            />
                            <span>All Brands</span>
                        </label>
                        {brands.map(brand => (
                            <label key={brand._id} className={`filter-item ${currentBrand === (brand.slug || brand.name) || currentBrand === brand._id ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="brand"
                                    checked={currentBrand === (brand.slug || brand.name) || currentBrand === brand._id} // Handle robust checking
                                    onChange={() => updateFilter('brand', brand.slug || brand.name)}
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
