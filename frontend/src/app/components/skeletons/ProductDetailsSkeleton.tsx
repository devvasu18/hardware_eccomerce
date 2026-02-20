import React from 'react';

const ProductDetailsSkeleton = () => {
    return (
        <div className="w-full pb-20 animate-pulse font-sans">
            {/* Breadcrumb Skeleton */}
            <div className="w-48 h-4 bg-gray-200 dark:bg-gray-800 rounded m-4 mt-20 md:mt-4" />

            <div className="flex flex-col md:flex-row gap-8 p-4">
                {/* Image Gallery Skeleton */}
                <div className="w-full md:w-1/2 flex flex-col gap-4">
                    <div className="w-full h-[300px] md:h-[500px] bg-gray-200 dark:bg-gray-800 rounded-lg" />
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-lg" />
                        ))}
                    </div>
                </div>

                {/* Product Info Skeleton */}
                <div className="w-full md:w-1/2 flex flex-col gap-4">
                    <div className="w-3/4 h-8 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="w-1/2 h-6 bg-gray-200 dark:bg-gray-800 rounded" />

                    <div className="my-4 w-full h-px bg-gray-200 dark:bg-gray-800" />

                    <div className="w-1/4 h-10 bg-gray-200 dark:bg-gray-800 rounded" />
                    <div className="w-full h-24 bg-gray-200 dark:bg-gray-800 rounded" />

                    <div className="flex gap-4 mt-4">
                        <div className="w-1/3 h-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
                        <div className="w-1/3 h-12 bg-gray-200 dark:bg-gray-800 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="m-4 mt-8 flex gap-4 border-b border-gray-200 dark:border-gray-800">
                <div className="w-32 h-10 bg-gray-200 dark:bg-gray-800 rounded-t" />
                <div className="w-32 h-10 bg-gray-200 dark:bg-gray-800 rounded-t" />
            </div>
            <div className="m-4 h-40 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
    );
};

export default ProductDetailsSkeleton;
