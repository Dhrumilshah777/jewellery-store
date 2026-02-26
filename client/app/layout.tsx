import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: 'Jewellery Store | Gold & American Diamond',
  description: '14KT, 18KT, 22KT gold jewellery & American diamond (CZ). Ready stock & made-to-order. Pan India shipping.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased flex flex-col">
        <AuthProvider>
          <Header />
          <div className="flex-1 flex flex-col">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
