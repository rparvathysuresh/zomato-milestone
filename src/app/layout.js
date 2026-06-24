import { Outfit, Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata = {
  title: 'Zomato AI — Smart Restaurant Recommendations',
  description:
    'Get personalized AI-powered restaurant recommendations based on your location, budget, cuisine preference, and more.',
  openGraph: {
    title: 'Zomato AI — Smart Restaurant Recommendations',
    description:
      'Get personalized AI-powered restaurant recommendations based on your location, budget, cuisine preference, and more.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${inter.variable}`}>
      <body style={{ fontFamily: 'var(--font-inter), Inter, sans-serif' }}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
