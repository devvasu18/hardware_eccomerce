import Header from '@/app/components/Header';
import HomeSkeleton from '@/app/components/skeletons/HomeSkeleton';

export default function Loading() {
    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <div className="flex-grow">
                <HomeSkeleton />
            </div>
        </main>
    );
}
