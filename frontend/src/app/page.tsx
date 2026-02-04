import Link from 'next/link';
import Header from '@/app/components/Header';
import HeroSlider from '@/app/components/HeroSlider';
import CategorySection from '@/app/components/CategorySection';
import WhyChooseUs from '@/app/components/WhyChooseUs';
import SpecialOffers from '@/app/components/SpecialOffers';
import NewArrivals from '@/app/components/NewArrivals';
import BrandsSection from '@/app/components/BrandsSection';
import FeaturedProducts from '@/app/components/FeaturedProducts';
import Footer from '@/app/components/Footer';

interface Product {
    _id: string;
    name: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: string | { _id: string; name: string };
    imageUrl?: string;
    images: string[];
    isOnDemand: boolean;
}

async function getFeaturedProducts(): Promise<Product[]> {
    const res = await fetch('http://localhost:5000/api/products/featured', { cache: 'no-store' });
    if (!res.ok) {
        throw new Error('Failed to fetch featured products');
    }
    const data = await res.json();
    return data.map((p: any) => ({
        ...p,
        basePrice: p.mrp || p.basePrice,
        discountedPrice: p.selling_price_a || p.discountedPrice,
        title: p.title || p.name,
        name: p.title || p.name
    }));
}

export default async function Home() {
    let featured: Product[] = [];
    try {
        featured = await getFeaturedProducts();
    } catch (e) {
        console.error(e);
    }

    return (
        <main>
            <Header />

            <HeroSlider />

            <CategorySection />

            <BrandsSection />

            <FeaturedProducts products={featured} />

            <NewArrivals />

            <SpecialOffers />

            <WhyChooseUs />

            <Footer />
        </main>
    );
}
