import Link from 'next/link';
import Header from '@/app/components/Header';
import HeroSlider from '@/app/components/HeroSlider';
import CategorySection from '@/app/components/CategorySection';
import WhyChooseUs from '@/app/components/WhyChooseUs';
import SpecialOffers from '@/app/components/SpecialOffers';
import NewArrivals from '@/app/components/NewArrivals';
import BrandsSection from '@/app/components/BrandsSection';
import FeaturedProducts from '@/app/components/FeaturedProducts';

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
    return res.json();
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

            <BrandsSection />

            <CategorySection />

            <FeaturedProducts products={featured} />

            <NewArrivals />

            <SpecialOffers />

            <WhyChooseUs />

            <footer>
                <div className="container" style={{ textAlign: 'center', opacity: 0.8 }}>
                    <p>&copy; 2026 Selfmade Industrial Systems. All rights reserved.</p>
                    <p style={{ fontSize: '0.875rem', marginTop: '1rem' }}>Tally Connected | Local Bus Logistics Integrated</p>
                </div>
            </footer>
        </main>
    );
}
