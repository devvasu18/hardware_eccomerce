import HomeRenderer from '@/app/components/HomeRenderer';

export default async function Home() {
    let layout = null;
    try {
        // Fetch layout on server to trigger loading.tsx immediately
        const res = await fetch('http://localhost:5000/api/home-layout?page=home', {
            cache: 'no-store', // Ensure fresh data on refresh
            next: { revalidate: 0 }
        });

        if (res.ok) {
            layout = await res.json();
            // Force delay to ensure loader completes 100% animation (~2.3s)
            await new Promise(resolve => setTimeout(resolve, 2300));
        }
    } catch (error) {
        console.error('Failed to fetch layout:', error);
    }

    // Pass layout as previewLayout so HomeRenderer doesn't fetch again
    return (
        <HomeRenderer pageSlug="home" previewLayout={layout} />
    );
}
