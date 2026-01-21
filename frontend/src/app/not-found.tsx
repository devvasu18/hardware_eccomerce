'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)',
            fontFamily: '"Outfit", sans-serif',
            textAlign: 'center',
            padding: '2rem'
        }}>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h1 style={{
                    fontSize: '8rem',
                    fontWeight: '900',
                    color: '#0f766e',
                    margin: 0,
                    lineHeight: 1,
                    textShadow: '4px 4px 0px rgba(15, 118, 110, 0.2)'
                }}>
                    404
                </h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                style={{ marginTop: '1rem', marginBottom: '2rem' }}
            >
                <h2 style={{
                    fontSize: '2rem',
                    color: '#115e59',
                    marginBottom: '1rem'
                }}>
                    Page Not Found
                </h2>
                <p style={{
                    fontSize: '1.1rem',
                    color: '#334155',
                    maxWidth: '500px',
                    margin: '0 auto'
                }}>
                    Oops! The page you are looking for doesn't exist or you don't have permission to access it.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
            >
                <Link href="/" style={{
                    padding: '12px 32px',
                    background: '#0f766e',
                    color: 'white',
                    borderRadius: '50px',
                    textDecoration: 'none',
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    boxShadow: '0 4px 14px 0 rgba(15, 118, 110, 0.39)',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    display: 'inline-block'
                }}>
                    Return Home
                </Link>
            </motion.div>
        </div>
    );
}
