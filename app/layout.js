import './globals.css';
import SiteThemeProvider from '@/components/SiteThemeProvider';
import StatusBanner from '@/components/StatusBanner';
import BottomNav from '@/components/BottomNav';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'X Clone',
  description: 'A tweeting platform',
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#0A0A0A',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen safe-top safe-bottom">
        <SiteThemeProvider>
          <StatusBanner />
          <div className="max-w-6xl mx-auto flex">
            <Sidebar />
            <main className="flex-1 min-h-screen border-x border-border max-w-content w-full mx-auto">
              {children}
            </main>
          </div>
          <BottomNav />
        </SiteThemeProvider>
      </body>
    </html>
  );
}
