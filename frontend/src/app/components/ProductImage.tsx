'use client';

import { useState } from 'react';

interface ProductImageProps {
    src: string;
    alt: string;
    className?: string; // Allow passing styles/classes
    style?: React.CSSProperties;
}

export default function ProductImage({ src, alt, style }: ProductImageProps) {
    const [imgSrc, setImgSrc] = useState(src);

    return (
        <img
            src={imgSrc}
            alt={alt}
            style={style}
            onError={() => setImgSrc('https://placehold.co/600x600/e2e8f0/64748B.png?text=No+Image')}
        />
    );
}
