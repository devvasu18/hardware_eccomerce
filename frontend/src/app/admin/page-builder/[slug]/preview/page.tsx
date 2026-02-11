'use client';

import React, { useEffect, useState } from 'react';
import HomeRenderer from '@/app/components/HomeRenderer';
import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';

export default function DynamicPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = React.use(params);
    const pageSlug = slug;
    const [previewLayout, setPreviewLayout] = useState<any[] | null>(null);

    useEffect(() => {
        // Load layout from localStorage specific to this page
        const stored = localStorage.getItem(`admin_preview_${pageSlug}`);
        if (stored) {
            try {
                const layout = JSON.parse(stored);
                // Filter only active components for realistic preview
                const activeLayout = layout.filter((item: any) => item.isActive);
                setPreviewLayout(activeLayout);
            } catch (e) {
                console.error('Failed to parse preview layout', e);
            }
        }
    }, [pageSlug]);

    if (!previewLayout) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">No Preview Data Found for {pageSlug}</h2>
                    <p className="text-gray-500 mb-4">Please generate a preview from the Page Builder.</p>
                    <Link href={`/admin/page-builder/${pageSlug}`} className="text-blue-600 hover:underline">
                        Return to Builder
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Preview Banner */}
            <div className="fixed top-0 left-0 right-0 bg-blue-600 text-white px-4 py-3 z-[99999] shadow-md flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">Preview Mode</span>
                    <p className="text-sm font-medium">You are viewing an unsaved version of the <span className="underline">{pageSlug}</span> page.</p>
                </div>
                <button
                    onClick={() => window.close()}
                    className="flex items-center gap-2 bg-white text-blue-600 px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-50 transition-colors"
                >
                    <FiArrowLeft /> Close Preview
                </button>
            </div>

            {/* Content pushed down by banner */}
            <div className="pt-12">
                <HomeRenderer previewLayout={previewLayout} pageSlug={pageSlug} />
            </div>
        </div>
    );
}
