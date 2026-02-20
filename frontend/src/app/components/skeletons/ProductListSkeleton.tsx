import React from 'react';

const Shimmer = () => (
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
);

const ProductListSkeleton = () => {
    return (
        <div className="container products-content-container py-10">
            <div className="products-page-layout flex gap-8">
                {/* Sidebar Filter Skeleton */}
                <aside className="hidden lg:block w-72 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 animate-pulse">
                        <div className="relative w-1/2 h-6 bg-gray-200 dark:bg-gray-800 rounded mb-6 overflow-hidden"><Shimmer /></div>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="relative w-full h-10 bg-gray-100 dark:bg-gray-800 rounded mb-3 overflow-hidden">
                                <Shimmer />
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Product Grid Skeleton */}
                <section className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
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
                </section>
            </div>
        </div>
    );
};

export default ProductListSkeleton;
