import React from 'react';

const HomeSkeleton = () => {
    return (
        <div className="w-full pb-20 animate-pulse">
            {/* Hero Skeleton */}
            <div className="w-full h-[200px] md:h-[400px] bg-gray-200 dark:bg-gray-800" />

            {/* Categories Circle Skeleton */}
            <div className="flex overflow-x-auto gap-4 p-4 no-scrollbar">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex-shrink-0 flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-800 mb-2" />
                        <div className="w-12 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
                    </div>
                ))}
            </div>

            {/* Banner Skeleton */}
            <div className="mx-4 h-32 bg-gray-200 dark:bg-gray-800 rounded-lg my-4" />

            {/* Product Grid Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-2 h-64 flex flex-col border border-gray-100 dark:border-gray-800">
                        <div className="w-full h-32 bg-gray-200 dark:bg-gray-800 rounded-md mb-2" />
                        <div className="w-3/4 h-4 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                        <div className="w-1/2 h-4 bg-gray-200 dark:bg-gray-800 rounded mt-auto" />
                    </div>
                ))}
            </div>

            {/* Banner Skeleton 2 */}
            <div className="mx-4 h-32 bg-gray-200 dark:bg-gray-800 rounded-lg my-4" />
        </div>
    );
};

export default HomeSkeleton;
