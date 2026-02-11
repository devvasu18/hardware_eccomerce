'use client';
import React, { useEffect, useState, Suspense, lazy } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

// Lazy load components for performance
const HeroSlider = lazy(() => import('@/app/components/HeroSlider'));
const CategorySection = lazy(() => import('@/app/components/CategorySection'));
const BrandsSection = lazy(() => import('@/app/components/BrandsSection'));
const FeaturedProducts = lazy(() => import('@/app/components/FeaturedProducts'));
const NewArrivals = lazy(() => import('@/app/components/NewArrivals'));
const SpecialOffers = lazy(() => import('@/app/components/SpecialOffers'));
const WhyChooseUs = lazy(() => import('@/app/components/WhyChooseUs'));
const CategoryProductListing = lazy(() => import('@/app/components/CategoryProductListing'));

const RecentlyViewed = lazy(() => import('@/app/components/RecentlyViewed'));
const Recommended = lazy(() => import('@/app/components/RecommendedProducts'));
const DealOfTheDay = lazy(() => import('@/app/components/DealOfTheDay'));
const FlashSale = () => <div className="p-10 text-center bg-gray-100 my-4 rounded-xl">Flash Sale Component (Coming Soon)</div>;
const TrustBadges = lazy(() => import('@/app/components/WhyChooseUs')); // Reuse WhyChooseUs or separate? WhyChooseUs seems to handle trust badges.
const Testimonials = () => <div className="p-10 text-center bg-gray-100 my-4 rounded-xl">Testimonials Component (Coming Soon)</div>;

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
    'TESTIMONIALS': Testimonials
};

const SectionPlaceholder = () => (
    <div className="w-full h-64 bg-gray-50 flex items-center justify-center animate-pulse border-y border-gray-100 my-4">
        <div className="w-20 h-20 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
);

const HomeRenderer = ({ previewLayout }: { previewLayout?: any[] }) => {
    const [layout, setLayout] = useState<any[]>(previewLayout || []);
    const [loading, setLoading] = useState(!previewLayout);
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchLayout = async () => {
            if (previewLayout) return; // Skip if preview data provided
            try {
                const response = await fetch('http://localhost:5000/api/home-layout');
                const data = await response.json();
                setLayout(data);
            } catch (error) {
                console.error('Error fetching home layout:', error);
            } finally {
                setLoading(false);
            }
        };

        const fetchFeatured = async () => {
            try {
                const res = await fetch('http://localhost:5000/api/products/featured');
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
            }
        };

        fetchLayout();
        fetchFeatured();
    }, [previewLayout]);

    if (loading) {
        return (
            <main>
                <Header />
                <SectionPlaceholder />
                <SectionPlaceholder />
                <SectionPlaceholder />
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
