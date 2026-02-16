import React, { useEffect, useState } from 'react';

const Loader = () => {
    const [progress, setProgress] = useState(0);
    const [text, setText] = useState('INITIALIZING');

    useEffect(() => {
        const timer = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) return 0;
                return prev + 1;
            });
        }, 30);

        const textInterval = setInterval(() => {
            const states = ['INITIALIZING', 'CONNECTING', 'SYNCING DATA', 'PREPARING ASSETS'];
            setText(prev => {
                const currentIndex = states.indexOf(prev);
                return states[(currentIndex + 1) % states.length];
            });
        }, 800);

        return () => {
            clearInterval(timer);
            clearInterval(textInterval);
        };
    }, []);

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
          background-color: #0F172A;
          color: white;
          overflow: hidden;
        }
        .grid-background {
          position: absolute;
          inset: 0;
          opacity: 0.1;
          pointer-events: none;
          background-image: linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px);
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
          border: 2px solid rgba(243, 112, 33, 0.2);
          border-radius: 50%;
          animation: spin 8s linear infinite;
        }
        .orb {
          position: absolute;
          width: 0.75rem; /* 3 */
          height: 0.75rem;
          background-color: #F37021;
          border-radius: 50%;
          box-shadow: 0 0 10px #F37021;
        }
        .orb-top { top: 0; left: 50%; transform: translate(-50%, -50%); }
        .orb-bottom { bottom: 0; left: 50%; transform: translate(-50%, 50%); }
        
        .middle-ring {
          position: absolute;
          inset: 2rem; /* 8 */
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          animation: spin-reverse 6s linear infinite;
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
          background-color: rgba(243, 112, 33, 0.1);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(243, 112, 33, 0.5);
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        .inner-box {
          width: 3rem; /* 12 */
          height: 3rem;
          border: 2px solid #F37021;
          transform: rotate(45deg);
        }
        .core-ping {
          position: absolute;
          inset: 0;
          margin: auto;
          width: 1rem; /* 4 */
          height: 1rem;
          background-color: #F37021;
          border-radius: 50%;
          box-shadow: 0 0 20px #F37021;
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
          background: linear-gradient(to right, #F37021, #ffffff);
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
        }
        .progress-bar {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          background-color: #F37021;
          transition: width 75ms ease-out;
          box-shadow: 0 0 10px #F37021;
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
                        {text}
                    </h2>

                    <div className="version-info">
                        <span>SYSTEM_READY</span>
                        <span style={{ width: 4, height: 4, backgroundColor: '#F37021', borderRadius: '50%' }}></span>
                        <span>V 2.0.4</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-track">
                        <div
                            className="progress-bar"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="progress-glow"></div>
                        </div>
                    </div>
                    <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#F37021', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                        {progress}% COMPLETED
                    </div>
                </div>
            </div>
        </>
    );
};

export default Loader;
