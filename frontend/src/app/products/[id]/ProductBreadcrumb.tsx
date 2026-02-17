'use client';

import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

export default function ProductBreadcrumb({ categoryName }: { categoryName: any }) {
    const { getLocalized, t } = useLanguage();
    const catName = getLocalized(categoryName);

    return (
        <div className="breadcrumb">
            <Link href="/">{t('home')}</Link>
            <span>/</span>
            <Link href="/products">{t('products')}</Link>
            <span>/</span>
            <span className="current">{catName ? catName.toUpperCase() : ''}</span>
        </div>
    );
}
