
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Chamunda Industrial | Premium Hardware Marketplace',
    description: 'Industrial-grade mechanical parts and hardware e-commerce platform.',
};

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import CartSidebar from './components/CartSidebar';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <CartProvider>
                        {children}
                        <CartSidebar />
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
