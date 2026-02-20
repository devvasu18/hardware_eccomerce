'use client';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import Loader from '@/app/components/Loader';
import { useLanguage } from '@/context/LanguageContext';
import HomeSkeleton, {
    HeroSkeleton,
    CategorySkeleton,
    BannerSkeleton,
    ProductGridSkeleton,
    GenericSectionSkeleton,
    ProductListSkeleton
} from '@/app/components/skeletons/HomeSkeleton';

import HeroSlider from '@/app/components/HeroSlider';
const CategorySection = lazy(() => import('@/app/components/CategorySection'));
const BrandsSection = lazy(() => import('@/app/components/BrandsSection'));
const FeaturedProducts = lazy(() => import('@/app/components/FeaturedProducts'));
const NewArrivals = lazy(() => import('@/app/components/NewArrivals'));
const SpecialOffers = lazy(() => import('@/app/components/SpecialOffers'));
const WhyChooseUs = lazy(() => import('@/app/components/WhyChooseUs'));
const CategoryProductListing = lazy(() => import('@/app/components/CategoryProductListing'));
const AllCategories = lazy(() => import('@/app/components/AllCategories'));
const FilteredProducts = lazy(() => import('@/app/components/FilteredProducts'));
const ImageBanner = lazy(() => import('@/app/components/ImageBanner'));

const RecentlyViewed = lazy(() => import('@/app/components/RecentlyViewed'));
const Recommended = lazy(() => import('@/app/components/RecommendedProducts'));
const DealOfTheDay = lazy(() => import('@/app/components/DealOfTheDay'));
const FlashSale = () => {
    const { t } = useLanguage();
    return <div className="p-10 text-center bg-gray-100 my-4 rounded-xl" suppressHydrationWarning>{t('flash_sale_coming_soon')}</div>;
};
const TrustBadges = lazy(() => import('@/app/components/WhyChooseUs'));
const Testimonials = () => {
    const { t } = useLanguage();
    return <div className="p-10 text-center bg-gray-100 my-4 rounded-xl" suppressHydrationWarning>{t('testimonials_coming_soon')}</div>;
};

const componentMap: Record<string, React.ComponentType<any>> = {
    'HERO_SLIDER': HeroSlider,
    'CATEGORIES': CategorySection,
    'BRANDS': BrandsSection,
    'FEATURED_PRODUCTS': FeaturedProducts,
    'NEW_ARRIVALS': NewArrivals,
    'SPECIAL_OFFERS': SpecialOffers,
    'WHY_CHOOSE_US': WhyChooseUs,
    'CATEGORY_PRODUCTS': CategoryProductListing,
    'FLASH_SALE': FlashSale,
    'RECENTLY_VIEWED': RecentlyViewed,
    'RECOMMENDED': Recommended,
    'DEAL_OF_THE_DAY': DealOfTheDay,
    'TRUST_BADGES': TrustBadges,
    'TESTIMONIALS': Testimonials,
    'ALL_CATEGORIES': AllCategories,
    'PRODUCT_CATALOG': FilteredProducts,
    'IMAGE_BANNER': ImageBanner
};

// Smart Skeleton that matches the component type
const SmartSectionPlaceholder = ({ type, config }: { type: string; config?: any }) => {
    switch (type) {
        case 'HERO_SLIDER':
            return <HeroSkeleton />;
        case 'CATEGORIES':
        case 'ALL_CATEGORIES':
            return <CategorySkeleton />;
        case 'IMAGE_BANNER':
            return <BannerSkeleton config={config} />;
        case 'PRODUCT_CATALOG':
            return <ProductListSkeleton />;
        case 'FEATURED_PRODUCTS':
        case 'NEW_ARRIVALS':
        case 'SPECIAL_OFFERS':
        case 'RECOMMENDED':
        case 'DEAL_OF_THE_DAY':
        case 'CATEGORY_PRODUCTS':
        case 'RECENTLY_VIEWED':
        case 'FLASH_SALE':
            return <ProductGridSkeleton />;
        default:
            return <GenericSectionSkeleton />;
    }
};

import { cache } from '@/utils/cache';

const HomeRenderer = ({ previewLayout, pageSlug = 'home' }: { previewLayout?: any[], pageSlug?: string }) => {
    const { t } = useLanguage();
    const layoutCacheKey = `layout_${pageSlug}`;
    const featuredCacheKey = `featured_products`;

    // Initialize from cache if available to prevent skeleton flicker
    const [layout, setLayout] = useState<any[]>(() => {
        if (previewLayout) return previewLayout;
        const cached = cache.get<any[]>(layoutCacheKey);
        return cached || [];
    });

    const [loading, setLoading] = useState(() => {
        if (previewLayout) return false;
        // If we have cache, we don't show the initial skeleton
        return !cache.get(layoutCacheKey);
    });

    const [hasError, setHasError] = useState(false);
    const [featuredProducts, setFeaturedProducts] = useState<any[]>(() => {
        return cache.get<any[]>(featuredCacheKey) || [];
    });
    const [loadingFeatured, setLoadingFeatured] = useState(() => {
        if (previewLayout) return false;
        return !cache.get(featuredCacheKey);
    });

    // Signal Android that the Web App Shell is ready (Header + Skeleton painted)
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Android && (window as any).Android.onAppReady) {
            // Small delay to ensure paint
            setTimeout(() => {
                (window as any).Android.onAppReady();
            }, 100);
        }
    }, []);

    const fetchData = async (isBackground = false) => {
        if (!isBackground) {
            setLoading(true);
        }
        setHasError(false);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(`/api/home-layout?page=${pageSlug}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();

            setLayout(data);
            // Save to cache (TTL 5 mins for layouts)
            cache.set(layoutCacheKey, data, 5);
        } catch (error: any) {
            console.error('Error fetching layout:', error);
            if (typeof window !== 'undefined') {
                // Only show error if we have no data at all
                if (layout.length === 0) {
                    setHasError(true);
                }
            } else {
                setLayout([]);
            }
        } finally {
            if (!isBackground) {
                setLoading(false);
            }
        }
    };

    const fetchFeatured = async () => {
        setLoadingFeatured(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch('/api/products/featured', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                const processed = data.map((p: any) => ({
                    ...p,
                    basePrice: p.mrp || p.basePrice,
                    discountedPrice: p.selling_price_a || p.discountedPrice,
                    title: p.title || p.name,
                    name: p.title || p.name
                }));
                setFeaturedProducts(processed);
                // Save to cache (TTL 10 mins for products)
                cache.set(featuredCacheKey, processed, 10);
            }
        } catch (error) {
            // Silently fail
        } finally {
            setLoadingFeatured(false);
        }
    };

    useEffect(() => {
        if (previewLayout) {
            setLayout(previewLayout);
            setLoading(false);
            fetchFeatured();
        } else {
            // 1. Check if cache is expired or missing
            const isLayoutExpired = cache.isExpired(layoutCacheKey);
            const isProductExpired = cache.isExpired(featuredCacheKey);

            if (isLayoutExpired || layout.length === 0) {
                // If missing, fetch normally (shows skeleton if layout.length === 0)
                // If expired but present, fetch in background
                fetchData(layout.length > 0);
            }

            if (isProductExpired || featuredProducts.length === 0) {
                fetchFeatured();
            }
        }
    }, [previewLayout, pageSlug]);


    if (hasError) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center p-4">
                        <p>{t('server_unreachable')}</p>
                        <button onClick={() => fetchData()} className="mt-4 px-4 py-2 bg-brand-primary text-white rounded">
                            {t('retry')}
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            {loading ? (
                <HomeSkeleton layout={layout} />
            ) : (
                <>
                    {layout.length === 0 ? (
                        <div className="flex-grow flex items-center justify-center min-h-[50vh]">
                            {/* ... maintenance UI ... */}
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-400" suppressHydrationWarning>{t('under_maintenance')}</h2>
                                <p className="text-gray-500 mt-2" suppressHydrationWarning>{t('maintenance_desc')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow min-h-screen">
                            {/* Wrapper to ensure min height */}
                            {layout.map((item) => {
                                const Component = componentMap[item.componentType];
                                if (!Component) return null;

                                let props: any = { config: item.config };
                                if (item.componentType === 'FEATURED_PRODUCTS') {
                                    props.products = featuredProducts;
                                    props.loading = loadingFeatured;
                                }

                                return (
                                    <Suspense key={item._id} fallback={<SmartSectionPlaceholder type={item.componentType} config={item.config} />}>
                                        <Component {...props} />
                                    </Suspense>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Footer only visible after loading to prevent jump */}
            {!loading && <Footer />}
        </main>
    );
};

export default HomeRenderer;
