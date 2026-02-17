import HomeRenderer from '@/app/components/HomeRenderer';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AboutPage() {
    return (
        <HomeRenderer pageSlug="about" />
    );
}
