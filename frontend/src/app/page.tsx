import HomeRenderer from '@/app/components/HomeRenderer';

export default async function Home() {
    let layout = null;
    try {
        // Use environment variable for API URL in production
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

        // Fetch layout with timeout to prevent build hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

        const res = await fetch(`${apiUrl}/api/home-layout?page=home`, {
            cache: 'no-store',
            next: { revalidate: 0 },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (res.ok) {
            layout = await res.json();
        }
    } catch (error) {
        console.error('Failed to fetch layout:', error);
        // Continue with null layout - HomeRenderer will handle it
    }

    // Pass layout as previewLayout so HomeRenderer doesn't fetch again
    return (
        <HomeRenderer pageSlug="home" previewLayout={layout} />
    );
}
