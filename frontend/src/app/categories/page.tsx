import Link from 'next/link';
import Image from 'next/image';
import './CategoriesPage.css';

interface Category {
    _id: string;
    name: string;
    slug: string;
    imageUrl: string;
    productCount: number;
    gradient: string;
    isActive: boolean;
}

async function getCategories(): Promise<Category[]> {
    try {
        const res = await fetch('http://localhost:5000/api/categories', {
            cache: 'no-store'
        });
        if (!res.ok) {
            return [];
        }
        return res.json();
    } catch (error) {
        return [];
    }
}

export default async function CategoriesPage() {
    const categories = await getCategories();

    return (
        <div className="categories-page">
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <div className="categories-page-header">
                    <h1 className="categories-page-title">All Categories</h1>
                    <p className="categories-page-subtitle">
                        Browse our complete catalog of industrial hardware and accessories
                    </p>
                </div>

                {categories.length > 0 ? (
                    <div className="categories-grid">
                        {categories.map((category) => (
                            <Link
                                key={category._id}
                                href={`/products?category=${category.slug}`}
                                className="category-card"
                            >
                                <div className="category-icon-wrapper">
                                    {category.imageUrl ? (
                                        <Image
                                            src={category.imageUrl}
                                            alt={category.name}
                                            width={80}
                                            height={80}
                                            className="category-img"
                                        />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                            📦
                                        </div>
                                    )}
                                </div>
                                <div className="category-info">
                                    <h3 className="category-name">{category.name}</h3>
                                    <p className="category-count">
                                        {category.productCount} Products
                                    </p>
                                </div>
                                <div className="category-arrow">
                                    →
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
                        <p>No categories found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
