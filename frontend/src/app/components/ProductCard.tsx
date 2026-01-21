'use client';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import ProductImage from './ProductImage';

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

export default function ProductCard({ product }: { product: Product }) {
    const { user } = useAuth();

    // Pricing Logic
    const originalPrice = product.basePrice;
    const sellingPrice = product.discountedPrice || product.basePrice; // Fallback if no discounted price

    let finalPrice = sellingPrice;
    if (user?.customerType === 'wholesale' && user.wholesaleDiscount) {
        finalPrice = Math.round(sellingPrice * (1 - user.wholesaleDiscount / 100));
    }

    return (
        <Link href={`/products/${product._id}`} className="product-card">
            <div className="product-card-image-container">
                {product.images && product.images.length > 0 ? (
                    <ProductImage
                        src={product.images[0]}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                ) : (
                    <div className="no-image-placeholder">
                        No Image
                    </div>
                )}


            </div>

            <div className="product-card-content">
                <p className="product-category">{product.category}</p>
                <h3 className="product-title" title={product.name}>{product.name}</h3>

                <div className="product-card-footer">
                    <div className="product-price">
                        <>
                            {(product.discountedPrice > 0 && product.discountedPrice < product.basePrice) && (
                                <span className="price-original">₹{originalPrice}</span>
                            )}
                            <span className="price-current">₹{finalPrice}</span>
                        </>
                    </div>

                    <div className="product-action">
                        <span className="btn-card-action">ADD</span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
