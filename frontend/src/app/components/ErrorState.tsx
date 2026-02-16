'use client';
import React, { useState } from 'react';
import { FiRefreshCw, FiAlertTriangle } from 'react-icons/fi';

interface ErrorStateProps {
    title?: string;
    message?: string;
    onRetry?: () => void;
    fullPage?: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({
    title = 'SYSTEM_OFFLINE',
    message = 'We encountered an error while connecting to the server.',
    onRetry,
    fullPage = false
}) => {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRetry = async () => {
        if (!onRetry) {
            window.location.reload();
            return;
        }

        setIsRefreshing(true);
        try {
            await onRetry();
        } finally {
            // Keep the "Refreshing..." text for a moment for better UX
            setTimeout(() => setIsRefreshing(false), 500);
        }
    };

    const content = (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-[#0F172A] rounded-[2rem] border border-red-500/20 shadow-2xl shadow-red-500/10 transition-all">
            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-8 text-red-500 relative">
                <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-25"></div>
                <FiAlertTriangle size={48} />
            </div>

            <h3 className="text-3xl font-black text-white mb-3 tracking-tight">
                {isRefreshing ? 'REFRESHING...' : title}
            </h3>

            <p className="text-gray-400 mb-10 max-w-sm mx-auto font-medium leading-relaxed">
                {isRefreshing ? 'Please wait while we attempt to re-establish connection.' : message}
            </p>

            <button
                onClick={handleRetry}
                disabled={isRefreshing}
                className="group relative flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl font-bold hover:from-red-500 hover:to-orange-500 transition-all active:scale-95 disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-red-600/20"
            >
                <FiRefreshCw className={`${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-700'}`} />
                <span className="tracking-wider uppercase text-sm">
                    {isRefreshing ? 'Refreshing...' : 'Retry Connection'}
                </span>
            </button>

            <div className="mt-8 flex items-center gap-2 text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Error Code: ERR_CONNECTION_FAILED
            </div>
        </div>
    );

    if (fullPage) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[#0F172A]">
                {content}
            </div>
        );
    }

    return content;
};

export default ErrorState;
