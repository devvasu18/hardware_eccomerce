import ProductForm from "../../../components/ProductForm";

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    return (
        <div className="container">
            <h1 className="page-title">Edit Product</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Update product details.</p>
            <ProductForm productId={id} />
        </div>
    );
}
