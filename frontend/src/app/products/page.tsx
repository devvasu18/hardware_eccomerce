
import Link from 'next/link';
import Header from '@/app/components/Header';
import ProductFilters from '@/app/components/ProductFilters';
import ProductCard from '@/app/components/ProductCard';

interface Product {
    _id: string;
    name: string;
    title: string;
    basePrice: number;
    discountedPrice: number;
    selling_price_a: number;
    mrp: number;
    stock: number;
    category: any;
    featured_image?: string;
    images?: string[];
    isOnDemand: boolean;
    gallery_images?: string[];
    variations?: any[];
    models?: any[];
}

async function getFilters() {
    try {
        const [catRes, brandRes] = await Promise.all([
            fetch('http://localhost:5000/api/categories', { cache: 'no-store' }),
            fetch('http://localhost:5000/api/brands/featured', { cache: 'no-store' })
        ]);
        const categories = catRes.ok ? await catRes.json() : [];
        const brands = brandRes.ok ? await brandRes.json() : [];
        return { categories, brands };
    } catch (error) {
        console.error("Failed to fetch filters", error);
        return { categories: [], brands: [] };
    }
}

async function getAllProducts(category?: string | string[], brand?: string | string[], keyword?: string | string[], subcategory?: string | string[]): Promise<Product[]> {
    // ... (existing implementation)
    let url = 'http://localhost:5000/api/products?';
    if (category) url += `category=${category}&`;
    if (brand) url += `brand=${brand}&`;
    if (keyword) url += `keyword=${encodeURIComponent(keyword as string)}&`;
    if (subcategory) url += `subcategory=${subcategory}&`;

    // ... (rest of function)
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();

    const productsArray = Array.isArray(data) ? data : (data.products || []);

    return productsArray.map((p: any) => ({
        ...p,
        name: p.title || p.name,
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
    const brand = resolvedSearchParams?.brand;
    const keyword = resolvedSearchParams?.keyword;
    const subcategory = resolvedSearchParams?.subcategory;

    // Parallel data fetching
    const filtersData = getFilters();
    const productsData = getAllProducts(category, brand, keyword, subcategory);

    const [{ categories, brands }, products] = await Promise.all([filtersData, productsData.catch(() => [])]);

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />

            {/* Hero Section */}
            <div style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', padding: '3rem 0 3rem' }}>
                <div className="container">
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#0F172A' }}>
                        {keyword ? `Search Results: "${keyword}"` : (brand ? `Brand: ${brand}` : (category ? `Category: ${category}` : 'Industrial Auto Parts'))}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: '#64748B', maxWidth: '600px' }}>
                        {category
                            ? `Explore our premium selection of ${category} designed for performance and durability.`
                            : 'Browse our complete catalog of high-performance auto parts, tools, and accessories. Quality guaranteed.'}
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="container" style={{ padding: '3rem 0rem', maxWidth: '1400px', margin: '0 auto', flex: 1 }}>
                <div style={{ display: 'flex', gap: '3rem', alignItems: 'flex-start' }}>

                    {/* Sidebar Filters */}
                    <ProductFilters initialCategories={categories} initialBrands={brands} />

                    {/* Product Grid */}
                    <section style={{ flex: 1 }}>
                        {products.length === 0 ? (
                            <div style={{ padding: '4rem', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid #E2E8F0', maxWidth: '600px', margin: '0 auto' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                                <h3 style={{ color: '#0F172A', marginBottom: '0.5rem' }}>No products found</h3>
                                <p style={{ color: '#64748B', marginBottom: '1.5rem' }}>We couldn't find any products matching your filters.</p>
                                <Link href="/products" className="btn btn-primary" style={{ display: 'inline-flex', textDecoration: 'none' }}>
                                    Clear Filters
                                </Link>
                            </div>
                        ) : (
                            <>


                                <div className="products-grid">
                                    {products.map((item) => (
                                        <ProductCard key={item._id} product={{
                                            ...item,
                                            category: typeof item.category === 'object' ? item.category.name : (item.category.length > 10 ? 'Auto Part' : item.category)
                                        }} />
                                    ))}
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
