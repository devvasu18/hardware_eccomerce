import Link from 'next/link';
import Image from 'next/image';
import './CategorySection.css';

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
        // Silently fail during SSR - return empty array
        return [];
    }
}

export default async function CategorySection() {
    const categories = await getCategories();

    if (categories.length === 0) {
        return null; // Don't show section if no categories
    }

    return (
        <section className="category-section">
            <div className="container">
                <div className="section-header">
                    <div className="section-title-wrapper">
                        <h2 className="section-title">Shop by Category</h2>
                        <p className="section-subtitle">
                            Explore our comprehensive range of auto parts and accessories
                        </p>
                    </div>
                    <Link href="/products" className="view-all-link">
                        View All Categories
                        <span className="arrow">→</span>
                    </Link>
                </div>

                <div className="categories-grid">
                    {categories.map((category) => (
                        <Link
                            key={category._id}
                            href={`/products?category=${category.slug}`}
                            className="category-card"
                        >
                            <div
                                className="category-icon-wrapper"
                                style={{ background: category.gradient }}
                            >
                                <div className="category-image">
                                    {category.imageUrl ? (
                                        <Image
                                            src={category.imageUrl}
                                            alt={category.name}
                                            width={60}
                                            height={60}
                                            className="category-img"
                                        />
                                    ) : (
                                        <span className="category-placeholder">📦</span>
                                    )}
                                </div>
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
            </div>
        </section>
    );
}
