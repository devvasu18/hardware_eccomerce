import type { Metadata, Viewport } from 'next';
import { Inter, Poppins } from 'next/font/google';
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
import AppShellSetup from '@/components/AppShellSetup';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const poppins = Poppins({
    weight: ['400', '500', '600', '700', '800', '900'],
    subsets: ['latin'],
    variable: '--font-poppins',
    display: 'swap',
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
};

export const metadata: Metadata = {
    title: 'Hardware Marketplace | Premium Quality Industrial Parts',
    description: 'Industrial-grade mechanical parts and hardware e-commerce platform.',
    manifest: '/manifest.json',
};

// Force dynamic rendering for all pages to prevent build timeouts
export const dynamic = 'force-dynamic';

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
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
                                        <AppShellSetup />
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
