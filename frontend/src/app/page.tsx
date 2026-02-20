import HomeRenderer from '@/app/components/HomeRenderer';

export default async function Home() {
    // Return skeleton immediately for perceived performance
    return (
        <HomeRenderer pageSlug="home" previewLayout={undefined} />
    );
}
