import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ReduxProvider from '@/components/providers/ReduxProvider';
import AuthProvider from '@/components/providers/AuthProvider';
import { ToastProvider } from '@/components/providers/ToastProvider';
import { Toaster } from 'sonner';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Intavia - Hire 5x Faster with AI',
  description:
    'Skip job boards and long application queues. Our AI interviews, evaluates, and shortlists top candidates — automatically.',
  keywords: 'AI hiring, automated interviews, candidate screening, recruitment, HR technology',
  authors: [{ name: 'Intavia' }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/images/logo.png" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ReduxProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ReduxProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
