"use client";

import { useEffect, useState } from "react";
import api from "../../utils/api";
import Link from "next/link";
import Image from "next/image";
import { FiEdit2, FiTrash2, FiPlus, FiEye } from "react-icons/fi";

interface Product {
    _id: string;
    title: string;
    slug: string;
    category: {
        _id: string;
        name: string;
    };
    brand: {
        _id: string;
        name: string;
    };
    mrp: number;
    selling_price_a: number;
    selling_price_b: number;
    selling_price_c: number;
    opening_stock: number;
    featured_image: string;
    gst_rate: number;
    hsn_code: string;
}

export default function ProductList() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await api.get('/admin/products');
            setProducts(res.data);
        } catch (error) {
            console.error("Failed to fetch products", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await api.delete(`/admin/products/${id}`);
            setProducts(prev => prev.filter(p => p._id !== id));
            alert("Product deleted successfully");
        } catch (error) {
            console.error(error);
            alert("Failed to delete product");
        }
    };

    return (
        <div className="container mx-auto pb-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Product Manager</h1>
                    <p className="text-gray-500 text-sm">Manage inventory, pricing and specifications from here.</p>
                </div>
                <Link href="/admin/products/add" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center gap-2 font-medium">
                    <FiPlus /> Add New Product
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Product</th>
                            <th className="p-4 font-semibold text-slate-600 text-xs uppercase tracking-wider">Category & Brand</th>
                            <th className="p-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">Pricing (A/B/C)</th>
                            <th className="p-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-center">Stock</th>
                            <th className="p-4 font-semibold text-slate-600 text-xs uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map(product => (
                            <tr key={product._id} className="hover:bg-slate-50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 relative bg-gray-100 rounded-md overflow-hidden flex-shrink-0 border">
                                            {product.featured_image ? (
                                                <Image src={`/api/${product.featured_image}`} alt={product.title} fill className="object-contain" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold text-slate-700 clamp-1" title={product.title}>{product.title}</div>
                                            <div className="text-xs text-slate-400">SKU: {product.slug}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-medium text-slate-600">{product.category?.name || 'Uncategorized'}</div>
                                    <div className="text-xs text-slate-400">{product.brand?.name}</div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="font-bold text-slate-700">₹{product.selling_price_a}</div>
                                    <div className="text-xs text-slate-400">
                                        B: {product.selling_price_b || '-'} / C: {product.selling_price_c || '-'}
                                    </div>
                                    <div className="text-[10px] text-red-400 line-through">MRP: ₹{product.mrp}</div>
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${product.opening_stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                        {product.opening_stock}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/products/${product.slug}`} target="_blank" className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition"><FiEye /></Link>
                                        <Link href={`/admin/products/${product._id}/edit`} className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded transition"><FiEdit2 /></Link>
                                        <button onClick={() => handleDelete(product._id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"><FiTrash2 /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {loading && <div className="p-10 text-center text-slate-500">Loading inventory...</div>}
                {!loading && products.length === 0 && (
                    <div className="p-10 text-center flex flex-col items-center">
                        <div className="text-4xl mb-4">📦</div>
                        <h3 className="text-lg font-semibold text-slate-700">No Products Found</h3>
                        <p className="text-slate-500 mb-4">Start by adding your first product to the inventory.</p>
                        <Link href="/admin/products/add" className="text-orange-500 font-medium hover:underline">Add First Product</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
