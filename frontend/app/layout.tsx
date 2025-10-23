import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { RecaptchaProvider } from '@/lib/recaptcha/provider';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import Script from 'next/script';
import {GA_TRACKING_ID} from '../lib/utils/analytics'
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SynergyCare - Healthcare Management System',
  description: 'Modern healthcare management system with role-based access control',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <RecaptchaProvider>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <Header />
              <Navigation />
              <main>{children}</main>
            </div>
          </AuthProvider>
        </RecaptchaProvider>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
