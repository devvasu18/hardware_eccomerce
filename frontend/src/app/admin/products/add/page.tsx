import ProductForm from "../../components/ProductForm";

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';

export default function AddProductPage() {
    return (
        <div className="container">
            <h1 className="page-title">Add New Product</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Create a new product in the master database.</p>
            <ProductForm />
        </div>
    );
}
