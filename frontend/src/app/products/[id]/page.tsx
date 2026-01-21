
import Link from 'next/link';
import ProductActionArea from './ProductActionArea';
import Header from '@/app/components/Header';
import ProductImage from '@/app/components/ProductImage';

interface Product {
    _id: string;
    name: string;
    description: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: string;
    images: string[];
    isOnDemand: boolean;
}

async function getProduct(id: string): Promise<Product | null> {
    try {
        const res = await fetch(`http://localhost:5000/api/products`, { cache: 'no-store' });
        if (!res.ok) return null;
        const products: Product[] = await res.json();
        return products.find(p => p._id === id) || null;
    } catch (e) {
        return null;
    }
}

export default async function ProductDetailPage({ params }: { params: { id: string } }) {
    const product = await getProduct(params.id);

    if (!product) {
        return (
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h1>Product Not Found</h1>
                <Link href="/products" className="btn btn-primary">Back to Catalog</Link>
            </div>
        )
    }

    return (
        <main>
            <Header />

            <div className="container" style={{ padding: '4rem 0' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem' }}>
                    {/* Left: Images */}
                    <div>
                        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                            {product.images && product.images.length > 0 ? (
                                <ProductImage
                                    src={product.images[0]}
                                    alt={product.name}
                                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                />
                            ) : (
                                <div style={{ color: '#94a3b8' }}>No Image</div>
                            )}
                        </div>
                    </div>

                    {/* Right: Details & Action */}
                    <div>
                        <span className="badge" style={{ background: '#e2e8f0', color: '#475569', marginBottom: '1rem' }}>{product.category}</span>
                        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{product.name}</h1>
                        <p style={{ fontSize: '1.1rem', color: '#475569', marginBottom: '2rem', lineHeight: '1.8' }}>
                            {product.description || "No description available for this industrial component."}
                        </p>

                        <div style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', padding: '2rem 0', marginBottom: '2rem' }}>
                            {/* Pass data to Client Component for dynamic logic */}
                            <ProductActionArea product={product} />
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#64748B' }}>
                            <p><strong>SKU:</strong> IND-{product._id.slice(-6).toUpperCase()}</p>
                            <p><strong>Warranty:</strong> Manufacturer Standard</p>
                            <p><strong>Shipping:</strong> Local Bus Transport / Pickup</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
