'use client';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import Loader from '@/app/components/Loader';
import { useLanguage } from '@/context/LanguageContext';

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
const TrustBadges = lazy(() => import('@/app/components/WhyChooseUs')); // Reuse WhyChooseUs or separate? WhyChooseUs seems to handle trust badges.
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
    const [loading, setLoading] = useState(!previewLayout);
    const [hasError, setHasError] = useState(false);
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

    const fetchData = async () => {
        setLoading(true);
        setHasError(false);

        try {
            // Add timeout for build-time to prevent hanging
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            // Fetch specific page layout
            const response = await fetch(`/api/home-layout?page=${pageSlug}`, {
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setLayout(data);

            // Artificial delay to show off the loader if it was too fast, or ensure smooth transition
            await new Promise(resolve => setTimeout(resolve, 800));
        } catch (error: any) {
            console.error('Error fetching layout:', error);
            // Don't set error during build time (when window is undefined during SSR)
            if (typeof window !== 'undefined') {
                setHasError(true);
            } else {
                // During build, just set empty layout
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
            console.error('Error fetching featured products:', error);
            // Silently fail during build
        }
    };

    useEffect(() => {
        if (previewLayout) {
            setLayout(previewLayout);
            setLoading(false);
            // Fetch featured products even if layout is provided
            fetchFeatured();
        } else {
            fetchData();
            fetchFeatured();
        }
    }, [previewLayout, pageSlug]);


    if (loading) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                <Loader onRetry={fetchData} />
                <div className="flex-grow"></div>
                <Footer />
            </main>
        );
    }

    if (hasError) {
        return (
            <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                <Loader status="error" text={t('server_unreachable')} onRetry={fetchData} />
                <div className="flex-grow"></div>
                <Footer />
            </main>
        );
    }

    // Handle empty layout (connected but no content)
    if (layout.length === 0) {
        // Optionally show a "Maintenance" or just keep the loader
        return (
            <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Header />
                <div className="flex-grow flex items-center justify-center min-h-[50vh]">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-400" suppressHydrationWarning>{t('under_maintenance')}</h2>
                        <p className="text-gray-500 mt-2" suppressHydrationWarning>{t('maintenance_desc')}</p>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main>
            <Header />

            {layout.map((item) => {
                const Component = componentMap[item.componentType];
                if (!Component) return null;

                // Pass specific props based on component type if needed
                let props: any = { config: item.config };

                if (item.componentType === 'FEATURED_PRODUCTS') {
                    props.products = featuredProducts;
                }

                return (
                    <Suspense key={item._id} fallback={<SectionPlaceholder />}>
                        <Component {...props} />
                    </Suspense>
                );
            })}

            <Footer />
        </main>
    );
};

export default HomeRenderer;
