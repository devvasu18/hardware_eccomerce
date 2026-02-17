'use client';
import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface LoaderProps {
  text?: string;
  status?: 'loading' | 'error' | 'success';
  onRetry?: () => void;
}

const Loader = ({ text: propText, status = 'loading', onRetry }: LoaderProps) => {
  const { t } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [displayText, setDisplayText] = useState(propText || t('initializing'));
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Colors based on status
  const primaryColor = status === 'error' ? '#ef4444' : 'var(--primary)';
  const secondaryColor = status === 'error' ? '#7f1d1d' : 'var(--secondary-lighter)';

  useEffect(() => {
    // If error, stop progress at random point or show 0
    if (status === 'error') {
      setProgress(0);
      return;
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, 20); // Faster speed: 2s total duration

    // Only cycle text if no propText provided and status is loading
    let textInterval: NodeJS.Timeout;
    if (!propText && status === 'loading') {
      textInterval = setInterval(() => {
        setDisplayText(prev => {
          if (prev === t('system_ready')) return t('system_ready');

          const states = [t('initializing'), t('connecting'), t('syncing_data'), t('preparing_assets')];
          const currentIndex = states.indexOf(prev);

          // If the current text isn't in states (e.g. customized), reset or keep
          if (currentIndex === -1) return states[0];

          return states[(currentIndex + 1) % states.length];
        });
      }, 400); // Faster text cycle
    } else if (propText && !isRefreshing) {
      setDisplayText(propText);
    }

    return () => {
      clearInterval(timer);
      if (textInterval) clearInterval(textInterval);
    };
  }, [status, propText, t]);

  // Force text update when progress hits 100
  useEffect(() => {
    if (progress === 100 && !propText && status === 'loading') {
      setDisplayText(t('system_ready'));
    }
  }, [progress, propText, status, t]);

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRefreshing(true);
    setDisplayText(t('refreshing'));
    try {
      await onRetry();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
        @keyframes ping-soft {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .loader-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: var(--background);
          color: var(--text-primary);
          overflow: hidden;
        }
        .grid-background {
          position: absolute;
          inset: 0;
          opacity: 0.1;
          pointer-events: none;
          background-image: linear-gradient(${secondaryColor} 1px, transparent 1px), linear-gradient(90deg, ${secondaryColor} 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
        }
        .perspective-container {
          perspective: 1000px;
          position: relative;
          width: 16rem; /* 64 */
          height: 16rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .outer-ring {
          position: absolute;
          inset: 0;
          border: 2px solid ${status === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(243, 112, 33, 0.2)'};
          border-radius: 50%;
          animation: spin 8s linear infinite;
        }
        .orb {
          position: absolute;
          width: 0.75rem; /* 3 */
          height: 0.75rem;
          background-color: ${primaryColor};
          border-radius: 50%;
          box-shadow: 0 0 10px ${primaryColor};
        }
        .orb-top { top: 0; left: 50%; transform: translate(-50%, -50%); }
        .orb-bottom { bottom: 0; left: 50%; transform: translate(-50%, 50%); }
        
        .middle-ring {
          position: absolute;
          inset: 2rem; /* 8 */
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: ${status === 'error' ? 'none' : 'spin-reverse 6s linear infinite'};
          border-color: ${status === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
        }
        
        .hex-core {
          position: relative;
          width: 6rem; /* 24 */
          height: 6rem;
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .clip-path-hexagon {
          position: absolute;
          inset: 0;
          background-color: ${status === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(243, 112, 33, 0.1)'};
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid ${status === 'error' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(243, 112, 33, 0.5)'};
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .inner-box {
          width: 3rem; /* 12 */
          height: 3rem;
          border: 2px solid ${primaryColor};
          transform: rotate(45deg);
        }
        .core-ping {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 1rem; /* 4 */
          height: 1rem;
          background-color: ${primaryColor};
          border-radius: 50%;
          box-shadow: 0 0 20px ${primaryColor};
          animation: ping-soft 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        
        .status-container {
          margin-top: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          z-index: 10;
        }
        .status-text {
          font-size: 1.5rem;
          font-weight: 700;
          letter-spacing: 0.2em;
          background: linear-gradient(to right, ${primaryColor}, #ffffff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .version-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #9ca3af;
          font-family: monospace;
        }
        .progress-track {
          margin-top: 1rem;
          width: 16rem;
          height: 0.25rem;
          background-color: #1f2937; /* gray-800 */
          border-radius: 9999px;
          overflow: hidden;
          position: relative;
          opacity: ${status === 'error' ? 0 : 1};
        }
        .progress-bar {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background-color: ${primaryColor};
          transition: width 75ms ease-out;
          box-shadow: 0 0 10px ${primaryColor};
        }
        .progress-glow {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 0.5rem;
          background-color: rgba(255,255,255,0.5);
          filter: blur(2px);
        }
        .retry-button {
          margin-top: 1.5rem;
          padding: 0.75rem 2rem;
          background: linear-gradient(to right, #ef4444, #f37021);
          border: none;
          border-radius: 9999px;
          color: white;
          font-weight: 700;
          font-family: monospace;
          letter-spacing: 0.1em;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .retry-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 25px rgba(239, 68, 68, 0.6);
        }
        .retry-button:active {
          transform: translateY(0);
        }
        .retry-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>

      <div className="loader-container">
        {/* Background Grid Effect */}
        <div className="grid-background" />

        {/* Main Animation Container */}
        <div className="perspective-container">

          {/* Outer Rotating Ring */}
          <div className="outer-ring">
            <div className="orb orb-top"></div>
            <div className="orb orb-bottom"></div>
          </div>

          {/* Middle Counter-Rotating Ring */}
          <div className="middle-ring"></div>

          {/* Inner Tech Geometric Shape */}
          <div className="hex-core">
            <div className="clip-path-hexagon">
              <div className="inner-box"></div>
            </div>
            <div className="core-ping"></div>
          </div>
        </div>

        {/* Text & Status */}
        <div className="status-container">
          <h2 className="status-text">
            {isRefreshing ? t('refreshing') : displayText}
          </h2>

          <div className="version-info">
            <span>{status === 'error' ? t('system_offline') : (isRefreshing ? 'REFRESHING' : t('system_ready'))}</span>
            <span style={{ width: 4, height: 4, backgroundColor: primaryColor, borderRadius: '50%' }}></span>
            <span>V 2.0.4</span>
          </div>

          {/* Retry Button */}
          {status === 'error' && onRetry && (
            <button
              className="retry-button"
              onClick={handleRetry}
              disabled={isRefreshing}
            >
              <svg
                style={{ width: '1.25rem', height: '1.25rem', animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? t('refreshing') : t('retry_connection')}
            </button>
          )}

          {/* Progress Bar */}
          <div className="progress-track" style={{ opacity: (status === 'error' || isRefreshing) ? 0 : 1 }}>
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            >
              <div className="progress-glow"></div>
            </div>
          </div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: primaryColor, fontFamily: 'monospace', letterSpacing: '0.1em', opacity: status === 'error' ? 0 : 1 }}>
            {progress}% {t('completed')}
          </div>
        </div>
      </div>
    </>
  );
};

export default Loader;
