
import Link from 'next/link';
import Header from '@/app/components/Header';
import ProductCard from '@/app/components/ProductCard';

interface Product {
    _id: string;
    name: string;
    basePrice: number;
    stock: number;
    category: string;
    images: string[];
    isOnDemand: boolean;
}

async function getAllProducts(): Promise<Product[]> {
    const res = await fetch('http://localhost:5000/api/products', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

export default async function ProductsPage() {
    let products: Product[] = [];
    try {
        products = await getAllProducts();
    } catch (error) {
        console.error("Failed to load products:", error);
    }

    return (
        <main>
            <Header />

            <div className="container" style={{ padding: '4rem 0' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Product Catalog</h1>
                <p style={{ marginBottom: '2rem', color: '#64748B' }}>Browse our complete range of industrial hardware.</p>

                {products.length === 0 ? (
                    <div style={{ padding: '4rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}>
                        <h3 style={{ color: '#64748B' }}>Catalog Unavailable</h3>
                        <p>We are currently updating our inventory. Please try again later.</p>
                    </div>
                ) : (
                    <div className="grid">
                        {products.map((item) => (
                            <ProductCard key={item._id} product={{ ...item, wholesalePrice: 0 }} />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
