
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Chamunda Industrial | Premium Hardware Marketplace',
    description: 'Industrial-grade mechanical parts and hardware e-commerce platform.',
};

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import CartSidebar from './components/CartSidebar';
import WishlistSidebar from './components/WishlistSidebar';

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
                        <WishlistProvider>
                            {children}
                            <CartSidebar />
                            <WishlistSidebar />
                        </WishlistProvider>
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
