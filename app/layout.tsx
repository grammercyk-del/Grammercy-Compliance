import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gramercy Dashboard',
  description: 'Compliance dashboard for KIPL',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen antialiased" style={{ backgroundColor: '#F5F8F4', color: '#1A1F1A', fontFamily: "'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}