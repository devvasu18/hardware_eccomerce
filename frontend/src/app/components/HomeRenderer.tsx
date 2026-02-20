'use client';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import Loader from '@/app/components/Loader';
import { useLanguage } from '@/context/LanguageContext';
import HomeSkeleton from '@/app/components/skeletons/HomeSkeleton';

// Lazy load components for performance
const HeroSlider = lazy(() => import('@/app/components/HeroSlider'));
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

// Replaced ugly skeleton with invisible placeholder for smoother transition
const SectionPlaceholder = () => (
    <div className="w-full h-96 bg-transparent animate-pulse" />
);

const HomeRenderer = ({ previewLayout, pageSlug = 'home' }: { previewLayout?: any[], pageSlug?: string }) => {
    const { t } = useLanguage();
    const [layout, setLayout] = useState<any[]>(previewLayout || []);
    const [loading, setLoading] = useState(!previewLayout); // If no preview layout, we are loading
    const [hasError, setHasError] = useState(false);
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

    // Signal Android that the Web App Shell is ready (Header + Skeleton painted)
    useEffect(() => {
        if (typeof window !== 'undefined' && (window as any).Android && (window as any).Android.onAppReady) {
            // Small delay to ensure paint
            setTimeout(() => {
                (window as any).Android.onAppReady();
            }, 100);
        }
    }, []);

    const fetchData = async () => {
        setLoading(true);
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
            // Artificial delay not needed for UX, but maybe for smooth transition? 
            // Removing it for performance.
        } catch (error: any) {
            console.error('Error fetching layout:', error);
            if (typeof window !== 'undefined') {
                setHasError(true);
            } else {
                setLayout([]);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchFeatured = async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const res = await fetch('/api/products/featured', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                setFeaturedProducts(data.map((p: any) => ({
                    ...p,
                    basePrice: p.mrp || p.basePrice,
                    discountedPrice: p.selling_price_a || p.discountedPrice,
                    title: p.title || p.name,
                    name: p.title || p.name
                })));
            }
        } catch (error) {
            // Silently fail
        }
    };

    useEffect(() => {
        if (previewLayout) {
            setLayout(previewLayout);
            setLoading(false);
            fetchFeatured();
        } else {
            // Only fetch if no preview layout provided (Client-side fetch)
            fetchData();
            fetchFeatured();
        }
    }, [previewLayout, pageSlug]);


    if (hasError) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                <div className="flex-grow flex items-center justify-center">
                    <div className="text-center p-4">
                        <p>{t('server_unreachable')}</p>
                        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-brand-primary text-white rounded">
                            {t('retry')}
                        </button>
                    </div>
                </div>
                {/* Show footer even on error? Maybe not. */}
            </main>
        );
    }

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            {loading ? (
                <HomeSkeleton />
            ) : (
                <>
                    {layout.length === 0 ? (
                        <div className="flex-grow flex items-center justify-center min-h-[50vh]">
                            <div className="text-center">
                                <h2 className="text-2xl font-bold text-gray-400" suppressHydrationWarning>{t('under_maintenance')}</h2>
                                <p className="text-gray-500 mt-2" suppressHydrationWarning>{t('maintenance_desc')}</p>
                            </div>
                        </div>
                    ) : (
                        layout.map((item) => {
                            const Component = componentMap[item.componentType];
                            if (!Component) return null;

                            let props: any = { config: item.config };
                            if (item.componentType === 'FEATURED_PRODUCTS') {
                                props.products = featuredProducts;
                            }

                            return (
                                <Suspense key={item._id} fallback={<SectionPlaceholder />}>
                                    <Component {...props} />
                                </Suspense>
                            );
                        })
                    )}
                </>
            )}

            {/* Footer only visible after loading to prevent jump */}
            {!loading && <Footer />}
        </main>
    );
};

export default HomeRenderer;
