
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Hardware Marketplace | Premium Quality Industrial Parts',
    description: 'Industrial-grade mechanical parts and hardware e-commerce platform.',
};

import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import CartSidebar from './components/CartSidebar';
import WishlistSidebar from './components/WishlistSidebar';

import MobileBottomNav from './components/MobileBottomNav';

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
                            <MobileBottomNav />
                        </WishlistProvider>
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
