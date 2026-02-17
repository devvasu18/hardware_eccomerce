'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '../../context/LanguageContext';

interface ImageBannerProps {
    config?: {
        imageUrl?: string;
        link?: string;
        altText?: string;
        height?: string;
        title?: string;
        subtitle?: string;
        buttonText?: string;
        contentPosition?: 'left' | 'center' | 'right';
        isFullWidth?: boolean;
        overlayOpacity?: number;
    };
}

export default function ImageBanner({ config }: ImageBannerProps) {
    const { t } = useLanguage();
    const imageUrl = config?.imageUrl || 'https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=2070';
    const link = config?.link || '#';
    const altText = config?.altText || t('promotional_banner');
    const height = config?.height || '450px';
    const title = config?.title || '';
    const subtitle = config?.subtitle || '';
    const buttonText = config?.buttonText || '';
    const contentPosition = config?.contentPosition || 'center';
    const isFullWidth = config?.isFullWidth ?? false;
    const overlayOpacity = config?.overlayOpacity ?? 0.4;

    const alignmentClasses = {
        left: 'items-start text-left',
        center: 'items-center text-center',
        right: 'items-end text-right'
    };

    const sectionClass = isFullWidth ? 'w-full py-0' : 'container mx-auto px-4 py-8';
    const roundedClass = isFullWidth ? '' : 'rounded-3xl';

    return (
        <section className={`image-banner-section ${sectionClass}`}>
            <div
                className={`relative overflow-hidden group transition-all duration-500 ${roundedClass}`}
                style={{ height }}
            >
                {/* Background Image */}
                <Image
                    src={imageUrl.startsWith('http') ? imageUrl : `http://localhost:5000/${imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl}`}
                    alt={altText}
                    fill
                    className="object-cover transition-transform duration-1000 group-hover:scale-105"
                    unoptimized
                />

                {/* Overlay Gradient */}
                <div
                    className="absolute inset-0 bg-black"
                    style={{ opacity: overlayOpacity }}
                ></div>

                {/* Content Overlay */}
                {(title || subtitle || buttonText) && (
                    <div className={`absolute inset-0 flex flex-col justify-center p-8 md:p-20 z-10 ${alignmentClasses[contentPosition]}`}>
                        <div className="max-w-3xl animate-fade-in-up">
                            {title && (
                                <h2 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight drop-shadow-lg uppercase">
                                    {title}
                                </h2>
                            )}
                            {subtitle && (
                                <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl drop-shadow-md font-medium">
                                    {subtitle}
                                </p>
                            )}
                            {buttonText && (
                                <Link
                                    href={link}
                                    className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-all hover:scale-105 hover:shadow-2xl active:scale-95"
                                >
                                    {buttonText}
                                </Link>
                            )}
                        </div>
                    </div>
                )}

                {/* Full clickable link if no button text */}
                {!buttonText && (
                    <Link href={link} className="absolute inset-0 z-20"></Link>
                )}
            </div>

            <style jsx>{`
                @keyframes fade-in-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
        </section>
    );
}
