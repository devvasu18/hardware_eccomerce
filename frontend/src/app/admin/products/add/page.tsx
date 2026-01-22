"use client";

import ProductForm from "../../components/ProductForm";

export default function AddProductPage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-2">Add New Product</h1>
            <p className="text-slate-500 mb-8">Create a new product in the master database.</p>
            <ProductForm />
        </div>
    );
}
