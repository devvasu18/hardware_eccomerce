import Link from 'next/link';
import NewArrivalsSlider from './NewArrivalsSlider';
import './NewArrivals.css';

interface Product {
    _id: string;
    name: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: string;
    imageUrl?: string;
    images: string[];
    isOnDemand: boolean;
}

async function getNewArrivals(): Promise<Product[]> {
    const res = await fetch('http://localhost:5000/api/products/new-arrivals?limit=10', { cache: 'no-store' });
    if (!res.ok) {
        return [];
    }
    return res.json();
}

export default async function NewArrivals() {
    const products = await getNewArrivals();

    if (products.length === 0) return null;

    return (
        <section className="container new-arrivals-section" style={{ overflow: 'visible' }}>
            <div className="new-arrivals-header">
                <div>
                    <h2 className="new-arrivals-title">New Arrivals</h2>
                    <p className="new-arrivals-subtitle">Check out our latest industrial hardware and tools</p>
                </div>
                <Link href="/new-arrivals" className="view-all-btn">
                    View All &rarr;
                </Link>
            </div>

            <NewArrivalsSlider products={products} />
        </section>
    );
}

