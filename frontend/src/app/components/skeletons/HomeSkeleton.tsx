import React from 'react';

const Shimmer = () => (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
);

export const HeroSkeleton = () => (
    <div className="relative w-full h-[200px] md:h-[400px] bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <Shimmer />
    </div>
);

export const CategorySkeleton = () => (
    <div className="flex overflow-x-auto gap-4 p-4 no-scrollbar">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center">
                <div className="relative w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 mb-2 overflow-hidden">
                    <Shimmer />
                </div>
                <div className="relative w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
                    <Shimmer />
                </div>
            </div>
        ))}
    </div>
);

export const BannerSkeleton = ({ config }: { config?: any }) => {
    if (!config) {
        return (
            <div className="relative mx-4 h-32 md:h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl my-4 overflow-hidden">
                <Shimmer />
            </div>
        );
    }

    const height = config.height || '450px';
    const isFullWidth = config.isFullWidth ?? false;

    const sectionClass = isFullWidth ? 'w-full py-0' : 'container mx-auto px-4 py-8';
    const roundedClass = isFullWidth ? '' : 'rounded-3xl';

    return (
        <section className={`image-banner-section ${sectionClass}`}>
            <div
                className={`relative bg-gray-200 dark:bg-gray-800 overflow-hidden ${roundedClass}`}
                style={{ height }}
            >
                <Shimmer />
            </div>
        </section>
    );
};

export const ProductGridSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="relative bg-white dark:bg-gray-900 rounded-2xl p-3 h-72 flex flex-col border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="relative w-full h-36 bg-gray-100 dark:bg-gray-800 rounded-xl mb-3 overflow-hidden">
                    <Shimmer />
                </div>
                <div className="relative w-full h-4 bg-gray-100 dark:bg-gray-800 rounded mb-2 overflow-hidden">
                    <Shimmer />
                </div>
                <div className="relative w-2/3 h-4 bg-gray-100 dark:bg-gray-800 rounded mb-2 overflow-hidden">
                    <Shimmer />
                </div>
                <div className="relative w-1/2 h-5 bg-gray-200 dark:bg-gray-700 rounded-lg mt-auto overflow-hidden">
                    <Shimmer />
                </div>
            </div>
        ))}
    </div>
);

export const GenericSectionSkeleton = () => (
    <div className="relative w-full h-64 bg-gray-100 dark:bg-gray-800 my-4 overflow-hidden">
        <Shimmer />
    </div>
);

interface HomeSkeletonProps {
    layout?: any[];
}

const HomeSkeleton = ({ layout }: HomeSkeletonProps) => {
    // If we have a layout (from cache), reconstruct the skeleton based on it
    if (layout && layout.length > 0) {
        return (
            <div className="w-full pb-20 animate-pulse">
                {layout.map((item, idx) => {
                    const type = item.componentType;
                    switch (type) {
                        case 'HERO_SLIDER': return <HeroSkeleton key={idx} />;
                        case 'CATEGORIES':
                        case 'ALL_CATEGORIES': return <CategorySkeleton key={idx} />;
                        case 'IMAGE_BANNER': return <BannerSkeleton key={idx} config={item.config} />;
                        case 'FEATURED_PRODUCTS':
                        case 'NEW_ARRIVALS':
                        case 'SPECIAL_OFFERS':
                        case 'RECOMMENDED':
                        case 'DEAL_OF_THE_DAY':
                        case 'CATEGORY_PRODUCTS':
                        case 'PRODUCT_CATALOG':
                        case 'RECENTLY_VIEWED':
                        case 'FLASH_SALE':
                            return <ProductGridSkeleton key={idx} />;
                        default:
                            return <GenericSectionSkeleton key={idx} />;
                    }
                })}
            </div>
        );
    }

    // Default static fallback skeleton
    return (
        <div className="w-full pb-20 animate-pulse">
            <HeroSkeleton />
            <div className="container mx-auto">
                <CategorySkeleton />
                <BannerSkeleton />
                <div className="p-4"><div className="w-48 h-8 bg-gray-200 dark:bg-gray-800 rounded-lg mb-4" /></div>
                <ProductGridSkeleton />
                <BannerSkeleton />
            </div>
        </div>
    );
};

export default HomeSkeleton;
