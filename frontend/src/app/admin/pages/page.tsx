'use client';

import React from 'react';
import Link from 'next/link';
import { FiEdit2, FiExternalLink, FiLayout, FiPlus } from 'react-icons/fi';
import './pages.css';

const PAGES = [
    {
        id: 'home',
        name: 'Home Page',
        path: '/',
        builderPath: '/admin/page-builder/home',
        status: 'Active',
        lastUpdated: 'Today'
    },
    {
        id: 'about',
        name: 'About Us',
        path: '/about',
        builderPath: '/admin/page-builder/about',
        status: 'Inactive',
        lastUpdated: 'Never'
    },
    {
        id: 'categories',
        name: 'Categories Page',
        path: '/categories',
        builderPath: '/admin/page-builder/categories',
        status: 'Active',
        lastUpdated: 'Just Now'
    },
    {
        id: 'products',
        name: 'Products Listing',
        path: '/products',
        builderPath: '/admin/page-builder/products',
        status: 'Active',
        lastUpdated: 'Just Now'
    },
    // Future pages placeholder
];

export default function PagesList() {
    return (
        <div className="pages-container">
            <div className="pages-header">
                <div className="pages-title">
                    <h1>Page Builder</h1>
                    <p>Design and customize your storefront pages</p>
                </div>

            </div>

            <div className="pages-grid">
                {PAGES.map((page) => (
                    <div key={page.id} className="page-card">
                        <div className="page-preview">
                            <FiLayout className="page-preview-icon" />
                            <div className={`page-status status-${page.status.toLowerCase()}`}>
                                {page.status}
                            </div>
                        </div>
                        <div className="page-content">
                            <h3 className="page-name">{page.name}</h3>
                            <div>
                                <span className="page-url">{page.path}</span>
                            </div>
                            <div className="page-actions">
                                <Link href={page.path} target="_blank" className="btn btn-secondary">
                                    <FiExternalLink /> View Live
                                </Link>
                                <Link href={page.builderPath} className="btn btn-primary">
                                    <FiEdit2 /> Customize
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {PAGES.length === 0 && (
                <div className="p-10 text-center text-gray-500">
                    No pages found. Start by creating a new one.
                </div>
            )}
        </div>
    );
}
