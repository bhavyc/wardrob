import './globals.css';
import { DM_Sans, Playfair_Display } from 'next/font/google';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dmsans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata = {
  title: 'WARDROB — Premium Fashion Rental | Designer Wear on Demand',
  description: 'India\'s premier peer-to-peer luxury fashion rental platform. Rent designer lehengas, sarees, sherwanis & more for your special occasions.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)' }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
