import Header from '@/app/components/Header';
import ProductCard from '@/app/components/ProductCard';

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

async function getAllNewArrivals(): Promise<Product[]> {
    const res = await fetch('http://localhost:5000/api/products/new-arrivals', { cache: 'no-store' });
    if (!res.ok) {
        return [];
    }
    return res.json();
}

export default async function NewArrivalsPage() {
    const products = await getAllNewArrivals();

    return (
        <main>
            <Header />

            <div className="hero-simple" style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, #1a365d 100%)',
                color: 'white',
                padding: '4rem 0',
                marginBottom: '3rem'
            }}>
                <div className="container">
                    <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>New Arrivals</h1>
                    <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>
                        Discover our latest additions to the inventory.
                    </p>
                </div>
            </div>

            <section className="container" style={{ paddingBottom: '5rem' }}>
                {products.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', background: '#f8fafc', borderRadius: '12px' }}>
                        <h3>No new arrivals at the moment.</h3>
                        <p>Please check back later for our latest products.</p>
                    </div>
                ) : (
                    <div className="grid">
                        {products.map((item) => (
                            <ProductCard key={item._id} product={item} />
                        ))}
                    </div>
                )}
            </section>

            <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', padding: '4rem 0' }}>
                <div className="container" style={{ textAlign: 'center', opacity: 0.8 }}>
                    <p>&copy; 2026 Selfmade Industrial Systems. All rights reserved.</p>
                </div>
            </footer>
        </main>
    );
}
