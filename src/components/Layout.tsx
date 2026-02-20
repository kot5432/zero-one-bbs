'use client';

import { ReactNode } from 'react';
import CommonHeader from '@/components/CommonHeader';
import Footer from '@/components/Footer';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <CommonHeader />
      <main className="max-w-7xl mx-auto px-6 py-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
