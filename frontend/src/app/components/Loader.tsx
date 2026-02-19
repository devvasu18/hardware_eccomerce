'use client';
import React from 'react';

interface LoaderProps {
  size?: number;
  color?: string;
  className?: string;
  text?: string;
  status?: 'loading' | 'error' | 'success';
  onRetry?: () => void;
}

const Loader = ({
  size = 40,
  color = 'var(--primary)',
  className = '',
  text,
  status = 'loading',
  onRetry
}: LoaderProps) => {

  if (status === 'error') {
    return (
      <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`} style={{ minHeight: '200px' }}>
        <div className="text-red-500 mb-4 text-4xl">⚠️</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{text || 'Something went wrong'}</h3>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <style jsx>{`
        .loader-container {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          min-height: 200px;
        }
        
        .spinner {
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-left-color: ${color};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div className={`loader-container ${className}`}>
        <div
          className="spinner"
          style={{
            width: size,
            height: size,
          }}
        />
      </div>
    </>
  );
};

export default Loader;
