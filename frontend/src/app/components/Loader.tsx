import React from 'react';

const Loader = () => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/90 backdrop-blur-md transition-all duration-300">
            <div className="relative flex flex-col items-center justify-center gap-6">
                {/* Main Spinner */}
                <div className="relative w-24 h-24">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>

                    {/* Spinning Ring */}
                    <div className="absolute inset-0 border-4 border-[#F37021] border-t-transparent rounded-full animate-spin"></div>

                    {/* Inner Pulsing Circle */}
                    <div className="absolute inset-0 m-auto w-12 h-12 bg-[#F37021]/10 rounded-full animate-pulse"></div>

                    {/* Center Dot */}
                    <div className="absolute inset-0 m-auto w-3 h-3 bg-[#F37021] rounded-full shadow-[0_0_15px_rgba(243,112,33,0.6)]"></div>
                </div>

                {/* Loading Text */}
                <div className="flex flex-col items-center gap-2">
                    <h3 className="text-2xl font-bold text-[#0F172A] tracking-wider">
                        LOADING
                    </h3>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 bg-[#F37021] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                        <div className="w-2 h-2 bg-[#F37021] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-[#F37021] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Loader;
