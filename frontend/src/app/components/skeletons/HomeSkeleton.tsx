import React from 'react';

export const HeroSkeleton = () => (
    <div className="w-full h-[200px] md:h-[400px] bg-gray-200 dark:bg-gray-800 animate-pulse" />
);

export const CategorySkeleton = () => (
    <div className="flex overflow-x-auto gap-4 p-4 no-scrollbar animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex-shrink-0 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 mb-2" />
                <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
            </div>
        ))}
    </div>
);

export const BannerSkeleton = () => (
    <div className="mx-4 h-32 md:h-64 bg-gray-200 dark:bg-gray-800 rounded-lg my-4 animate-pulse" />
);

export const ProductGridSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-2 h-64 flex flex-col border border-gray-100 dark:border-gray-800">
                <div className="w-full h-32 bg-gray-200 dark:bg-gray-800 rounded-md mb-2" />
                <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-800 rounded mt-auto" />
            </div>
        ))}
    </div>
);

export const GenericSectionSkeleton = () => (
    <div className="w-full h-64 bg-gray-100 dark:bg-gray-800 animate-pulse my-4" />
);

const HomeSkeleton = () => {
    return (
        <div className="w-full pb-20">
            <HeroSkeleton />
            <CategorySkeleton />
            <BannerSkeleton />
            <ProductGridSkeleton />
            <BannerSkeleton />
            {/* Extra space to push footer down */}
            <div className="h-20" />
        </div>
    );
};

export default HomeSkeleton;
