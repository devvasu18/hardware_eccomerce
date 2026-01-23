import Link from 'next/link';
import Header from '@/app/components/Header';
import ProductCard from '@/app/components/ProductCard';
import HeroSlider from '@/app/components/HeroSlider';
import CategorySection from '@/app/components/CategorySection';
import WhyChooseUs from '@/app/components/WhyChooseUs';
import SpecialOffers from '@/app/components/SpecialOffers';
import NewArrivals from '@/app/components/NewArrivals';
import BrandsSection from '@/app/components/BrandsSection';

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

            <section className="container" style={{ padding: '4rem 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h2>Featured Products</h2>
                    <Link href="/products" style={{ color: 'var(--primary)', fontWeight: 600 }}>View All &rarr;</Link>
                </div>

                <div className="grid">
                    {featured.length === 0 ? (
                        <p>No products available at the moment. Please check backend connection.</p>
                    ) : featured.map((item) => (
                        <ProductCard key={item._id} product={item} />
                    ))}
                </div>
            </section>

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
