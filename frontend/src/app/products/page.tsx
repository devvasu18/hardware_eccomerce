
import Link from 'next/link';
import Header from '@/app/components/Header';
import ProductCard from '@/app/components/ProductCard';

interface Product {
    _id: string;
    name: string;
    basePrice: number;
    discountedPrice: number;
    stock: number;
    category: string;
    images: string[];
    isOnDemand: boolean;
}

async function getAllProducts(category?: string | string[]): Promise<Product[]> {
    let url = 'http://localhost:5000/api/products';
    if (category) {
        url += `?category=${category}`;
    }
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
}

interface Props {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ProductsPage({ searchParams }: Props) {
    const resolvedSearchParams = await searchParams;
    const category = resolvedSearchParams?.category;
    let products: Product[] = [];

    try {
        products = await getAllProducts(category);
    } catch (error) {
        console.error("Failed to load products:", error);
    }

    return (
        <main>
            <Header />

            <div className="container" style={{ padding: '4rem 0' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>
                    {category ? `Category: ${category}` : 'Product Catalog'}
                </h1>
                <p style={{ marginBottom: '2rem', color: '#64748B' }}>
                    {category
                        ? `Browsing products in ${category}`
                        : 'Browse our complete range of industrial hardware.'}
                </p>

                <section>
                    {products.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}>
                            <h3 style={{ color: '#64748B' }}>No products found</h3>
                            <p>We couldn't find any products in this category.</p>
                            <Link href="/categories" style={{ display: 'inline-block', marginTop: '1rem', color: '#F37021', fontWeight: 600 }}>
                                ← Browse all Categories
                            </Link>
                        </div>
                    ) : (
                        <div className="grid">
                            {products.map((item) => (
                                <ProductCard key={item._id} product={item} />
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
