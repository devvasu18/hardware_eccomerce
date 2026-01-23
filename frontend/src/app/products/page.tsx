
import Link from 'next/link';
import Header from '@/app/components/Header';
import ProductCard from '@/app/components/ProductCard';

interface Product {
    _id: string;
    name: string; // Map title to name if needed
    title: string;
    basePrice: number;
    discountedPrice: number; // Map selling_price_a to this if needed
    selling_price_a: number;
    mrp: number;
    stock: number;
    category: any; // could be object or string depending on population
    featured_image?: string;
    images?: string[]; // Legacy support
    isOnDemand: boolean;
}

async function getAllProducts(category?: string | string[]): Promise<Product[]> {
    let url = 'http://localhost:5000/api/products';
    if (category) {
        url += `?category=${category}`;
    }
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();

    // Normalize data structure if needed
    return data.map((p: any) => ({
        ...p,
        name: p.title || p.name,
        // Ensure images array exists for frontend compatibility
        images: p.gallery_images && p.gallery_images.length > 0 ? p.gallery_images : (p.featured_image ? [p.featured_image] : []),
        basePrice: p.mrp || p.basePrice,
        discountedPrice: p.selling_price_a || p.discountedPrice
    }));
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
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            {/* Hero Section */}
            <div style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '3rem 0 3rem' }}>
                <div className="container">
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#0F172A' }}>
                        {category ? `Category: ${category}` : 'Industrial Auto Parts'}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: '#64748B', maxWidth: '600px' }}>
                        {category
                            ? `Explore our premium selection of ${category} designed for performance and durability.`
                            : 'Browse our complete catalog of high-performance auto parts, tools, and accessories. Quality guaranteed.'}
                    </p>
                </div>
            </div>

            {/* Product Grid Section */}
            <div className="container" style={{ padding: '3rem 2rem', flex: 1 }}>
                <section>
                    {products.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', maxWidth: '600px', margin: '0 auto' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <h3 style={{ color: '#0F172A', marginBottom: '0.5rem' }}>No products found</h3>
                            <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>We couldn't find any products in this category at the moment.</p>
                            <Link href="/categories" className="btn btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                                Browse Categories
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <p style={{ color: '#64748B', fontSize: '0.95rem' }}>
                                    Showing <strong style={{ color: '#0F172A' }}>{products.length}</strong> products
                                </p>
                                {/* Filter/Sort placeholders could go here */}
                            </div>

                            <div className="products-grid">
                                {products.map((item) => (
                                    <ProductCard key={item._id} product={{
                                        ...item,
                                        // If category is an ID (long string with numbers), show 'Auto Part' or try to get name from object
                                        category: typeof item.category === 'object' ? item.category.name : (item.category.length > 10 ? 'Auto Part' : item.category)
                                    }} />
                                ))}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </main>
    );
}
