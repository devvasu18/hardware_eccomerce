import HomeRenderer from '@/app/components/HomeRenderer';

export default async function ProductsPage() {
    return (
        <div className="specific-products-page">
            <HomeRenderer pageSlug="products" />
        </div>
    );
}
