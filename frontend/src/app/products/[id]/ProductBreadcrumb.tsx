'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductBreadcrumb({ categoryName }: { categoryName: any }) {
    const { getLocalized } = useLanguage();
    const catName = getLocalized(categoryName);

    return (
        <div className="breadcrumb">
            <Link href="/">HOME</Link>
            <span>/</span>
            <Link href="/products">PRODUCTS</Link>
            <span>/</span>
            <span className="current">{catName ? catName.toUpperCase() : ''}</span>
        </div>
    );
}
