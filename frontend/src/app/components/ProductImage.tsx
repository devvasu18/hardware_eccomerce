'use client';

import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface ProductImageProps {
    src: string;
    alt: string;
    className?: string; // Allow passing styles/classes
    style?: React.CSSProperties;
}

export default function ProductImage({ src, alt, style }: ProductImageProps) {
    const { t } = useLanguage();
    const formatSrc = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http') || url.startsWith('data:')) return url;
        // Remove leading slash if present to avoid double slashes when appending
        const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
        return `/${cleanUrl}`;
    };

    const formattedSrc = formatSrc(src);

    return (
        <img
            src={formattedSrc}
            alt={alt}
            style={style}
            onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://placehold.co/600x600/e2e8f0/64748B.png?text=${t('no_image')}`;
            }}
        />
    );
}
