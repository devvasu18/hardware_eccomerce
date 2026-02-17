
import type { Metadata } from 'next';
import './globals.css';
import { NotificationProvider } from '@/context/NotificationContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import CartSidebar from './components/CartSidebar';
import WishlistSidebar from './components/WishlistSidebar';
import MobileBottomNav from './components/MobileBottomNav';

export const metadata: Metadata = {
    title: 'Hardware Marketplace | Premium Quality Industrial Parts',
    description: 'Industrial-grade mechanical parts and hardware e-commerce platform.',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'system';
                  var resolvedTheme = theme;
                  if (theme === 'system') {
                    resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.setAttribute('data-theme', resolvedTheme);
                  if (resolvedTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
                    }}
                />
            </head>
            <body>
                <LanguageProvider>
                    <AuthProvider>
                        <ThemeProvider>
                            <NotificationProvider>
                                <CartProvider>
                                    <WishlistProvider>
                                        {children}
                                        <CartSidebar />
                                        <WishlistSidebar />
                                        <MobileBottomNav />
                                    </WishlistProvider>
                                </CartProvider>
                            </NotificationProvider>
                        </ThemeProvider>
                    </AuthProvider>
                </LanguageProvider>
            </body>
        </html>
    );
}
