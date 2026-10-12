import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import './globals.css';

const plex = IBM_Plex_Sans({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
});

export const metadata: Metadata = { title: 'Mihenk Müşteri Defteri' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={plex.variable}>
      <body>{children}</body>
    </html>
  );
}
